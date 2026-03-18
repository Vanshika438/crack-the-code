import React, { useEffect, useState } from 'react';
import './Timer.css';

export default function Timer({ duration, startTime }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (!startTime) return;
    const tick = () => {
      const left = Math.max(0, duration - (Date.now() - startTime));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [duration, startTime]);

  const secs = Math.ceil(remaining / 1000);
  const pct = (remaining / duration) * 100;
  const urgent = secs <= 10;
  const critical = secs <= 5;
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;

  return (
    <div className={`timer ${urgent ? 'urgent' : ''} ${critical ? 'critical' : ''}`}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle cx="28" cy="28" r={r} fill="none"
          stroke={critical ? 'var(--accent2)' : urgent ? 'var(--warning)' : 'var(--accent)'}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          style={{ transition: 'stroke-dasharray 0.1s linear, stroke 0.3s' }}
        />
        <text x="28" y="33" textAnchor="middle"
          fill={critical ? 'var(--accent2)' : urgent ? 'var(--warning)' : 'var(--text)'}
          fontSize="14" fontWeight="700" fontFamily="Space Mono, monospace">
          {secs}
        </text>
      </svg>
    </div>
  );
}