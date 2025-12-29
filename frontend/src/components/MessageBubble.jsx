import React from 'react';
import { User, Bot } from 'lucide-react';

const MessageBubble = ({ role, content }) => {
  const isUser = role === 'user';
  
  return (
    <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        padding: '1.5rem', 
        backgroundColor: isUser ? 'transparent' : 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
    }}>
      <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '4px', 
          background: isUser ? 'var(--bg-tertiary)' : 'var(--accent-color)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
      }}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      
      <div style={{ flex: 1, lineHeight: '1.6', fontSize: '0.95rem' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isUser ? 'You' : 'Jarvis'}
        </p>
        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
            {content}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
