const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks'); // For precise time measurement

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- DATA: 10 PROBLEMS ---
const PROBLEMS = [
    {
        id: 1, title: "A + B Problem", difficulty: "Easy",
        description: "Given two integers A and B, calculate their sum.",
        inputFormat: "Two integers A and B.", outputFormat: "Sum of A and B.",
        sampleInput: "2 3", sampleOutput: "5",
        templates: { javascript: `const input = readline().split(' ');\nconsole.log(parseInt(input[0]) + parseInt(input[1]));`, python: `print(sum(map(int, input().split())))`, cpp: `#include<iostream>\nusing namespace std;\nint main(){ int a,b; cin>>a>>b; cout<<a+b; }` }
    },
    {
        id: 2, title: "Two Sum", difficulty: "Medium",
        description: "Given an array of integers, return indices of the two numbers such that they add up to a specific target.",
        inputFormat: "First line: n, Second line: array, Third line: target.", outputFormat: "Two indices.",
        sampleInput: "4\n2 7 11 15\n9", sampleOutput: "0 1",
        templates: { javascript: `const n = parseInt(readline());\nconst nums = readline().split(' ').map(Number);\nconst target = parseInt(readline());\n// Write logic`, python: `# Logic`, cpp: `// Logic` }
    },
    {
        id: 3, title: "Even or Odd", difficulty: "Easy",
        description: "Check if an integer N is even or odd.",
        inputFormat: "Integer N.", outputFormat: "'Even' or 'Odd'.",
        sampleInput: "5", sampleOutput: "Odd",
        templates: { javascript: `const N = parseInt(readline());\nconsole.log(N % 2 === 0 ? "Even" : "Odd");`, python: `# Logic`, cpp: `// Logic` }
    },
    {
        id: 4, title: "Max in Array", difficulty: "Easy",
        description: "Find the maximum element in an array of integers.",
        inputFormat: "First line n, second line n integers.", outputFormat: "Maximum integer.",
        sampleInput: "5\n1 5 2 9 3", sampleOutput: "9",
        templates: { javascript: `const n = parseInt(readline());\nconst arr = readline().split(' ').map(Number);\nconsole.log(Math.max(...arr));`, python: `# Logic`, cpp: `// Logic` }
    },
    {
        id: 5, title: "Sum of Digits", difficulty: "Easy",
        description: "Given a number N, find the sum of its digits.",
        inputFormat: "Integer N.", outputFormat: "Sum of digits.",
        sampleInput: "123", sampleOutput: "6",
        templates: { javascript: `const n = readline();\nlet sum = 0;\nfor(let c of n) sum += parseInt(c);\nconsole.log(sum);`, python: `# Logic`, cpp: `// Logic` }
    },
    {
        id: 6, title: "Palindrome Check", difficulty: "Easy",
        description: "Check if a given string is a palindrome.",
        inputFormat: "String S.", outputFormat: "true or false.",
        sampleInput: "racecar", sampleOutput: "true",
        templates: { javascript: `const s = readline();\nconsole.log(s === s.split('').reverse().join('') ? "true" : "false");`, python: `# Logic`, cpp: `// Logic` }
    },
    {
        id: 7, title: "Factorial", difficulty: "Easy",
        description: "Compute the factorial of a number N.",
        inputFormat: "Integer N.", outputFormat: "Factorial value.",
        sampleInput: "5", sampleOutput: "120",
        templates: { javascript: `const n = parseInt(readline());\nlet fact = 1;\nfor(let i=2; i<=n; i++) fact *= i;\nconsole.log(fact);`, python: `# Logic`, cpp: `// Logic` }
    },
    {
        id: 8, title: "Prime Check", difficulty: "Medium",
        description: "Determine if a number N is prime.",
        inputFormat: "Integer N.", outputFormat: "Prime or Not Prime.",
        sampleInput: "7", sampleOutput: "Prime",
        templates: { javascript: `const n = parseInt(readline());\nlet isPrime = n > 1;\nfor(let i=2; i*i <= n; i++) if(n%i===0) isPrime = false;\nconsole.log(isPrime ? "Prime" : "Not Prime");`, python: `# Logic`, cpp: `// Logic` }
    },
    {
        id: 9, title: "Fibonacci Number", difficulty: "Medium",
        description: "Return the Nth Fibonacci number.",
        inputFormat: "Integer N.", outputFormat: "Nth Fibonacci.",
        sampleInput: "6", sampleOutput: "8",
        templates: { javascript: `const n = parseInt(readline());\nlet a=0, b=1;\nfor(let i=2; i<=n; i++) { let t=a+b; a=b; b=t; }\nconsole.log(b);`, python: `# Logic`, cpp: `// Logic` }
    },
    {
        id: 10, title: "Reverse Words", difficulty: "Medium",
        description: "Reverse the order of words in a sentence.",
        inputFormat: "String sentence.", outputFormat: "Reversed sentence.",
        sampleInput: "hello world", sampleOutput: "world hello",
        templates: { javascript: `console.log(readline().split(' ').reverse().join(' '));`, python: `# Logic`, cpp: `// Logic` }
    }
];

// --- DATABASE (In-Memory) ---
const users = {};
const rooms = {};

// --- ROUTES ---
app.post('/api/auth', (req, res) => {
    const { email, password, name, isSignup } = req.body;
    if (isSignup) {
        if (users[email]) return res.status(400).json({ error: "User exists" });
        users[email] = { name, password, avatarColor: `hsl(${Math.random()*360}, 70%, 60%)` };
        return res.json({ success: true, user: { email, ...users[email] } });
    } else {
        const user = users[email] || { name: email.split('@')[0], password, avatarColor: `hsl(${Math.random()*360}, 70%, 60%)` };
        users[email] = user;
        return res.json({ success: true, user: { email, ...user } });
    }
});

app.get('/api/problem/:id', (req, res) => {
    const problem = PROBLEMS.find(p => p.id === parseInt(req.params.id));
    if (!problem) return res.status(404).json({ error: "Not found" });
    res.json(problem);
});

// --- EXECUTION & SCORING ENGINE ---
app.post('/api/run', (req, res) => {
    const { code, language, input, problemId, timeElapsed } = req.body; // timeElapsed sent from client
    const problem = PROBLEMS.find(p => p.id === problemId);
    
    if (!problem) return res.status(400).json({ error: "Problem not found" });

    let output = "";
    let status = "error";
    let score = 0;
    let execTimeMs = 0;

    try {
        if (language === 'javascript') {
            const inputLines = input.split('\n');
            let lineIndex = 0;
            
            const sandbox = {
                readline: () => inputLines[lineIndex++] || "",
                console: { log: (...args) => { output += args.join(' ') + "\n"; } }
            };

            vm.createContext(sandbox);
            
            // Measure Execution Time
            const start = performance.now();
            vm.runInContext(code, sandbox, { timeout: 5000 });
            const end = performance.now();
            
            execTimeMs = end - start;
            output = output.trim();
            
            if (output === problem.sampleOutput.trim()) {
                status = "accepted";
                
                // --- SCORING LOGIC ---
                // Base Points
                let basePoints = 500;
                
                // Speed Bonus (The faster the code runs, the more points)
                // Under 5ms is considered optimal for these problems
                let speedBonus = 0;
                if (execTimeMs < 2) speedBonus = 500;      // Extremely fast
                else if (execTimeMs < 10) speedBonus = 300; // Fast
                else if (execTimeMs < 50) speedBonus = 100; // Okay
                
                // Time Bonus (Time taken to submit)
                // timeElapsed is seconds passed. We assume max 900s (15m).
                // Earlier submission = Higher bonus
                let timeBonus = Math.floor(Math.max(0, 900 - timeElapsed) * 1.5);

                score = basePoints + speedBonus + timeBonus;
            } else {
                status = "wrong_answer";
            }
        } else {
            // Simulation for other langs
            execTimeMs = 15;
            if (code.length > 20) {
                output = problem.sampleOutput;
                status = "accepted";
                score = 800; // Default simulated score
            }
        }
    } catch (e) {
        output = "Error: " + e.message;
        status = "error";
        execTimeMs = 0;
    }

    res.json({ output, status, expected: problem.sampleOutput, score, execTimeMs });
});


// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createRoom', ({ problemId, user }) => {
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        const problem = PROBLEMS.find(p => p.id === problemId);
        
        if (!problem) return;

        // Initialize room with host
        rooms[roomCode] = {
            problemId,
            players: [{ id: socket.id, name: user.name, score: 0, avatarColor: user.avatarColor }]
        };

        socket.join(roomCode);
        
        // Send problem and current player list (just host) back to host
        socket.emit('roomCreated', { roomCode, problem, players: rooms[roomCode].players });
        
        // Update Lobby
        io.emit('lobbyUpdate', { type: 'add', room: { code: roomCode, title: problem.title, host: user.name } });
    });

    socket.on('joinRoom', ({ roomCode, user }) => {
        const room = rooms[roomCode];
        if (!room) return socket.emit('error', "Room not found");

        // Add player to room
        room.players.push({ id: socket.id, name: user.name, score: 0, avatarColor: user.avatarColor });
        socket.join(roomCode);
        
        const problem = PROBLEMS.find(p => p.id === room.problemId);
        
        // 1. Tell the new player they joined, sending CURRENT players list
        socket.emit('joinedRoom', { roomCode, problem, players: room.players });
        
        // 2. Tell everyone else in the room to update their list
        io.to(roomCode).emit('updatePlayers', room.players);
    });

    socket.on('submitScore', ({ roomCode, score }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.score = Math.max(player.score, score);
            io.to(roomCode).emit('updatePlayers', room.players);
        }
    });

    socket.on('sendMessage', ({ roomCode, text, sender }) => {
        io.to(roomCode).emit('newMessage', { text, sender });
    });

    socket.on('disconnect', () => {
        for (const code in rooms) {
            const room = rooms[code];
            const idx = room.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                room.players.splice(idx, 1);
                io.to(code).emit('updatePlayers', room.players);
                if (room.players.length === 0) {
                    delete rooms[code];
                    io.emit('lobbyUpdate', { type: 'remove', code });
                }
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});