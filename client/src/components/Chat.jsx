import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';

export default function Chat({ messages, onSend, myName }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (messages.length > prevLen.current) {
      if (!open) setUnread(u => u + (messages.length - prevLen.current));
      else endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLen.current = messages.length;
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [open]);

  const send = () => { if (text.trim()) { onSend(text.trim()); setText(''); } };

  return (
    <div className={`chat-widget ${open ? 'open' : ''}`}>
      {open && (
        <div className="chat-box">
          <div className="chat-header">
            <span>Chat</span>
            <button onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && <p className="chat-empty">No messages yet. Say hi!</p>}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.name === myName ? 'mine' : 'theirs'}`}>
                <span className="chat-name">{m.name === myName ? 'You' : m.name}</span>
                <span className="chat-text">{m.text}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="chat-input-row">
            <input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type a message..." maxLength={120} autoFocus />
            <button onClick={send} disabled={!text.trim()}>Send</button>
          </div>
        </div>
      )}
      <button className="chat-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '✕' : '💬'}
        {!open && unread > 0 && <span className="unread-badge">{unread}</span>}
      </button>
    </div>
  );
}