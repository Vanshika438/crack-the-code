import React, { useState, useRef, useEffect } from 'react';
import Chat from '../components/Chat';
import './Game.css';

// ── My guesses panel ──────────────────────────────────────────
function MyGuessList({ guesses }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [guesses]);
  return (
    <div className="guess-panel my-panel">
      <div className="panel-header">Your guesses ({guesses.length})</div>
      <div className="guess-list">
        {guesses.length === 0 && <p className="no-guesses">Make your first guess!</p>}
        {guesses.map((g, i) => (
          <div key={i} className="guess-row">
            <span className="turn-num">#{g.turn || i+1}</span>
            <span className="guess-digits">{g.guess}</span>
            <div className="badges">
              <span className="hit-badge"  title="Digits that exist in secret">🎯<strong>{g.hit}</strong></span>
              <span className="pos-badge"  title="Digits in exact right position">📍<strong>{g.position}</strong></span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Opponent guesses panel ────────────────────────────────────
function OppGuessList({ guesses, opponentName, isSolo }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [guesses]);
  return (
    <div className="guess-panel opp-panel">
      <div className="panel-header">{opponentName}'s guesses ({guesses.length})</div>
      <div className="guess-list">
        {guesses.length === 0 && (
          <p className="no-guesses">{isSolo ? 'Computer will guess here...' : "Waiting for opponent..."}</p>
        )}
        {guesses.map((g, i) => (
          <div key={i} className="guess-row opp-row">
            <span className="turn-num">#{g.turn || i+1}</span>
            {isSolo
              ? <span className="guess-digits">{g.guess}</span>
              : <span className="hidden-guess">? ? ? ?</span>
            }
            <div className="badges">
              <span className="hit-badge">🎯<strong>{g.hit}</strong></span>
              <span className="pos-badge">📍<strong>{g.position}</strong></span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}



// ── Main Game ─────────────────────────────────────────────────
export default function Game({ players, playerIndex, guesses, opponentGuesses, onGuess,
  chat, onChat, round, currentTurn, mode, playerName }) {

  const [input, setInput]     = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const me       = players[playerIndex];
  const opponent = players[1 - playerIndex];
  const isSolo   = mode === 'solo';
  const isMyTurn = currentTurn === playerIndex;

  const handleGuess = () => {
    if (/^\d{4}$/.test(input) && isMyTurn) { onGuess(input); setInput(''); }
  };

  return (
    <div className="game">

      {/* ── Score / Turn bar ── */}
      <div className="score-bar">
        <div className="score-item my-score">
          <span className="score-name">{me?.name || 'You'}</span>
          <span className="score-val">{me?.score ?? 0}</span>
        </div>
        <div className="center-info">
          <span className="round-label">Round {round}</span>
          <div className={`turn-pill ${isMyTurn ? 'my-turn' : 'opp-turn'}`}>
            {isMyTurn
              ? '● Your turn'
              : `● ${opponent?.name || (isSolo ? 'Computer' : 'Opponent')}'s turn`}
          </div>
        </div>
        <div className="score-item opp-score">
          <span className="score-val">{opponent?.score ?? 0}</span>
          <span className="score-name">{opponent?.name || (isSolo ? 'Computer' : 'Opponent')}</span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="legend-bar">
        <span className="leg-item">
          <span className="hit-pill">🎯 Hit</span>
          <span className="leg-desc">digit exists in secret (any spot)</span>
        </span>
        <span className="leg-sep">|</span>
        <span className="leg-item">
          <span className="pos-pill">📍 Position</span>
          <span className="leg-desc">digit is in the exact right spot</span>
        </span>
        <button className="help-toggle" onClick={() => setShowHelp(h => !h)}>
          {showHelp ? 'Hide' : 'Example'}
        </button>
      </div>

      {/* ── Example ── */}
      {showHelp && (
        <div className="help-box">
          <p className="help-title">Secret is <code>1 2 3 4</code></p>
          <div className="help-rows">
            {[
              { g:'5 6 7 8', h:0, p:0, note:'None of 5,6,7,8 exist in 1234' },
              { g:'2 9 9 9', h:1, p:0, note:'2 exists in secret → 1 Hit, but wrong position → 0 Position' },
              { g:'1 9 9 9', h:1, p:1, note:'1 exists AND is in position 1 → 1 Hit, 1 Position' },
              { g:'2 1 4 3', h:4, p:0, note:'All 4 digits exist but all in wrong spots → 4 Hits, 0 Position' },
              { g:'1 2 9 4', h:3, p:3, note:'1,2,4 exist and are in right spots → 3 Hits, 3 Positions' },
              { g:'1 2 3 4', h:4, p:4, note:'All correct! 4 Positions = You WIN 🏆', win: true },
            ].map((r, i) => (
              <div key={i} className={`help-row ${r.win ? 'win-row' : ''}`}>
                <span className="ex-guess">{r.g}</span>
                <span className="ex-arrow">→</span>
                <span className="ex-badges">
                  <span className="hit-badge">🎯<strong>{r.h}</strong></span>
                  <span className="pos-badge">📍<strong>{r.p}</strong></span>
                </span>
                <span className="ex-note">{r.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Guess panels ── */}
      <div className="panels">
        <MyGuessList guesses={guesses} />
        <OppGuessList
          guesses={opponentGuesses}
          opponentName={opponent?.name || (isSolo ? 'Computer' : 'Opponent')}
          isSolo={isSolo}
        />
      </div>

      {/* ── Input ── */}
      <div className={`guess-input-area ${!isMyTurn ? 'locked' : ''}`}>
        {isMyTurn ? (
          <>
            <div className="input-row">
              <input type="number" placeholder="Enter 4-digit guess" value={input}
                onChange={e => { const v = e.target.value.slice(0,4); if(/^\d*$/.test(v)) setInput(v); }}
                onKeyDown={e => e.key === 'Enter' && handleGuess()}
                maxLength={4} autoFocus />
              <button className="guess-btn" onClick={handleGuess} disabled={!/^\d{4}$/.test(input)}>
                Guess →
              </button>
            </div>
            <p className="input-hint">
              Guessing <strong>{opponent?.name || (isSolo ? 'Computer' : 'opponent')}'s</strong> code — get 📍 4 to win!
            </p>
          </>
        ) : (
          <div className="waiting-turn">
            <span className="spin">⏳</span>
            Waiting for <strong>{opponent?.name || (isSolo ? 'Computer' : 'Opponent')}</strong> to guess...
          </div>
        )}
      </div>

      {/* Chat only in multiplayer */}
      {!isSolo && <Chat messages={chat} onSend={onChat} myName={playerName} />}
    </div>
  );
}