const socket = io();
const state = {
<<<<<<< HEAD
    currentUser: null, authMode: 'login', currentRoomCode: null, isPracticeMode: false,
    selectedProblemId: null, currentLanguage: 'python', participants: [], timer: null,
    timeLeft: 900, problem: null, roomList: [], startTime: Date.now()
};

// --- SOCKET EVENTS ---
socket.on('connect', () => console.log("Connected"));
socket.on('lobbyUpdate', (data) => {
    if (data.type === 'add') { if (!state.roomList.find(r => r.code === data.room.code)) state.roomList.unshift(data.room); }
    else if (data.type === 'remove') state.roomList = state.roomList.filter(r => r.code !== data.code);
    ui.renderRoomList();
});
socket.on('roomCreated', (d) => { ui.closeCreateModal(); ui.toast(`Room Created: ${d.roomCode}`, "success"); app.enterRoom(d.roomCode, d.problem, false, d.players); });
socket.on('joinedRoom', (d) => app.enterRoom(d.roomCode, d.problem, false, d.players));
socket.on('updatePlayers', (p) => { state.participants = p; ui.renderLeaderboard(); });
socket.on('newMessage', (d) => ui.addMessageToChat(d.sender, d.text, d.sender === state.currentUser?.name));
socket.on('error', (m) => ui.toast(m, "error"));

// --- APP LOGIC ---
const app = {
    init: () => { 
        // Load theme
        const savedTheme = localStorage.getItem('ca_theme') || 'default';
        ui.changeTheme(savedTheme);
        if (document.getElementById('theme-select')) {
            document.getElementById('theme-select').value = savedTheme;
        }

        const s = localStorage.getItem('ca_session'); 
        if (s) { 
            state.currentUser = JSON.parse(s); 
            app.showApp(); 
        } else { 
            app.renderAuthForm(); 
            document.getElementById('auth-view').classList.remove('hidden'); 
        } 
    },
    toggleAuthMode: () => { state.authMode = state.authMode === 'login' ? 'signup' : 'login'; app.renderAuthForm(); },
    renderAuthForm: () => { const c = document.getElementById('auth-forms-container'); const su = state.authMode === 'signup'; document.getElementById('auth-toggle-text').textContent = su ? "Already have an account?" : "New here?"; document.getElementById('auth-toggle-btn').textContent = su ? "Login" : "Create Account"; let h = ''; if (su) h += `<div class="form-group"><label>Username</label><input type="text" id="auth-username"></div>`; h += `<div class="form-group"><label>Email</label><input type="email" id="auth-email"></div><div class="form-group"><label>Password</label><input type="password" id="auth-password"></div><button class="btn-primary w-full" onclick="app.handleAuth()">${su ? 'Sign Up' : 'Log In'}</button>`; c.innerHTML = h; },
    handleAuth: async () => { const e = document.getElementById('auth-email').value, p = document.getElementById('auth-password').value, u = document.getElementById('auth-username')?.value; if (!e || !p) return ui.toast("Required", "error"); const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e, password: p, name: u, isSignup: state.authMode === 'signup' }) }); const d = await r.json(); if (r.ok) { state.currentUser = d.user; localStorage.setItem('ca_session', JSON.stringify(d.user)); app.showApp(); } else ui.toast(d.error || "Error", "error"); },
    logout: () => { localStorage.removeItem('ca_session'); location.reload(); },
    showApp: () => { document.getElementById('auth-view').classList.add('hidden'); document.getElementById('app-view').classList.remove('hidden'); document.getElementById('user-display-nav').textContent = state.currentUser.name; ui.renderProblemGrid(); ui.renderRoomList(); },
    confirmCreateStandard: () => { if (!state.selectedProblemId) return ui.toast("Select a problem", "error"); socket.emit('createRoom', { problemId: state.selectedProblemId, user: state.currentUser }); },
    confirmCreateCustom: () => { const t = document.getElementById('custom-title').value, d = document.getElementById('custom-desc').value, f = document.getElementById('custom-difficulty').value, hj = document.getElementById('custom-hidden-json').value; const s = []; for(let i=1; i<=3; i++) { const ip = document.getElementById(`custom-sample-in-${i}`).value, op = document.getElementById(`custom-sample-out-${i}`).value; if(ip && op) s.push({ input: ip, output: op }); } if (!t || s.length === 0) return ui.toast("Title and at least one Sample are required", "error"); let hc = []; try { if (hj) hc = JSON.parse(hj); } catch (e) { return ui.toast("Hidden Test Cases JSON invalid", "error"); } socket.emit('createRoom', { user: state.currentUser, customProblem: { title: t, description: d, difficulty: f, samples: s, hiddenCases: hc } }); },
    confirmJoinRoom: (fromAlt) => { 
        const inputId = fromAlt ? 'modal-join-code-alt' : 'modal-join-code';
        const input = document.getElementById(inputId);
        if (!input) return;
        const code = input.value.trim().toUpperCase(); 
        if (!code) return; 
        socket.emit('joinRoom', { roomCode: code, user: state.currentUser }); 
    },
    startPractice: async (problemId) => { try { const res = await fetch(`/api/problem/${problemId}`); const problem = await res.json(); app.enterRoom('PRACTICE', problem, true, []); } catch(e) { ui.toast("Error loading problem", "error"); } },
    enterRoom: (roomCode, problem, isPractice, players) => { state.currentRoomCode = roomCode; state.problem = problem; state.participants = players || []; state.isPracticeMode = isPractice; state.startTime = Date.now(); document.getElementById('app-view').classList.add('hidden'); document.getElementById('arena-view').classList.remove('hidden'); const rp = document.getElementById('right-panel'), tc = document.getElementById('timer-container'), mb = document.getElementById('mode-badge'); if (isPractice) { rp.style.display = 'none'; tc.style.display = 'none'; mb.textContent = "PRACTICE"; mb.className = "mode-indicator mode-practice"; document.getElementById('room-code-btn').classList.add('hidden'); } else { rp.style.display = 'flex'; tc.style.display = 'block'; mb.textContent = "BATTLE"; mb.className = "mode-indicator mode-battle"; document.getElementById('room-code-btn').classList.remove('hidden'); document.getElementById('room-code-btn').textContent = `ROOM: ${roomCode}`; ui.renderLeaderboard(); if (state.timer) clearInterval(state.timer); state.timeLeft = 900; state.timer = setInterval(() => { state.timeLeft--; ui.updateTimer(); if (state.timeLeft <= 0) app.endGame(); }, 1000); } ui.renderProblem(problem); editor.resetEditor(); },
    leaveRoom: () => { if(state.timer) clearInterval(state.timer); document.getElementById('arena-view').classList.add('hidden'); document.getElementById('app-view').classList.remove('hidden'); },
    copyRoomCode: () => { navigator.clipboard.writeText(state.currentRoomCode); ui.toast("Copied!"); },
    sendChat: () => { const input = document.getElementById('chat-msg'); const text = input.value.trim(); if(!text) return; socket.emit('sendMessage', { roomCode: state.currentRoomCode, text, sender: state.currentUser.name }); input.value = ''; },
    endGame: () => { clearInterval(state.timer); ui.toast("Time's Up!"); }
};

// --- EDITOR LOGIC ---
const editor = {
    resetEditor: () => { const lang = state.currentLanguage; document.getElementById('code-editor').value = state.problem?.templates?.[lang] || ""; editor.updateLineNumbers(); },
    changeLanguage: (lang) => { state.currentLanguage = lang; document.getElementById('filename-display').textContent = `main.${lang === 'python' ? 'py' : (lang === 'cpp' ? 'cpp' : 'java')}`; editor.resetEditor(); },
    handleTab: (e) => { if (e.key === 'Tab') { e.preventDefault(); const t = e.target; t.value = t.value.substring(0, t.selectionStart) + "    " + t.value.substring(t.selectionEnd); } },
    syncScroll: () => { document.getElementById('line-numbers').scrollTop = document.getElementById('code-editor').scrollTop; },
    updateLineNumbers: () => { document.getElementById('line-numbers').innerHTML = Array(document.getElementById('code-editor').value.split('\n').length).fill(0).map((_, i) => i + 1).join('<br>'); },
    toggleConsole: () => { document.getElementById('console-overlay').classList.toggle('open'); },
    runCode: async () => { 
        const code = document.getElementById('code-editor').value, input = document.getElementById('custom-input-area')?.value || ""; 
        document.getElementById('console-overlay').classList.add('open'); 
        ui.logConsole("Running...", "info"); 
        try { 
            const res = await fetch('/api/run', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.currentUser?.token}`
                }, 
                body: JSON.stringify({ code, language: state.currentLanguage, input }) 
            }); 
            const d = await res.json(); 
            document.getElementById('console-output').innerHTML = ''; 
            ui.logConsole(`Output:\n${d.output}`, d.status === 'error' ? 'error' : 'info'); 
        } catch (e) { 
            ui.logConsole("Server error", "error"); 
        } 
    },
    submitCode: async () => { 
        const code = document.getElementById('code-editor').value, timeElapsed = (Date.now() - state.startTime) / 1000; 
        document.getElementById('console-overlay').classList.add('open'); 
        ui.logConsole("Submitting...", "info"); 
        try { 
            const res = await fetch('/api/submit', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.currentUser?.token}`
                }, 
                body: JSON.stringify({ code, language: state.currentLanguage, roomCode: state.currentRoomCode, timeElapsed, problemId: state.problem.id }) 
            }); 
            const d = await res.json(); 
            document.getElementById('console-output').innerHTML = ''; 
            if (d.status === 'accepted') { 
                ui.logConsole(`✅ ${d.message}`, "success"); 
                if (!state.isPracticeMode) socket.emit('submitScore', { roomCode: state.currentRoomCode, score: d.score }); 
            } else ui.logConsole(`❌ ${d.message}`, "error"); 
        } catch (e) { 
            ui.logConsole("Server error", "error"); 
        } 
    }
};

// --- UI HELPERS ---
const ui = {
    
    toast: (m, t = 'info') => { const e = document.createElement('div'); e.className = 'toast'; e.textContent = m; e.style.borderLeftColor = t === 'success' ? 'var(--success)' : (t === 'error' ? 'var(--danger)' : 'var(--accent-primary)'); document.getElementById('toast-container').appendChild(e); setTimeout(() => { e.style.opacity = '0'; setTimeout(() => e.remove(), 300); }, 3000); },
    
    changeTheme: (theme) => {
        document.body.classList.remove('theme-neumorphism', 'theme-animation', 'theme-pixel');
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        localStorage.setItem('ca_theme', theme);
    },
    
    navigateTo: (section) => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[onclick="ui.navigateTo('${section}')"]`).classList.add('active');
        
        document.getElementById('section-hero').classList.toggle('hidden', section !== 'problems');
        document.getElementById('section-problems').classList.toggle('hidden', section !== 'problems');
        document.getElementById('section-arena').classList.toggle('hidden', section !== 'arena');
        document.getElementById('section-leaderboard').classList.toggle('hidden', section !== 'leaderboard');
        
        if (section === 'problems') ui.renderProblemGrid();
    },

    scrollToProblems: () => { document.getElementById('section-problems').scrollIntoView({ behavior: 'smooth' }); },

    filterProblems: (diff) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.filter-btn[onclick="ui.filterProblems('${diff}')"]`).classList.add('active');
        ui.renderProblemGrid(diff);
    },

    renderProblemGrid: (filter = 'all') => {
        const container = document.getElementById('problem-grid');
        const problems = [
            { id: 1, t: "A + B", d: "Easy", desc: "Calculate sum." },
            { id: 2, t: "Reverse String", d: "Easy", desc: "Reverse a string." },
            { id: 3, t: "Even or Odd", d: "Easy", desc: "Check parity." },
            { id: 4, t: "Max in Array", d: "Easy", desc: "Find max." },
            { id: 5, t: "Sum of Digits", d: "Easy", desc: "Sum digits." },
            { id: 6, t: "Palindrome", d: "Easy", desc: "Check palindrome." },
            { id: 7, t: "Factorial", d: "Easy", desc: "Compute factorial." },
            { id: 8, t: "Prime Check", d: "Medium", desc: "Check prime." },
            { id: 9, t: "Fibonacci", d: "Medium", desc: "Nth Fibonacci." },
            { id: 10, t: "Reverse Words", d: "Medium", desc: "Reverse words." }
        ];

        const filtered = filter === 'all' ? problems : problems.filter(p => p.d.toLowerCase() === filter);

        container.innerHTML = filtered.map(p => `
            <div class="problem-card-new" onclick="app.startPractice(${p.id})">
                <div class="problem-info">
                    <h3>${p.t}</h3>
                    <p>${p.desc}</p>
                </div>
                <span class="badge-new ${p.d.toLowerCase()}">${p.d}</span>
=======
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
        const sampleIn = document.getElementById('custom-sample-in').value;
        const sampleOut = document.getElementById('custom-sample-out').value;
        const hiddenJson = document.getElementById('custom-hidden-json').value;
        
        if (!title || !sampleIn || !sampleOut) return ui.toast("Fill required fields", "error");

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
                sampleInput: sampleIn, sampleOutput: sampleOut, hiddenCases
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
>>>>>>> 97f4010be1e32118d1932b447512260f87e488ff
            </div>
        `).join('');
    },

<<<<<<< HEAD
    renderRoomList: () => { 
        const c = document.getElementById('room-list'); 
        if (state.roomList.length === 0) {
            c.innerHTML = `<div class="text-muted text-center w-full">No active rooms.</div>`; 
        } else {
            c.innerHTML = state.roomList.map(r => `
                <div class="problem-card-new" onclick="document.getElementById('modal-join-code-alt').value='${r.code}'; app.confirmJoinRoom(true);">
                    <div class="problem-info">
                        <h3>${r.title}</h3>
                        <p>Host: ${r.host}</p>
                        <p class="text-xs">Code: ${r.code}</p>
                    </div>
                    <span class="badge-new easy">LIVE</span>
                </div>
            `).join(''); 
        }
    },
    
    openCreateModal: () => { const l = document.getElementById('problem-selection-list'); const p = [{id:1,t:"A+B"},{id:2,t:"Rev"},{id:3,t:"Even"},{id:4,t:"Max"},{id:5,t:"Sum"},{id:6,t:"Pal"},{id:7,t:"Fact"},{id:8,t:"Prime"},{id:9,t:"Fib"},{id:10,t:"Words"}]; l.innerHTML = p.map(p => `<div class="problem-card ${state.selectedProblemId === p.id ? 'selected' : ''}" onclick="state.selectedProblemId=${p.id}; ui.openCreateModal();"><strong>${p.t}</strong></div>`).join(''); document.getElementById('create-room-modal').classList.remove('hidden'); ui.switchCreateTab('standard'); },
    closeCreateModal: () => document.getElementById('create-room-modal').classList.add('hidden'),
    switchCreateTab: (t) => { document.querySelectorAll('#create-room-modal .nav-tab').forEach(e => e.classList.remove('active')); document.getElementById(`tab-${t}`).classList.add('active'); document.getElementById('create-standard-view').classList.toggle('hidden', t !== 'standard'); document.getElementById('create-custom-view').classList.toggle('hidden', t !== 'custom'); },
    
    renderProblem: (p) => { let s = ''; if (p.samples && p.samples.length > 0) p.samples.forEach((x, i) => s += `<div style="margin-top:1rem;"><div style="font-weight:600; color:var(--accent-primary);">Sample Input ${i+1}:</div><div class="sample-case">${x.input}</div><div style="font-weight:600; color:var(--accent-primary);">Sample Output ${i+1}:</div><div class="sample-case">${x.output}</div></div>`); else s = `<div style="font-weight:600; color:var(--accent-primary);">Sample Input:</div><div class="sample-case">${p.sampleInput}</div><div style="font-weight:600; color:var(--accent-primary);">Sample Output:</div><div class="sample-case">${p.sampleOutput}</div>`; document.getElementById('problem-description').innerHTML = `<h3>${p.title} <span class="badge ${p.difficulty?.toLowerCase()}">${p.difficulty}</span></h3><p style="margin: 1rem 0;">${p.description}</p>${s}<div class="custom-input-area"><label>Test Input</label><textarea id="custom-input-area">${p.sampleInput || (p.samples ? p.samples[0].input : "")}</textarea></div>`; },
    logConsole: (m, t) => { const b = document.getElementById('console-output'); const l = document.createElement('div'); l.className = `log-entry log-${t}`; l.textContent = m; b.appendChild(l); b.scrollTop = b.scrollHeight; },
    renderLeaderboard: () => { const l = document.getElementById('leaderboard'); const s = [...state.participants].sort((a, b) => b.score - a.score); l.innerHTML = s.map((p, i) => `<li class="leaderboard-item ${p.id === socket.id ? 'me' : ''}"><div class="flex items-center gap-2"><span style="width:20px">#${i+1}</span><div class="avatar" style="background:${p.avatarColor}">${p.name[0]}</div><span>${p.name}</span></div><span style="color:var(--success); font-weight:bold;">${p.score}</span></li>`).join(''); },
    updateTimer: () => { const m = Math.floor(state.timeLeft / 60).toString().padStart(2, '0'); const s = (state.timeLeft % 60).toString().padStart(2, '0'); document.getElementById('timer-display').textContent = `${m}:${s}`; },
    addMessageToChat: (u, t, m) => { const b = document.getElementById('chat-box'); const d = document.createElement('div'); d.innerHTML = `<strong style="color:${m ? 'var(--accent-primary)' : 'var(--accent-secondary)'}">${u}:</strong> ${t}`; b.appendChild(d); }

=======
    // UPDATED: Expanded list to 10 problems
    renderPracticeList: () => {
        const container = document.getElementById('practice-list');
        const problems = [
            { id: 1, title: "A + B Problem", diff: "Easy", desc: "Calculate sum of two integers." },
            { id: 2, title: "Reverse String", diff: "Easy", desc: "Reverse a string." },
            { id: 3, title: "Even or Odd", diff: "Easy", desc: "Check parity." },
            { id: 4, title: "Max in Array", diff: "Easy", desc: "Find maximum number." },
            { id: 5, title: "Sum of Digits", diff: "Easy", desc: "Sum the digits." },
            { id: 6, title: "Palindrome Check", diff: "Easy", desc: "Check palindrome." },
            { id: 7, title: "Factorial", diff: "Easy", desc: "Compute factorial." },
            { id: 8, title: "Prime Check", diff: "Medium", desc: "Check if prime." },
            { id: 9, title: "Fibonacci Number", diff: "Medium", desc: "Find Nth Fibonacci." },
            { id: 10, title: "Reverse Words", diff: "Medium", desc: "Reverse word order." }
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

    // UPDATED: Expanded list to 10 problems in modal
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
        document.getElementById('problem-description').innerHTML = `
            <h3>${prob.title} <span class="badge ${prob.difficulty?.toLowerCase()}">${prob.difficulty}</span></h3>
            <p style="margin: 1rem 0;">${prob.description}</p>
            <div style="font-weight:600; color:var(--accent-primary);">Sample Input:</div>
            <div class="sample-case">${prob.sampleInput}</div>
            <div style="font-weight:600; color:var(--accent-primary);">Sample Output:</div>
            <div class="sample-case">${prob.sampleOutput}</div>
            
            <div class="custom-input-area">
                <label>Test Input (Used for Run)</label>
                <textarea id="custom-input-area">${prob.sampleInput}</textarea>
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
>>>>>>> 97f4010be1e32118d1932b447512260f87e488ff
};

window.onload = app.init;