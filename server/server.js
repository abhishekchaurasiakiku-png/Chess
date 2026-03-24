const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Mock DB setup (In-Memory Array is inside auth.js)
console.log('Running with In-Memory Database ✅');

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../client')));

// Parse JSON bodies for auth API
app.use(express.json());

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Basic matchmaking state
let waitingPlayer = null;
let rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Matchmaking Logic
    socket.on('join_matchmaking', () => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            // Match found!
            const roomName = 'room_' + socket.id;
            const player1 = waitingPlayer;
            const player2 = socket;

            player1.join(roomName);
            player2.join(roomName);

            // Assign colors
            rooms[roomName] = {
                players: {
                    [player1.id]: 'w',
                    [player2.id]: 'b'
                },
                boardState: 'start'
            };

            // Notify both players
            io.to(roomName).emit('game_start', {
                room: roomName,
                players: {
                    white: player1.id,
                    black: player2.id
                }
            });

            console.log(`Game started in ${roomName} between ${player1.id} and ${player2.id}`);
            waitingPlayer = null;
        } else {
            // Wait for opponent
            waitingPlayer = socket;
            socket.emit('waiting', { message: 'Waiting for an opponent...' });
            console.log(`${socket.id} is waiting for an opponent.`);
        }
    });

    // Move Forwarding
    socket.on('make_move', (data) => {
        const { room, move } = data;
        // Broadcast move to the opponent in the same room
        socket.to(room).emit('opponent_move', move);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
        }
        // Notify opponent if game was active
        for (const [roomName, roomData] of Object.entries(rooms)) {
            if (Object.keys(roomData.players).includes(socket.id)) {
                socket.to(roomName).emit('opponent_disconnected', { message: 'Your opponent disconnected.' });
                delete rooms[roomName]; // clear room
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
