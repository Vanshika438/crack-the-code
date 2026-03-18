import React, { useState, useEffect, useCallback } from 'react';
import { socket } from './utils/socket';
import Lobby from './pages/Lobby';
import SetCode from './pages/SetCode';
import Game from './pages/Game';
import GameOver from './pages/GameOver';
import './App.css';

const PHASES = { LOBBY: 'lobby', SET_CODE: 'set_code', PLAYING: 'playing', GAME_OVER: 'game_over' };

export default function App() {
  const [phase, setPhase]                     = useState(PHASES.LOBBY);
  const [playerIndex, setPlayerIndex]         = useState(null);
  const [playerName, setPlayerName]           = useState('');
  const [roomCode, setRoomCode]               = useState('');
  const [players, setPlayers]                 = useState([]);
  const [guesses, setGuesses]                 = useState([]);
  const [opponentGuesses, setOpponentGuesses] = useState([]);
  const [gameOverData, setGameOverData]       = useState(null);
  const [error, setError]                     = useState('');
  const [round, setRound]                     = useState(1);
  const [scores, setScores]                   = useState([]);
  const [chat, setChat]                       = useState([]);
  const [currentTurn, setCurrentTurn]         = useState(0);
  const [mode, setMode]                       = useState('multiplayer');

  useEffect(() => {
    socket.off();
    socket.connect();

    socket.on('room-created', ({ roomCode, playerIndex, mode }) => {
      setRoomCode(roomCode); setPlayerIndex(playerIndex);
      if (mode) setMode(mode);
    });
    socket.on('room-joined', ({ roomCode, playerIndex }) => {
      setRoomCode(roomCode); setPlayerIndex(playerIndex); setMode('multiplayer');
    });
    socket.on('player-joined', ({ players }) => setPlayers(players));
    socket.on('player-ready',  ({ players }) => setPlayers(players));

    socket.on('game-start', ({ players, round, currentTurn, mode }) => {
      setPlayers(players); setRound(round);
      setCurrentTurn(currentTurn ?? 0);
      setMode(mode || 'multiplayer');
      setGuesses([]); setOpponentGuesses([]);
      setPhase(PHASES.PLAYING);
    });

    socket.on('guess-result', (result) => {
      setGuesses(prev => {
        if (prev.some(g => g.turn === result.turn && g.guess === result.guess)) return prev;
        return [...prev, result];
      });
    });

    socket.on('opponent-guessed', (data) => {
      setOpponentGuesses(prev => {
        if (prev.some(g => g.turn === data.turn && g.playerName === data.playerName)) return prev;
        return [...prev, data];
      });
    });

    socket.on('turn-changed', ({ currentTurn }) => setCurrentTurn(currentTurn));

    socket.on('game-over', (data) => {
      setGameOverData(data); setScores(data.scores || []); setRound(data.round || 1);
      setPhase(PHASES.GAME_OVER);
    });

    socket.on('rematch-start', ({ players, round, mode }) => {
      setPlayers(players); setRound(round);
      setMode(mode || 'multiplayer');
      setGuesses([]); setOpponentGuesses([]);
      setGameOverData(null); setCurrentTurn(0);
      setPhase(PHASES.SET_CODE);
    });

    socket.on('chat-message', (msg) => {
      setChat(prev => {
        if (prev.some(m => m.ts === msg.ts && m.name === msg.name)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('player-disconnected', () => {
      setError('Your opponent disconnected.');
      setPhase(PHASES.LOBBY);
      setRoomCode(''); setPlayers([]); setGuesses([]);
      setOpponentGuesses([]); setGameOverData(null); setChat([]); setScores([]);
    });

    socket.on('error', ({ message }) => setError(message));
    return () => { socket.off(); socket.disconnect(); };
  }, []);

  const handleSolo   = useCallback((name) => {
    setPlayerName(name); setError(''); setMode('solo');
    socket.emit('create-solo', { playerName: name });
    setPhase(PHASES.SET_CODE);
  }, []);

  const handleCreate = useCallback((name) => {
    setPlayerName(name); setError(''); setMode('multiplayer');
    socket.emit('create-room', { playerName: name });
    setPhase(PHASES.SET_CODE);
  }, []);

  const handleJoin   = useCallback((name, code) => {
    setPlayerName(name); setError('');
    socket.emit('join-room', { roomCode: code, playerName: name });
    setPhase(PHASES.SET_CODE);
  }, []);

  const handleSetCode = useCallback((code) => socket.emit('set-code',      { roomCode, code }),          [roomCode]);
  const handleGuess   = useCallback((guess) => socket.emit('submit-guess', { roomCode, guess }),         [roomCode]);
  const handleChat    = useCallback((msg)   => socket.emit('send-chat',    { roomCode, message: msg }), [roomCode]);
  const handleRematch = useCallback(()      => socket.emit('rematch',      { roomCode }),                [roomCode]);

  const handleBackToLobby = useCallback(() => {
    setPhase(PHASES.LOBBY); setRoomCode(''); setPlayers([]);
    setGuesses([]); setOpponentGuesses([]); setGameOverData(null);
    setError(''); setChat([]); setScores([]); setRound(1); setCurrentTurn(0);
  }, []);

  return (
    <div className="app">
      {error && <div className="error-banner" onClick={() => setError('')}>{error} <span>×</span></div>}

      {phase === PHASES.LOBBY    && <Lobby onCreate={handleCreate} onJoin={handleJoin} onSolo={handleSolo} />}
      {phase === PHASES.SET_CODE && (
        <SetCode roomCode={roomCode} playerIndex={playerIndex} players={players}
          round={round} mode={mode} onSetCode={handleSetCode} />
      )}
      {phase === PHASES.PLAYING  && (
        <Game players={players} playerIndex={playerIndex}
          guesses={guesses} opponentGuesses={opponentGuesses}
          onGuess={handleGuess} chat={chat} onChat={handleChat}
          round={round} currentTurn={currentTurn} mode={mode} playerName={playerName} />
      )}
      {phase === PHASES.GAME_OVER && (
        <GameOver data={gameOverData} playerIndex={playerIndex} scores={scores}
          round={round} mode={mode} onRematch={handleRematch} onLeave={handleBackToLobby} />
      )}
    </div>
  );
}