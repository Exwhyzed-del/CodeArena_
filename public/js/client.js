const socket = io();
const state = {
    currentUser: null,
    authMode: 'login',
    currentRoomCode: null,
    isPracticeMode: false,
    selectedProblemId: null,
    currentLanguage: 'javascript',
    participants: [],
    timer: null,
    timeLeft: 900, // 15 mins
    problem: null,
    roomList: [],
    startTime: Date.now() // To track time elapsed
};

// ==========================================
// SOCKET EVENTS
// ==========================================
socket.on('connect', () => {
    document.getElementById('connection-status').textContent = "Online";
    document.getElementById('connection-status').classList.add('status-connected');
});

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
    // Host initializes with players list (just them)
    app.enterRoom(roomCode, problem, false, players);
});

socket.on('joinedRoom', ({ roomCode, problem, players }) => {
    // Joiner gets current players list
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
        }
    },

    toggleAuthMode: () => {
        state.authMode = state.authMode === 'login' ? 'signup' : 'login';
        app.renderAuthForm();
    },

    renderAuthForm: () => {
        const container = document.getElementById('auth-forms-container');
        const isSignup = state.authMode === 'signup';
        document.getElementById('auth-subtitle').textContent = isSignup ? "Create a new account" : "Login to start coding";
        document.getElementById('auth-toggle-text').textContent = isSignup ? "Already have an account?" : "New here?";
        document.getElementById('auth-toggle-btn').textContent = isSignup ? "Login" : "Create Account";
        
        let html = '';
        if (isSignup) html += `<div class="form-group"><label>Username</label><input type="text" id="auth-username" placeholder="e.g. CodeMaster"></div>`;
        html += `
            <div class="form-group"><label>Email</label><input type="email" id="auth-email" placeholder="name@example.com"></div>
            <div class="form-group"><label>Password</label><input type="password" id="auth-password" placeholder="••••••••"></div>
            <button class="btn-primary w-full" onclick="app.handleAuth()">${isSignup ? 'Sign Up' : 'Log In'}</button>
        `;
        container.innerHTML = html;
    },

    handleAuth: async () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const username = document.getElementById('auth-username')?.value;
        
        if (!email || !password) return ui.toast("Fill all fields", "error");

        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name: username, isSignup: state.authMode === 'signup' })
        });

