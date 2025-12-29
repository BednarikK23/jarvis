import React from 'react';
import { Send, Square } from 'lucide-react';
import './ChatWindow.css';

const ChatInput = ({ input, setInput, handleSend, handleStop, loading, streaming }) => {
    return (
        <form 
            onSubmit={handleSend}
            className="chat-input-form"
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
                className="chat-input-textarea"
            />
            {streaming ? (
                <button 
                    type="button" 
                    onClick={handleStop}
                    className="chat-input-btn chat-input-stop-btn"
                    title="Stop generation"
                >
                    <Square size={20} fill="currentColor" />
                </button>
            ) : (
                <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="chat-input-btn"
                    style={{ 
                        color: input.trim() ? 'var(--accent-color)' : 'var(--text-muted)',
                    }}
                >
                    <Send size={20} />
                </button>
            )}
        </form>
    );
};

export default ChatInput;
