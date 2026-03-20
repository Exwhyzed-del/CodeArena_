const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Create temp directory
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

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
});

app.get('/api/problem/:id', (req, res) => {
    const problem = PROBLEMS.find(p => p.id === parseInt(req.params.id));
    res.json(problem);
});

// --- EXECUTION ENGINE ---
function runCode(code, lang, input, callback) {
    const jobId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const fileName = `temp_${jobId}`;
    let filePath, cmd;

    const inputFile = path.join(tempDir, `${fileName}.txt`);
    fs.writeFileSync(inputFile, input);

    if (lang === 'python') {
        filePath = path.join(tempDir, `${fileName}.py`);
        fs.writeFileSync(filePath, code);
        cmd = `python ${filePath} < ${inputFile}`;
    } else if (lang === 'cpp') {
        const execPath = path.join(tempDir, `${fileName}.exe`);
        filePath = path.join(tempDir, `${fileName}.cpp`);
        fs.writeFileSync(filePath, code);
        cmd = `g++ ${filePath} -o ${execPath} && ${execPath} < ${inputFile}`;
    } else if (lang === 'java') {
        filePath = path.join(tempDir, `Main.java`);
        fs.writeFileSync(filePath, code);
        cmd = `cd ${tempDir} && javac Main.java && java Main < ${inputFile}`;
    }

    exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
        // Cleanup
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if (lang === 'cpp') {
                 const execPath = path.join(tempDir, `${fileName}.exe`);
                 if (fs.existsSync(execPath)) fs.unlinkSync(execPath);
            }
            if (lang === 'java') {
                 const classFile = path.join(tempDir, 'Main.class');
                 if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
            }
        } catch (e) {}

        if (error) callback(stderr || error.message);
        else callback(null, stdout);
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
});


// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createRoom', (payload) => {
        // FIX: Destructure safely
        const { problemId, customProblem, user } = payload;
        
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        let problemData = {};

        if (problemId) {
            const p = PROBLEMS.find(p => p.id === problemId);
            if (!p) return;
            problemData = { ...p };
        } else if (customProblem) {
            // Handle Custom Problem
            problemData = {
                id: `custom-${Date.now()}`,
                title: customProblem.title,
                difficulty: customProblem.difficulty,
                description: customProblem.description,
                // For compatibility, store the first sample as the main one for the engine
                sampleInput: customProblem.samples && customProblem.samples.length > 0 ? customProblem.samples[0].input : "",
                sampleOutput: customProblem.samples && customProblem.samples.length > 0 ? customProblem.samples[0].output : "",
                // Store all samples for display
                samples: customProblem.samples || [],
                templates: { python: "# Code", cpp: "// Code", java: "// Code" }
            };
        }

        rooms[roomCode] = {
            problem: problemData,
            hiddenCases: customProblem?.hiddenCases || [],
            players: [{ id: socket.id, name: user.name, score: 0, avatarColor: user.avatarColor }]
        };

        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, problem: problemData, players: rooms[roomCode].players });
        io.emit('lobbyUpdate', { type: 'add', room: { code: roomCode, title: problemData.title, host: user.name } });
    });

    socket.on('joinRoom', ({ roomCode, user }) => {
        const room = rooms[roomCode];
        if (!room) return socket.emit('error', "Room not found");

        room.players.push({ id: socket.id, name: user.name, score: 0, avatarColor: user.avatarColor });
        socket.join(roomCode);
        
        socket.emit('joinedRoom', { roomCode, problem: room.problem, players: room.players });
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