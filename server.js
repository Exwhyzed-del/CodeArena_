const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
<<<<<<< HEAD
const fs = require('fs');
const { exec } = require('child_process');
=======
const vm = require('vm');
const { performance } = require('perf_hooks'); // For precise time measurement
>>>>>>> 5ac27384ac2a5631fa52865cc9cd618bc443daa7

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

<<<<<<< HEAD
// Create main temp directory
const mainTempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(mainTempDir)) {
    fs.mkdirSync(mainTempDir);
}

// --- DATA: 10 PROBLEMS ---
const PROBLEMS = [
    { id: 1, title: "A + B Problem", difficulty: "Easy", description: "Calculate sum of two integers.", sampleInput: "2 3", sampleOutput: "5", templates: { python: `import sys\na, b = map(int, sys.stdin.read().split())\nprint(a+b)`, cpp: `#include<iostream>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a+b;}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){Scanner s=new Scanner(System.in);System.out.println(s.nextInt()+s.nextInt());}}` } },
    { id: 2, title: "Reverse String", difficulty: "Easy", description: "Print the string in reverse.", sampleInput: "hello", sampleOutput: "olleh", templates: { python: `print(input()[::-1])`, cpp: `#include<iostream>\n#include<string>\n#include<algorithm>\nusing namespace std;\nint main(){string s;cin>>s;reverse(s.begin(),s.end());cout<<s;}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){System.out.println(new StringBuilder(new Scanner(System.in).next()).reverse());}}` } },
    { id: 3, title: "Even or Odd", difficulty: "Easy", description: "Check if number is even or odd.", sampleInput: "5", sampleOutput: "Odd", templates: { python: `n=int(input())\nprint("Even" if n%2==0 else "Odd")`, cpp: `#include<iostream>\nusing namespace std;\nint main(){int n;cin>>n;cout<<(n%2==0?"Even":"Odd");}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){int n=new Scanner(System.in).nextInt();System.out.println(n%2==0?"Even":"Odd");}}` } },
    { id: 4, title: "Max in Array", difficulty: "Easy", description: "Find max in list.", sampleInput: "5\n1 5 2 9 3", sampleOutput: "9", templates: { python: `input()\nprint(max(map(int, input().split())))`, cpp: `#include<iostream>\nusing namespace std;\nint main(){int n,m=-1e9,t;cin>>n;while(n--){cin>>t;if(t>m)m=t;}cout<<m;}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){Scanner s=new Scanner(System.in);int n=s.nextInt(),m=-1;while(n-->0)m=Math.max(m,s.nextInt());System.out.println(m);}}` } },
    { id: 5, title: "Sum of Digits", difficulty: "Easy", description: "Sum of digits.", sampleInput: "123", sampleOutput: "6", templates: { python: `print(sum(map(int, input())))`, cpp: `#include<iostream>\nusing namespace std;\nint main(){int n,s=0;cin>>n;while(n){s+=n%10;n/=10;}cout<<s;}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){int n=new Scanner(System.in).nextInt(),s=0;while(n>0){s+=n%10;n/=10;}System.out.println(s);}}` } },
    { id: 6, title: "Palindrome", difficulty: "Easy", description: "Check palindrome.", sampleInput: "racecar", sampleOutput: "true", templates: { python: `s=input()\nprint(str(s==s[::-1]).lower())`, cpp: `#include<iostream>\n#include<string>\nusing namespace std;\nint main(){string a,b;cin>>a;b=a;reverse(b.begin(),b.end());cout<<(a==b?"true":"false");}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){String s=new Scanner(System.in).next();System.out.println(s.equals(new StringBuilder(s).reverse().toString()));}}` } },
    { id: 7, title: "Factorial", difficulty: "Easy", description: "Compute N factorial.", sampleInput: "5", sampleOutput: "120", templates: { python: `import math\nprint(math.factorial(int(input())))`, cpp: `#include<iostream>\nusing namespace std;\nint main(){int n,r=1;cin>>n;for(int i=2;i<=n;i++)r*=i;cout<<r;}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){int n=new Scanner(System.in).nextInt(),r=1;for(int i=2;i<=n;i++)r*=i;System.out.println(r);}}` } },
    { id: 8, title: "Prime Check", difficulty: "Medium", description: "Check if prime.", sampleInput: "7", sampleOutput: "Prime", templates: { python: `n=int(input())\nprint("Prime" if n>1 and all(n%i for i in range(2,int(n**0.5)+1)) else "Not Prime")`, cpp: `#include<iostream>\nusing namespace std;\nint main(){int n,f=1;cin>>n;for(int i=2;i*i<=n;i++)if(n%i==0)f=0;cout<<(n>1&&f?"Prime":"Not Prime");}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){int n=new Scanner(System.in).nextInt();boolean p=n>1;for(int i=2;i*i<=n;i++)if(n%i==0)p=false;System.out.println(p?"Prime":"Not Prime");}}` } },
    { id: 9, title: "Fibonacci", difficulty: "Medium", description: "Nth Fibonacci.", sampleInput: "6", sampleOutput: "8", templates: { python: `n=int(input())\na,b=0,1\nfor _ in range(n):a,b=b,a+b\nprint(a)`, cpp: `#include<iostream>\nusing namespace std;\nint main(){int n,a=0,b=1,c;cin>>n;while(n--){c=a+b;a=b;b=c;}cout<<a;}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){int n=new Scanner(System.in).nextInt(),a=0,b=1;while(n-->0){int t=a+b;a=b;b=t;}System.out.println(a);}}` } },
    { id: 10, title: "Reverse Words", difficulty: "Medium", description: "Reverse words order.", sampleInput: "hello world", sampleOutput: "world hello", templates: { python: `print(" ".join(input().split()[::-1]))`, cpp: `#include<iostream>\n#include<string>\n#include<vector>\nusing namespace std;\nint main(){string w;vector<string>v;while(cin>>w)v.push_back(w);for(int i=v.size()-1;i>=0;i--)cout<<v[i]<<" ";}`, java: `import java.util.*;\npublic class Main{public static void main(String[]a){Scanner s=new Scanner(System.in);List<String>l=new ArrayList<>();while(s.hasNext())l.add(s.next());Collections.reverse(l);System.out.println(String.join(" ",l));}}` } }
];

// --- DATABASE ---
const users = {};
const rooms = {}; 

// --- ROUTES ---
app.post('/api/auth', (req, res) => {
    const { email, password, name } = req.body;
    const user = users[email] || { name: email.split('@')[0], password, avatarColor: `hsl(${Math.random()*360}, 70%, 60%)` };
    users[email] = user;
    res.json({ success: true, user: { email, ...user } });
=======
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
>>>>>>> 5ac27384ac2a5631fa52865cc9cd618bc443daa7
});

app.get('/api/problem/:id', (req, res) => {
    const problem = PROBLEMS.find(p => p.id === parseInt(req.params.id));
<<<<<<< HEAD
    res.json(problem);
});

// --- EXECUTION ENGINE (Fixed for Java/C++) ---
function runCode(code, lang, input, callback) {
    const jobId = Date.now();
    // Create a unique folder for this execution
    const workDir = path.join(mainTempDir, `${jobId}`);
    fs.mkdirSync(workDir);

    const inputPath = path.join(workDir, 'input.txt');
    fs.writeFileSync(inputPath, input);

    let filePath = '';
    let cmd = '';

    if (lang === 'python') {
        filePath = path.join(workDir, 'script.py');
        fs.writeFileSync(filePath, code);
        cmd = `python "${filePath}" < "${inputPath}"`;
    } 
    else if (lang === 'cpp') {
        filePath = path.join(workDir, 'script.cpp');
        const outPath = path.join(workDir, 'script.exe'); // .exe works on Windows, fine on Linux usually too, or remove extension
        fs.writeFileSync(filePath, code);
        // Compile and Run
        cmd = `g++ "${filePath}" -o "${outPath}" && "${outPath}" < "${inputPath}"`;
    } 
    else if (lang === 'java') {
        // Java requires class Main
        filePath = path.join(workDir, 'Main.java');
        fs.writeFileSync(filePath, code);
        // Compile and Run in the work directory
        cmd = `cd "${workDir}" && javac Main.java && java Main < input.txt`;
    }

    // Execute
    exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
        // Cleanup directory
        try {
            fs.rmSync(workDir, { recursive: true, force: true });
        } catch (e) { console.log("Cleanup error", e); }

        if (error) {
            // Return detailed error for debugging
            callback(stderr || error.message);
        } else {
            callback(null, stdout);
        }
    });
}

app.post('/api/run', (req, res) => {
    const { code, language, input } = req.body;
    runCode(code, language, input, (err, output) => {
        if (err) return res.json({ output: "Error: " + err, status: "error" });
        res.json({ output: output.trim(), status: "ran" });
    });
});

app.post('/api/submit', (req, res) => {
    const { code, language, roomCode, timeElapsed, problemId } = req.body;
    
    let problem = null;
    let hiddenCases = [];
    
    if (roomCode && rooms[roomCode]) {
        problem = rooms[roomCode].problem;
        hiddenCases = rooms[roomCode].hiddenCases || [];
    } else {
        problem = PROBLEMS.find(p => p.id === problemId);
    }

    if (!problem) return res.status(400).json({ error: "Problem not found" });

    // Run Sample
    runCode(code, language, problem.sampleInput, (err, output) => {
        if (err) return res.json({ status: "error", message: "Runtime Error on Sample" });
        if (output.trim() !== problem.sampleOutput.trim()) {
            return res.json({ status: "wrong_answer", message: "Failed Sample Test Case" });
        }

        // Run Hidden
        if (hiddenCases.length === 0) return calculateScore();
        
        let pending = hiddenCases.length;
        hiddenCases.forEach((tc, index) => {
            runCode(code, language, tc.input, (err, out) => {
                if (pending === -1) return;
                if (err || out.trim() !== tc.output.trim()) {
                    pending = -1;
                    return res.json({ status: "wrong_answer", message: `Failed Hidden Test Case #${index+1}` });
                }
                pending--;
                if (pending === 0) calculateScore();
            });
        });
    });

    function calculateScore() {
        const basePoints = problem.difficulty === 'Hard' ? 1000 : (problem.difficulty === 'Medium' ? 600 : 400);
        const timeBonus = Math.floor(Math.max(0, 900 - timeElapsed) * 1.5);
        res.json({ status: "accepted", score: basePoints + timeBonus, message: "Accepted!" });
    }
=======
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
>>>>>>> 5ac27384ac2a5631fa52865cc9cd618bc443daa7
});


// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

<<<<<<< HEAD
    socket.on('createRoom', (payload) => {
        const { problemId, customProblem, user } = payload;
        
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        let problemData = {};

        if (problemId) {
            const p = PROBLEMS.find(p => p.id === problemId);
            if (!p) return;
            problemData = { ...p };
        } else if (customProblem) {
            problemData = {
                id: `custom-${Date.now()}`,
                title: customProblem.title,
                difficulty: customProblem.difficulty,
                description: customProblem.description,
                sampleInput: customProblem.samples && customProblem.samples.length > 0 ? customProblem.samples[0].input : "",
                sampleOutput: customProblem.samples && customProblem.samples.length > 0 ? customProblem.samples[0].output : "",
                samples: customProblem.samples || [],
                templates: { python: "# Code", cpp: "// Code", java: "// Code" }
            };
        }

        rooms[roomCode] = {
            problem: problemData,
            hiddenCases: customProblem?.hiddenCases || [],
=======
    socket.on('createRoom', ({ problemId, user }) => {
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        const problem = PROBLEMS.find(p => p.id === problemId);
        
        if (!problem) return;

        // Initialize room with host
        rooms[roomCode] = {
            problemId,
>>>>>>> 5ac27384ac2a5631fa52865cc9cd618bc443daa7
            players: [{ id: socket.id, name: user.name, score: 0, avatarColor: user.avatarColor }]
        };

        socket.join(roomCode);
<<<<<<< HEAD
        socket.emit('roomCreated', { roomCode, problem: problemData, players: rooms[roomCode].players });
        io.emit('lobbyUpdate', { type: 'add', room: { code: roomCode, title: problemData.title, host: user.name } });
=======
        
        // Send problem and current player list (just host) back to host
        socket.emit('roomCreated', { roomCode, problem, players: rooms[roomCode].players });
        
        // Update Lobby
        io.emit('lobbyUpdate', { type: 'add', room: { code: roomCode, title: problem.title, host: user.name } });
>>>>>>> 5ac27384ac2a5631fa52865cc9cd618bc443daa7
    });

    socket.on('joinRoom', ({ roomCode, user }) => {
        const room = rooms[roomCode];
        if (!room) return socket.emit('error', "Room not found");

<<<<<<< HEAD
        room.players.push({ id: socket.id, name: user.name, score: 0, avatarColor: user.avatarColor });
        socket.join(roomCode);
        
        socket.emit('joinedRoom', { roomCode, problem: room.problem, players: room.players });
=======
        // Add player to room
        room.players.push({ id: socket.id, name: user.name, score: 0, avatarColor: user.avatarColor });
        socket.join(roomCode);
        
        const problem = PROBLEMS.find(p => p.id === room.problemId);
        
        // 1. Tell the new player they joined, sending CURRENT players list
        socket.emit('joinedRoom', { roomCode, problem, players: room.players });
        
        // 2. Tell everyone else in the room to update their list
>>>>>>> 5ac27384ac2a5631fa52865cc9cd618bc443daa7
        io.to(roomCode).emit('updatePlayers', room.players);
    });

    socket.on('submitScore', ({ roomCode, score }) => {
        const room = rooms[roomCode];
        if (!room) return;
<<<<<<< HEAD
=======

>>>>>>> 5ac27384ac2a5631fa52865cc9cd618bc443daa7
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.score = Math.max(player.score, score);
            io.to(roomCode).emit('updatePlayers', room.players);
        }
    });

<<<<<<< HEAD
    socket.on('sendMessage', ({ roomCode, text, sender }) => {
        io.to(roomCode).emit('newMessage', { text, sender });
    });

=======
    // Listen for a message sent by a user
    socket.on('sendMessage', ({ roomCode, text, sender }) => {
        io.to(roomCode).emit('newMessage', { text, sender });
    });
    
    // Handle user disconnection
>>>>>>> 5ac27384ac2a5631fa52865cc9cd618bc443daa7
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