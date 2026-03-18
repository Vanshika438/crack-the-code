# 🔐 Crack the Code

A real-time multiplayer code-breaking game built with React + Node.js + Socket.io.

## How to Play

Each player sets a secret 4-digit code. Then take turns guessing each other's code.

After every guess you get:
- 🎯 **Hit** — how many digits in your guess exist anywhere in the secret
- 📍 **Position** — how many digits are in the exact correct position

First player to get **📍 4** wins!

**Example:** Secret is `1 2 3 4`, Guess is `1 5 3 9`
→ 🎯 2 (digits 1 and 3 exist) &nbsp; 📍 2 (1 and 3 are in the right spots)

## Modes

- **vs Computer** — play solo against a smart AI that narrows down your code each turn
- **Multiplayer** — create a room, share the code with a friend, play in real time

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Styling | CSS Variables + Google Fonts |

## Run Locally

**Backend**
```bash
cd server
npm install
npm run dev        # runs on http://localhost:3001
```

**Frontend**
```bash
cd client
npm install
cp .env.example .env
npm run dev        # runs on http://localhost:5173
```

Open two browser tabs at `http://localhost:5173` to play both sides.

## Deploy

- **Backend** → [Render](https://render.com) Web Service (root: `server`, start: `npm start`)
- **Frontend** → Render Static Site (root: `client`, build: `npm run build`, publish: `dist`)
- Set env var on frontend: `VITE_SERVER_URL=https://your-server.onrender.com`

## Project Structure

```
crack-the-code/
├── server/
│   ├── index.js        # Socket.io server + game room logic
│   └── gameLogic.js    # Hit/Position scoring, code generator
└── client/
    └── src/
        ├── App.jsx              # Game state machine
        ├── utils/socket.js      # Socket.io client
        ├── components/
        │   ├── Chat.jsx         # In-game chat (multiplayer)
        │   └── Timer.jsx
        └── pages/
            ├── Lobby.jsx        # Create / Join / Solo
            ├── SetCode.jsx      # Set your secret code
            ├── Game.jsx         # Main game screen
            └── GameOver.jsx     # Results + rematch
```

---

Built for fun with vibe coding ✨