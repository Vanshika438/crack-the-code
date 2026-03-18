import React, { useState } from 'react';
import './Lobby.css';

export default function Lobby({ onCreate, onJoin, onSolo }) {
  const [name, setName]         = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab]           = useState('solo');

  const handleSolo   = () => { if (name.trim()) onSolo(name.trim()); };
  const handleCreate = () => { if (name.trim()) onCreate(name.trim()); };
  const handleJoin   = () => { if (name.trim() && joinCode.trim()) onJoin(name.trim(), joinCode.trim().toUpperCase()); };

  const onKey = (e) => {
    if (e.key !== 'Enter') return;
    if (tab === 'solo') handleSolo();
    else if (tab === 'create') handleCreate();
    else handleJoin();
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <div className="logo-mark">◈</div>
        <h1>Crack the Code</h1>
        <p className="tagline">Guess your opponent's 4-digit secret.</p>
      </div>

      <div className="lobby-card">
        <div className="tabs">
          <button className={tab === 'solo'   ? 'active' : ''} onClick={() => setTab('solo')}>vs Computer</button>
          <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>Create Room</button>
          <button className={tab === 'join'   ? 'active' : ''} onClick={() => setTab('join')}>Join Room</button>
        </div>

        <div className="form-group">
          <label>Your Name</label>
          <input type="text" placeholder="Enter your name" value={name}
            onChange={e => setName(e.target.value)} onKeyDown={onKey}
            maxLength={16} autoFocus />
        </div>

        {tab === 'join' && (
          <div className="form-group">
            <label>Room Code</label>
            <input type="text" placeholder="e.g. AB12CD" value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={onKey} maxLength={6} className="code-input" />
          </div>
        )}

        {tab === 'solo' && (
          <div className="solo-info">
            Play alone against the Computer — take turns guessing each other's secret code. First to crack it wins!
          </div>
        )}

        <button className="btn-primary"
          onClick={tab === 'solo' ? handleSolo : tab === 'create' ? handleCreate : handleJoin}
          disabled={!name.trim() || (tab === 'join' && !joinCode.trim())}>
          {tab === 'solo' ? 'Play vs Computer →' : tab === 'create' ? 'Create Room →' : 'Join Room →'}
        </button>

        <div className="rules">
          <p className="rules-title">How scoring works</p>
          <div className="rule-row">
            <span className="rule-badge hit-badge">🎯 Hit</span>
            <span>How many digits in your guess <strong>exist</strong> in the secret (any position)</span>
          </div>
          <div className="rule-row">
            <span className="rule-badge pos-badge">📍 Position</span>
            <span>How many digits are in the <strong>exact correct position</strong></span>
          </div>
          <div className="rule-example">
            <span className="ex-label">Secret</span>
            <span className="ex-code">1 2 3 4</span>
            <span className="ex-label">Guess</span>
            <span className="ex-code">1 5 3 9</span>
            <span className="ex-result">→ 🎯 2 &nbsp; 📍 2</span>
          </div>
          <div className="rule-note">1 and 3 exist in secret (2 Hits), both also in right spots (2 Positions). Win = 📍 4</div>
        </div>
      </div>
    </div>
  );
}