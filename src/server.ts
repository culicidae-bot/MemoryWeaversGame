import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Server, Socket } from 'socket.io';

// Types
interface Player {
    name: string;
    score: number;
}

interface Room {
    players: { [key: string]: Player };
    board: string[];
    roundActive: boolean;
    words: { [key: string]: string[] };
    host: string;
    timer: NodeJS.Timeout | null;
}

interface GameState {
    [key: string]: Room;
}

// Load dictionary
const dictionary: Set<string> = new Set(
    JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'words.json'), 'utf8'))
);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(helmet());
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Game state
const rooms: GameState = {};
const BOARD_SIZE = 4;
const ROUND_TIME = 90; // seconds

// Helper: Generate random Boggle board
function generateBoard(size: number = BOARD_SIZE): string[] {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const board: string[] = [];
    for (let i = 0; i < size * size; i++) {
        board.push(letters[Math.floor(Math.random() * letters.length)]);
    }
    return board;
}

// Helper: Validate word (exists in dictionary and can be formed on board)
function isValidWord(word: string, board: string[], size: number): boolean {
    word = word.toUpperCase();
    if (!dictionary.has(word) || word.length < 3) return false;

    // Board search (DFS)
    function dfs(x: number, y: number, idx: number, visited: Set<string>): boolean {
        if (idx === word.length) return true;
        if (
            x < 0 || y < 0 || x >= size || y >= size ||
            visited.has(`${x},${y}`) ||
            board[y * size + x] !== word[idx]
        ) return false;
        visited.add(`${x},${y}`);
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx !== 0 || dy !== 0) {
                    if (dfs(x + dx, y + dy, idx + 1, new Set(visited))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (dfs(x, y, 0, new Set())) return true;
        }
    }
    return false;
}

// Socket.IO logic
io.on('connection', (socket: Socket) => {
    let currentRoom: string | null = null;
    let nickname: string | null = null;

    socket.on('joinRoom', ({ roomId, name }: { roomId: string; name: string }) => {
        nickname = name;
        currentRoom = roomId;
        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: {},
                board: generateBoard(),
                roundActive: false,
                words: {},
                host: socket.id,
                timer: null,
            };
        }
        rooms[roomId].players[socket.id] = { name, score: 0 };
        socket.join(roomId);

        io.to(roomId).emit('roomUpdate', {
            players: rooms[roomId].players,
            host: rooms[roomId].host,
        });
    });

    socket.on('startRound', () => {
        if (!currentRoom || rooms[currentRoom].host !== socket.id) return;
        const board = generateBoard();
        rooms[currentRoom].board = board;
        rooms[currentRoom].roundActive = true;
        rooms[currentRoom].words = {};
        io.to(currentRoom).emit('roundStarted', { board, time: ROUND_TIME });

        // Timer
        rooms[currentRoom].timer = setTimeout(() => {
            rooms[currentRoom].roundActive = false;
            // Calculate scores
            const scores: { [key: string]: { name: string; score: number; words: string[] } } = {};
            for (const [pid, words] of Object.entries(rooms[currentRoom].words)) {
                let score = 0;
                for (const w of words) score += w.length; // Simple scoring
                rooms[currentRoom].players[pid].score += score;
                scores[pid] = {
                    name: rooms[currentRoom].players[pid].name,
                    score: rooms[currentRoom].players[pid].score,
                    words
                };
            }
            io.to(currentRoom).emit('roundEnded', { scores });
        }, ROUND_TIME * 1000);
    });

    socket.on('submitWord', (word: string) => {
        if (!currentRoom || !rooms[currentRoom].roundActive) return;
        if (!rooms[currentRoom].words[socket.id]) rooms[currentRoom].words[socket.id] = [];
        if (
            isValidWord(word, rooms[currentRoom].board, BOARD_SIZE) &&
            !rooms[currentRoom].words[socket.id].includes(word)
        ) {
            rooms[currentRoom].words[socket.id].push(word);
            socket.emit('wordAccepted', word);
        } else {
            socket.emit('wordRejected', word);
        }
    });

    socket.on('disconnect', () => {
        if (currentRoom && rooms[currentRoom]) {
            delete rooms[currentRoom].players[socket.id];
            if (Object.keys(rooms[currentRoom].players).length === 0) {
                // Clean up empty room
                if (rooms[currentRoom].timer) {
                    clearTimeout(rooms[currentRoom].timer);
                }
                delete rooms[currentRoom];
            } else {
                // If host left, assign new host
                if (rooms[currentRoom].host === socket.id) {
                    rooms[currentRoom].host = Object.keys(rooms[currentRoom].players)[0];
                }
                io.to(currentRoom).emit('roomUpdate', {
                    players: rooms[currentRoom].players,
                    host: rooms[currentRoom].host,
                });
            }
        }
    });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Boggle Blitz Online server running on port ${PORT}`);
}); 