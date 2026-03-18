const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { evaluateGuess, isValidCode, generateRoomCode, generateRandomCode } = require('./gameLogic');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const rooms = {};

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Smart computer guesser — filters candidates based on feedback
function makeComputerGuess(room) {
  const compPlayer  = room.players[1];
  const humanPlayer = room.players[0];

  if (!room._possibleCodes) {
    room._possibleCodes = [];
    for (let i = 1000; i <= 9999; i++) room._possibleCodes.push(String(i));
  }

  // Filter candidates by previous guesses
  room._possibleCodes = room._possibleCodes.filter(candidate => {
    for (const g of compPlayer.guesses) {
      const res = evaluateGuess(candidate, g.guess);
      if (res.hit !== g.hit || res.position !== g.position) return false;
    }
    return true;
  });

  const guess = room._possibleCodes[0] || generateRandomCode();
  const result = evaluateGuess(humanPlayer.code, guess);
  const entry  = { guess, ...result, turn: compPlayer.guesses.length + 1 };
  compPlayer.guesses.push(entry);
  return entry;
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // ── Create multiplayer room ──
  socket.on('create-room', ({ playerName }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      code: roomCode, mode: 'multiplayer',
      players: [
        { id: socket.id, name: playerName, code: null, guesses: [], ready: false, score: 0 }
      ],
      status: 'waiting', winner: null, round: 1, chat: [], currentTurn: 0,
      createdAt: Date.now()
    };
    socket.join(roomCode);
    socket.emit('room-created', { roomCode, playerIndex: 0, mode: 'multiplayer' });
  });

  // ── Create solo vs computer room ──
  socket.on('create-solo', ({ playerName }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      code: roomCode, mode: 'solo',
      players: [
        { id: socket.id, name: playerName, code: null, guesses: [], ready: false, score: 0 },
        { id: 'computer', name: 'Computer',  code: generateRandomCode(), guesses: [], ready: true, score: 0, isComputer: true }
      ],
      status: 'waiting', winner: null, round: 1, chat: [], currentTurn: 0,
      _possibleCodes: null,
      createdAt: Date.now()
    };
    socket.join(roomCode);
    socket.emit('room-created', { roomCode, playerIndex: 0, mode: 'solo' });
  });

  // ── Join multiplayer room ──
  socket.on('join-room', ({ roomCode, playerName }) => {
    const room = rooms[roomCode];
    if (!room)                      return socket.emit('error', { message: 'Room not found' });
    if (room.mode === 'solo')       return socket.emit('error', { message: 'That is a solo room' });
    if (room.players.length >= 2)   return socket.emit('error', { message: 'Room is full' });
    if (room.status !== 'waiting')  return socket.emit('error', { message: 'Game already in progress' });

    room.players.push({ id: socket.id, name: playerName, code: null, guesses: [], ready: false, score: 0 });
    socket.join(roomCode);
    socket.emit('room-joined', { roomCode, playerIndex: 1 });
    io.to(roomCode).emit('player-joined', {
      players: room.players.map(p => ({ id: p.id, name: p.name, ready: p.ready, score: p.score }))
    });
  });

  // ── Set secret code ──
  socket.on('set-code', ({ roomCode, code }) => {
    const room = rooms[roomCode];
    if (!room)             return socket.emit('error', { message: 'Room not found' });
    if (!isValidCode(code)) return socket.emit('error', { message: 'Invalid code. Must be 4 digits.' });

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return socket.emit('error', { message: 'Player not found' });

    player.code  = code;
    player.ready = true;

    io.to(roomCode).emit('player-ready', {
      players: room.players.map(p => ({ id: p.id, name: p.name, ready: p.ready, score: p.score }))
    });

    const allReady = room.players.every(p => p.ready);
    if (allReady) {
      room.status      = 'playing';
      room.currentTurn = 0;
      io.to(roomCode).emit('game-start', {
        players:     room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isComputer: !!p.isComputer })),
        round:       room.round,
        currentTurn: room.currentTurn,
        mode:        room.mode
      });
    }
  });

  // ── Submit guess ──
  socket.on('submit-guess', ({ roomCode, guess }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing') return socket.emit('error', { message: 'Game not active' });
    if (!isValidCode(guess))                return socket.emit('error', { message: 'Invalid guess. Must be 4 digits.' });

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1)                  return socket.emit('error', { message: 'Player not found' });
    if (room.currentTurn !== playerIndex)    return socket.emit('error', { message: "It's not your turn!" });

    const opponent = room.players[1 - playerIndex];
    if (!opponent?.code) return socket.emit('error', { message: 'Opponent not ready' });

    const result = evaluateGuess(opponent.code, guess);
    const entry  = { guess, ...result, turn: room.players[playerIndex].guesses.length + 1 };
    room.players[playerIndex].guesses.push(entry);

    socket.emit('guess-result', { ...entry, playerIndex });
    socket.to(roomCode).emit('opponent-guessed', {
      turn: entry.turn, hit: result.hit, position: result.position,
      playerName: room.players[playerIndex].name
    });

    // Win check — 4 positions means all digits correct in correct place
    if (result.position === 4) {
      room.status = 'finished';
      room.winner = socket.id;
      room.players[playerIndex].score += 1;
      io.to(roomCode).emit('game-over', {
        winnerId:   socket.id,
        winnerName: room.players[playerIndex].name,
        playerIndex, round: room.round,
        scores:  room.players.map(p => ({ name: p.name, score: p.score })),
        secrets: room.players.map(p => ({ name: p.name, code: p.code }))
      });
      return;
    }

    // Switch turn
    room.currentTurn = 1 - playerIndex;
    io.to(roomCode).emit('turn-changed', { currentTurn: room.currentTurn });

    // Computer's turn in solo mode
    if (room.mode === 'solo' && room.currentTurn === 1) {
      setTimeout(() => {
        if (!rooms[roomCode] || rooms[roomCode].status !== 'playing') return;
        const compEntry = makeComputerGuess(room);

        io.to(roomCode).emit('opponent-guessed', {
          turn: compEntry.turn, hit: compEntry.hit, position: compEntry.position,
          playerName: 'Computer', guess: compEntry.guess
        });

        if (compEntry.position === 4) {
          room.status = 'finished';
          room.winner = 'computer';
          room.players[1].score += 1;
          io.to(roomCode).emit('game-over', {
            winnerId: 'computer', winnerName: 'Computer',
            playerIndex: 1, round: room.round,
            scores:  room.players.map(p => ({ name: p.name, score: p.score })),
            secrets: room.players.map(p => ({ name: p.name, code: p.code }))
          });
          return;
        }

        room.currentTurn = 0;
        io.to(roomCode).emit('turn-changed', { currentTurn: 0 });
      }, 1200);
    }
  });

  // ── Chat ──
  socket.on('send-chat', ({ roomCode, message }) => {
    const room = rooms[roomCode];
    if (!room || room.mode === 'solo') return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !message?.trim()) return;
    const msg = { name: player.name, text: message.trim().slice(0, 120), ts: Date.now() };
    room.chat.push(msg);
    if (room.chat.length > 100) room.chat.shift();
    io.to(roomCode).emit('chat-message', msg);
  });

  // ── Rematch ──
  socket.on('rematch', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.round += 1;
    room.players.forEach(p => { p.code = null; p.guesses = []; p.ready = false; });
    room.status      = 'waiting';
    room.winner      = null;
    room.currentTurn = 0;
    room._possibleCodes = null;

    if (room.mode === 'solo') {
      room.players[1].code  = generateRandomCode();
      room.players[1].ready = true;
    }

    io.to(roomCode).emit('rematch-start', {
      players: room.players.map(p => ({ id: p.id, name: p.name, ready: p.ready, score: p.score, isComputer: !!p.isComputer })),
      round: room.round, mode: room.mode
    });
  });

  socket.on('disconnecting', () => {
    for (const roomCode of socket.rooms) {
      const room = rooms[roomCode];
      if (!room) continue;
      io.to(roomCode).emit('player-disconnected', { playerId: socket.id });
      delete rooms[roomCode];
    }
  });

  socket.on('disconnect', () => console.log('Disconnected:', socket.id));
});

setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const code of Object.keys(rooms)) {
    if (rooms[code].createdAt < cutoff) delete rooms[code];
  }
}, 15 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));