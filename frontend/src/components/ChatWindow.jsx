import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { fetchChat } from '../api';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ activeChat }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (activeChat?.id) {
        loadChat(activeChat.id);
    }
  }, [activeChat]);

  useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const loadChat = async (chatId) => {
      try {
          const chat = await fetchChat(chatId);
          setMessages(chat.messages || []);
      } catch (err) {
          console.error("Failed to load chat", err);
      }
  };

  const handleSend = async (e) => {
      e.preventDefault();
      if (!input.trim() || streaming) return;

      const userMsg = { role: 'user', content: input };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      setStreaming(true);

      try {
          // Prepare messages context for the API
          // We include the full history so far + new message
          const contextMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
          
          const response = await fetch(`/api/chat/${activeChat.id}/message`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  model: 'qwen2.5-coder:7b', // Defaulting to the coding model requested by user
                  messages: contextMessages,
                  stream: true
              })
          });

          if (!response.ok) throw new Error('Failed to send message');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          // Add placeholder for assistant message
          setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              // Update last message
              setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  lastMsg.content += chunk;
                  return newMsgs;
              });
          }
      } catch (err) {
          console.error(err);
          setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get response.' }]);
      } finally {
          setLoading(false);
          setStreaming(false);
      }
  };

  return (
    <div className="chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="chat-header" style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{activeChat.title}</h3>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                 Model: qwen2.5-coder:7b
             </span>
        </div>
        
        <div className="messages" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, idx) => (
                <MessageBubble key={idx} role={msg.role} content={msg.content} />
            ))}
            {loading && !streaming && (
                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <Loader2 className="spin" />
                </div>
            )}
            <div ref={bottomRef} />
        </div>

        <div className="input-area" style={{ padding: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <form 
                onSubmit={handleSend}
                style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'flex-end',
                    focusWithin: { borderColor: 'var(--accent-color)' } // Pseudo-style, accomplished via CSS usually
                }}
            >
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                        }
                    }}
                    placeholder="Message Jarvis..." 
                    style={{ 
                        flex: 1, 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--text-primary)',
                        padding: '0.5rem',
                        resize: 'none',
                        minHeight: '2rem',
                        maxHeight: '150px',
                        outline: 'none',
                        fontFamily: 'inherit'
                    }} 
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || streaming}
                    style={{ 
                        padding: '0.5rem', 
                        color: input.trim() ? 'var(--accent-color)' : 'var(--text-muted)',
                        cursor: input.trim() ? 'pointer' : 'default'
                    }}
                >
                    <Send size={20} />
                </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Jarvis can make mistakes. Please verify important information.
            </div>
        </div>
    </div>
  );
};

export default ChatWindow;
