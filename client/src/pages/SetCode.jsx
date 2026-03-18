import React, { useState } from 'react';
import './SetCode.css';

export default function SetCode({ roomCode, playerIndex, players, round, mode, onSetCode }) {
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleSubmit = () => {
    if (code.length === 4 && /^\d{4}$/.test(code)) { onSetCode(code); setSubmitted(true); }
  };

  const myPlayer = players.find((_, i) => i === playerIndex);
  const opponent = players.find((_, i) => i !== playerIndex);
  const meReady  = myPlayer?.ready || submitted;
  const isSolo   = mode === 'solo';

  return (
    <div className="setcode">
      <div className="setcode-top">
        {!isSolo && (
          <div className="room-badge">
            Room <span>{roomCode}</span>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(roomCode)}>Copy</button>
          </div>
        )}
        {round > 1 && <div className="round-badge">Round {round}</div>}
        {isSolo && <div className="mode-badge">vs Computer</div>}
      </div>

      <h2>Set Your Secret Code</h2>
      <p className="hint">Choose any 4-digit number. {isSolo ? 'The computer will try to crack it!' : 'Your opponent will try to crack it!'}</p>

      <div className="code-display">
        {[0,1,2,3].map(i => (
          <div key={i} className={`digit-box ${code[i] ? 'filled' : ''}`}>
            {revealed ? (code[i] || '·') : (code[i] ? '●' : '·')}
          </div>
        ))}
        <button className="reveal-btn" onClick={() => setRevealed(r => !r)}>
          {revealed ? '🙈 Hide' : '👁 Show'}
        </button>
      </div>

      <input type="number" className="hidden-input" value={code}
        onChange={e => { const val = e.target.value.slice(0,4); if(/^\d*$/.test(val)) setCode(val); }}
        disabled={submitted} placeholder="Type your 4-digit code" autoFocus />

      <div className="numpad">
        {[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map((k, i) => (
          <button key={i}
            className={`numpad-key ${k==='✓'?'confirm':k==='⌫'?'del':''}`}
            disabled={submitted}
            onClick={() => {
              if (k === '⌫') setCode(c => c.slice(0,-1));
              else if (k === '✓') handleSubmit();
              else if (code.length < 4) setCode(c => c + k);
            }}>{k}</button>
        ))}
      </div>

      <div className="players-status">
        <div className={`player-status ${meReady ? 'ready' : ''}`}>
          <span className="dot" />You {meReady ? '— Ready!' : '— Setting code...'}
        </div>
        {isSolo ? (
          <div className="player-status ready">
            <span className="dot" />Computer — Ready!
          </div>
        ) : opponent ? (
          <div className={`player-status ${opponent.ready ? 'ready' : ''}`}>
            <span className="dot" />{opponent.name} {opponent.ready ? '— Ready!' : '— Setting code...'}
          </div>
        ) : (
          <div className="player-status waiting">
            <span className="dot" />Waiting for opponent to join...
          </div>
        )}
      </div>

      {submitted && !isSolo && !opponent?.ready && (
        <p className="waiting-msg">Waiting for {opponent?.name || 'opponent'} to set their code...</p>
      )}
    </div>
  );
}