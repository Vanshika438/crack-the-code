import React from 'react';
import './GameOver.css';

export default function GameOver({ data, playerIndex, scores, round, mode, onRematch, onLeave }) {
  if (!data) return null;
  const iWon   = data.playerIndex === playerIndex;
  const isSolo = mode === 'solo';

  return (
    <div className="gameover">
      <div className="result-icon">{iWon ? '🏆' : '💀'}</div>
      <h2 className={iWon ? 'win' : 'lose'}>
        {iWon ? 'You cracked it!' : isSolo ? 'Computer wins!' : 'Code cracked!'}
      </h2>
      <p className="result-sub">
        {iWon
          ? `You guessed ${isSolo ? "the Computer's" : "your opponent's"} code first!`
          : isSolo
            ? 'The computer cracked your code. Try again!'
            : `${data.winnerName} cracked your code first.`}
      </p>

      {!isSolo && scores.length > 0 && (
        <div className="scoreboard">
          <p className="scoreboard-label">Score — Round {round}</p>
          <div className="score-rows">
            {scores.map((s, i) => (
              <div key={i} className={`score-row ${i === data.playerIndex ? 'winner-row' : ''}`}>
                <span className="score-player">{i === playerIndex ? `${s.name} (You)` : s.name}</span>
                <span className="score-pts">{s.score} {s.score === 1 ? 'win' : 'wins'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="secrets-reveal">
        <p className="secrets-label">The secret codes were:</p>
        <div className="secrets-grid">
          {data.secrets?.map((s, i) => (
            <div key={i} className="secret-card">
              <div className="secret-name">{s.name}{i === playerIndex ? ' (You)' : ''}</div>
              <div className="secret-code">{s.code}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="actions">
        <button className="btn-rematch" onClick={onRematch}>Play Again</button>
        <button className="btn-leave"   onClick={onLeave}>Leave</button>
      </div>
    </div>
  );
}