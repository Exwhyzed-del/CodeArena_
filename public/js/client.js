const socket = io();
const state = {
    currentUser: null,
    authMode: 'login',
    currentRoomCode: null,
    isPracticeMode: false,
    selectedProblemId: null,
    currentLanguage: 'python',
    participants: [],
    timer: null,
    timeLeft: 900,
    problem: null,
    roomList: [],
    startTime: Date.now()
};

// ==========================================
// SOCKET EVENTS
// ==========================================
socket.on('connect', () => console.log("Connected"));
socket.on('lobbyUpdate', (data) => {
    if (data.type === 'add') {
        if (!state.roomList.find(r => r.code === data.room.code)) {
            state.roomList.unshift(data.room);
            ui.renderRoomList();
        }
    } else if (data.type === 'remove') {
        state.roomList = state.roomList.filter(r => r.code !== data.code);
        ui.renderRoomList();
    }
});

socket.on('roomCreated', ({ roomCode, problem, players }) => {
    ui.closeCreateModal();
    ui.toast(`Room Created: ${roomCode}`, "success");
    app.enterRoom(roomCode, problem, false, players);
});

socket.on('joinedRoom', ({ roomCode, problem, players }) => {
    app.enterRoom(roomCode, problem, false, players);
});

socket.on('updatePlayers', (players) => {
    state.participants = players;
    ui.renderLeaderboard();
});

socket.on('newMessage', ({ text, sender }) => {
    ui.addMessageToChat(sender, text, sender === state.currentUser?.name);
});

socket.on('error', (msg) => ui.toast(msg, "error"));

// ==========================================
// APP LOGIC
// ==========================================
const app = {
    init: () => {
        const session = localStorage.getItem('ca_session');
        if (session) {
            state.currentUser = JSON.parse(session);
            app.showDashboard();
        } else {
            app.renderAuthForm();
            document.getElementById('auth-view').classList.remove('hidden');
        }
    },

    toggleAuthMode: () => {
        state.authMode = state.authMode === 'login' ? 'signup' : 'login';
        app.renderAuthForm();
    },

    renderAuthForm: () => {
        const container = document.getElementById('auth-forms-container');
        const isSignup = state.authMode === 'signup';
        
        document.getElementById('auth-toggle-text').textContent = isSignup ? "Already have an account?" : "New here?";
        document.getElementById('auth-toggle-btn').textContent = isSignup ? "Login" : "Create Account";
        
        let html = '';
        if (isSignup) html += `<div class="form-group"><label>Username</label><input type="text" id="auth-username" placeholder="Name"></div>`;
        html += `
            <div class="form-group"><label>Email</label><input type="email" id="auth-email" placeholder="email@example.com"></div>
            <div class="form-group"><label>Password</label><input type="password" id="auth-password" placeholder="password"></div>
            <button class="btn-primary w-full" onclick="app.handleAuth()">${isSignup ? 'Sign Up' : 'Log In'}</button>
        `;
        container.innerHTML = html;
    },

    handleAuth: async () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const username = document.getElementById('auth-username')?.value;
        
        if (!email || !password) return ui.toast("Email and password required", "error");

        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name: username, isSignup: state.authMode === 'signup' })
        });

        const data = await res.json();
        if (res.ok) {
            state.currentUser = data.user;
            localStorage.setItem('ca_session', JSON.stringify(data.user));
            ui.toast("Success!", "success");
            app.showDashboard();
        } else {
            ui.toast(data.error || "Error", "error");
        }
    },

    logout: () => { 
        localStorage.removeItem('ca_session'); 
        location.reload(); 
    },

    showDashboard: () => {
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        document.getElementById('user-display').textContent = state.currentUser.name;
        ui.renderRoomList();
        ui.renderPracticeList();
    },

    confirmCreateStandard: () => {
        if (!state.selectedProblemId) return ui.toast("Select a problem", "error");
        socket.emit('createRoom', { problemId: state.selectedProblemId, user: state.currentUser });
    },

    confirmCreateCustom: () => {
        const title = document.getElementById('custom-title').value;
        const desc = document.getElementById('custom-desc').value;
        const diff = document.getElementById('custom-difficulty').value;
        const hiddenJson = document.getElementById('custom-hidden-json').value;
        
        // Gather Samples
        const samples = [];
        for(let i=1; i<=3; i++) {
            const inp = document.getElementById(`custom-sample-in-${i}`).value;
            const out = document.getElementById(`custom-sample-out-${i}`).value;
            if(inp && out) samples.push({ input: inp, output: out });
        }

        if (!title || samples.length === 0) return ui.toast("Title and at least one Sample are required", "error");

        let hiddenCases = [];
        try {
            if (hiddenJson) hiddenCases = JSON.parse(hiddenJson);
        } catch (e) {
            return ui.toast("Hidden Test Cases JSON is invalid", "error");
        }

        socket.emit('createRoom', {
            user: state.currentUser,
            customProblem: {
                title, description: desc, difficulty: diff,
                samples, hiddenCases
            }
        });
    },

    confirmJoinRoom: () => {
        const code = document.getElementById('modal-join-code').value.trim().toUpperCase();
        if (!code) return;
        ui.closeJoinModal();
        socket.emit('joinRoom', { roomCode: code, user: state.currentUser });
    },

    startPractice: async (problemId) => {
        try {
            const res = await fetch(`/api/problem/${problemId}`);
            const problem = await res.json();
            app.enterRoom('PRACTICE', problem, true, []);
        } catch(e) {
            ui.toast("Error loading problem", "error");
        }
    },

    enterRoom: (roomCode, problem, isPractice, players) => {
        state.currentRoomCode = roomCode;
        state.problem = problem;
        state.participants = players || [];
        state.isPracticeMode = isPractice;
        state.startTime = Date.now();
        
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('arena-view').classList.remove('hidden');
        
        const rightPanel = document.getElementById('right-panel');
        const timerContainer = document.getElementById('timer-container');
        const modeBadge = document.getElementById('mode-badge');
        
        if (isPractice) {
            rightPanel.style.display = 'none';
            timerContainer.style.display = 'none';
            modeBadge.textContent = "PRACTICE";
            modeBadge.className = "mode-indicator mode-practice";
            document.getElementById('room-code-btn').classList.add('hidden');
        } else {
            rightPanel.style.display = 'flex';
            timerContainer.style.display = 'block';
            modeBadge.textContent = "BATTLE";
            modeBadge.className = "mode-indicator mode-battle";
            document.getElementById('room-code-btn').classList.remove('hidden');
            document.getElementById('room-code-btn').textContent = `ROOM: ${roomCode}`;
            ui.renderLeaderboard();
            if (state.timer) clearInterval(state.timer);
            state.timeLeft = 900;
            state.timer = setInterval(() => {
                state.timeLeft--;
                ui.updateTimer();
                if (state.timeLeft <= 0) app.endGame();
            }, 1000);
        }

        ui.renderProblem(problem);
        editor.resetEditor();
    },

    leaveRoom: () => {
        if(state.timer) clearInterval(state.timer);
        document.getElementById('arena-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
    },
    
    copyRoomCode: () => { navigator.clipboard.writeText(state.currentRoomCode); ui.toast("Copied!"); },
    
    sendChat: () => {
        const input = document.getElementById('chat-msg');
        const text = input.value.trim();
        if(!text) return;
        socket.emit('sendMessage', { roomCode: state.currentRoomCode, text, sender: state.currentUser.name });
        input.value = '';
    },
    
    endGame: () => { clearInterval(state.timer); ui.toast("Time's Up!"); }
};

// ==========================================
// EDITOR LOGIC
// ==========================================
const editor = {
    resetEditor: () => {
        const lang = state.currentLanguage;
        document.getElementById('code-editor').value = state.problem?.templates?.[lang] || "";
        editor.updateLineNumbers();
    },
    
    changeLanguage: (lang) => {
        state.currentLanguage = lang;
        const ext = lang === 'python' ? 'py' : (lang === 'cpp' ? 'cpp' : 'java');
        document.getElementById('filename-display').textContent = `main.${ext}`;
        editor.resetEditor();
    },

    handleTab: (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const txt = e.target;
            txt.value = txt.value.substring(0, txt.selectionStart) + "    " + txt.value.substring(txt.selectionEnd);
        }
    },
    syncScroll: () => { document.getElementById('line-numbers').scrollTop = document.getElementById('code-editor').scrollTop; },
    updateLineNumbers: () => {
        const lines = document.getElementById('code-editor').value.split('\n').length;
        document.getElementById('line-numbers').innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
    },
    toggleConsole: () => { document.getElementById('console-overlay').classList.toggle('open'); },
    
    runCode: async () => {
        const code = document.getElementById('code-editor').value;
        const input = document.getElementById('custom-input-area')?.value || "";
        const lang = state.currentLanguage;

        document.getElementById('console-overlay').classList.add('open');
        ui.logConsole(`Running ${lang}...`, "info");

        try {
            const res = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language: lang, input })
            });
            const data = await res.json();
            
            document.getElementById('console-output').innerHTML = '';
            ui.logConsole(`Output:\n${data.output}`, data.status === 'error' ? 'error' : 'info');
        } catch (err) {
            ui.logConsole("Server error", "error");
        }
    },

    submitCode: async () => {
        const code = document.getElementById('code-editor').value;
        const timeElapsed = (Date.now() - state.startTime) / 1000;
        const lang = state.currentLanguage;
        
        document.getElementById('console-overlay').classList.add('open');
        ui.logConsole("Submitting...", "info");

        try {
            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code, 
                    language: lang, 
                    roomCode: state.currentRoomCode, 
                    timeElapsed,
                    problemId: state.problem.id 
                })
            });
            const data = await res.json();
            
            document.getElementById('console-output').innerHTML = '';
            if (data.status === 'accepted') {
                ui.logConsole(`✅ ${data.message}`, "success");
                if (!state.isPracticeMode) {
                    socket.emit('submitScore', { roomCode: state.currentRoomCode, score: data.score });
                }
            } else {
                ui.logConsole(`❌ ${data.message}`, "error");
            }
        } catch (err) {
            ui.logConsole("Server error", "error");
        }
    }
};

// ==========================================
// UI HELPERS
// ==========================================
const ui = {
    toast: (msg, type = 'info') => {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = 'toast'; el.textContent = msg;
        el.style.borderLeftColor = type === 'success' ? 'var(--success)' : (type === 'error' ? 'var(--danger)' : 'var(--accent-primary)');
        container.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
    },
    
    switchTab: (tab) => {
        document.querySelectorAll('.dashboard-nav .nav-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        document.getElementById('view-multiplayer').classList.toggle('hidden', tab !== 'multiplayer');
        document.getElementById('view-practice').classList.toggle('hidden', tab !== 'practice');
    },

    switchCreateTab: (tab) => {
        document.querySelectorAll('#create-room-modal .nav-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        document.getElementById('create-standard-view').classList.toggle('hidden', tab !== 'standard');
        document.getElementById('create-custom-view').classList.toggle('hidden', tab !== 'custom');
    },

    renderRoomList: () => {
        const container = document.getElementById('room-list');
        if (state.roomList.length === 0) {
            container.innerHTML = `<div class="text-muted text-center w-full">No active rooms.</div>`; return;
        }
        container.innerHTML = state.roomList.map(r => `
            <div class="card">
                <div class="flex justify-between">
                    <span class="font-mono">${r.code}</span>
                    <span class="text-success">● Live</span>
                </div>
                <div style="margin: 0.5rem 0;">${r.title}</div>
                <button class="btn-primary w-full" onclick="document.getElementById('modal-join-code').value='${r.code}'; ui.openJoinModal();">Join</button>
            </div>
        `).join('');
    },

    renderPracticeList: () => {
        const container = document.getElementById('practice-list');
        const problems = [
            { id: 1, title: "A + B Problem", diff: "Easy", desc: "Calculate sum." },
            { id: 2, title: "Reverse String", diff: "Easy", desc: "Reverse a string." },
            { id: 3, title: "Even or Odd", diff: "Easy", desc: "Check parity." },
            { id: 4, title: "Max in Array", diff: "Easy", desc: "Find maximum." },
            { id: 5, title: "Sum of Digits", diff: "Easy", desc: "Sum digits." },
            { id: 6, title: "Palindrome", diff: "Easy", desc: "Check palindrome." },
            { id: 7, title: "Factorial", diff: "Easy", desc: "Compute factorial." },
            { id: 8, title: "Prime Check", diff: "Medium", desc: "Check prime." },
            { id: 9, title: "Fibonacci", diff: "Medium", desc: "Nth Fibonacci." },
            { id: 10, title: "Reverse Words", diff: "Medium", desc: "Reverse words." }
        ];
        
        container.innerHTML = problems.map(p => `
            <div class="card practice">
                <h4 style="font-size:1.1rem;">${p.title}</h4>
                <p class="text-sm text-muted" style="margin: 10px 0;">${p.desc}</p>
                <div class="card-meta">
                    <span class="badge ${p.diff.toLowerCase()}">${p.diff}</span>
                    <button class="btn-secondary btn-sm" onclick="app.startPractice(${p.id})">Solve</button>
                </div>
            </div>
        `).join('');
    },

    openCreateModal: () => {
        const list = document.getElementById('problem-selection-list');
        const problems = [
            {id:1, t:"A+B"}, {id:2, t:"Reverse String"}, {id:3, t:"Even/Odd"}, 
            {id:4, t:"Max Array"}, {id:5, t:"Digit Sum"}, {id:6, t:"Palindrome"},
            {id:7, t:"Factorial"}, {id:8, t:"Prime"}, {id:9, t:"Fibonacci"}, {id:10, t:"Rev Words"}
        ];
        
        list.innerHTML = problems.map(p => `
            <div class="problem-card ${state.selectedProblemId === p.id ? 'selected' : ''}" onclick="state.selectedProblemId=${p.id}; ui.openCreateModal();">
                <strong>${p.t}</strong>
            </div>
        `).join('');
        
        document.getElementById('create-room-modal').classList.remove('hidden');
        ui.switchCreateTab('standard');
    },
    closeCreateModal: () => document.getElementById('create-room-modal').classList.add('hidden'),
    openJoinModal: () => document.getElementById('join-room-modal').classList.remove('hidden'),
    closeJoinModal: () => document.getElementById('join-room-modal').classList.add('hidden'),

    renderProblem: (prob) => {
        // Check for multiple samples (Custom Problem)
        let samplesHtml = '';
        if (prob.samples && prob.samples.length > 0) {
            prob.samples.forEach((s, i) => {
                samplesHtml += `
                    <div style="margin-top:1rem;">
                        <div style="font-weight:600; color:var(--accent-primary);">Sample Input ${i+1}:</div>
                        <div class="sample-case">${s.input}</div>
                        <div style="font-weight:600; color:var(--accent-primary);">Sample Output ${i+1}:</div>
                        <div class="sample-case">${s.output}</div>
                    </div>
                `;
            });
        } else {
            // Standard problem
            samplesHtml = `
                <div style="font-weight:600; color:var(--accent-primary);">Sample Input:</div>
                <div class="sample-case">${prob.sampleInput}</div>
                <div style="font-weight:600; color:var(--accent-primary);">Sample Output:</div>
                <div class="sample-case">${prob.sampleOutput}</div>
            `;
        }

        document.getElementById('problem-description').innerHTML = `
            <h3>${prob.title} <span class="badge ${prob.difficulty?.toLowerCase()}">${prob.difficulty}</span></h3>
            <p style="margin: 1rem 0;">${prob.description}</p>
            ${samplesHtml}
            
            <div class="custom-input-area">
                <label>Test Input (Used for Run)</label>
                <textarea id="custom-input-area">${prob.sampleInput || (prob.samples ? prob.samples[0].input : "")}</textarea>
            </div>
        `;
    },

    logConsole: (msg, type) => {
        const box = document.getElementById('console-output');
        const line = document.createElement('div');
        line.className = `log-entry log-${type}`;
        line.textContent = msg;
        box.appendChild(line);
        box.scrollTop = box.scrollHeight;
    },

    renderLeaderboard: () => {
        const list = document.getElementById('leaderboard');
        const sorted = [...state.participants].sort((a,b) => b.score - a.score);
        list.innerHTML = sorted.map((p, i) => `
            <li class="leaderboard-item ${p.id === socket.id ? 'me' : ''}">
                <div class="flex items-center gap-2">
                    <span style="width:20px">#${i+1}</span>
                    <div class="avatar" style="background:${p.avatarColor}">${p.name[0]}</div>
                    <span>${p.name}</span>
                </div>
                <span style="color:var(--success); font-weight:bold;">${p.score}</span>
            </li>
        `).join('');
    },

    updateTimer: () => {
        const m = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
        const s = (state.timeLeft % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').textContent = `${m}:${s}`;
    },

    addMessageToChat: (user, text, isMe) => {
        const box = document.getElementById('chat-box');
        const div = document.createElement('div');
        div.innerHTML = `<strong style="color:${isMe ? 'var(--accent-primary)' : 'var(--accent-secondary)'}">${user}:</strong> ${text}`;
        box.appendChild(div);
    }
};

window.onload = app.init;