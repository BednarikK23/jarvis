import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
        <div style={{ color: 'var(--text-primary)' }}>
            <ReactMarkdown
                components={{
                    code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <div style={{ borderRadius: '6px', overflow: 'hidden', margin: '0.5rem 0' }}>
                                <SyntaxHighlighter
                                    {...props}
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.9rem' }}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code {...props} className={className} style={{ 
                                background: 'var(--bg-tertiary)', 
                                padding: '2px 5px', 
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                            }}>
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
