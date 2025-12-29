import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Trash2, Square } from 'lucide-react';
import { fetchChat } from '../api';
import MessageBubble from './MessageBubble';
import { DEFAULT_MODEL, MAX_CONTEXT_MESSAGES } from '../constants';
import ChatInput from './ChatInput';
import './ChatWindow.css';

/**
 * ChatWindow Component
 * Displays the chat interface including message history and input area.
 * Handles streaming responses, message history management, and model selection.
 * 
 * @param {Object} activeChat - The currently selected chat object
 * @param {Function} onDeleteChat - Callback function to delete the current chat
 */
const ChatWindow = ({ activeChat, onDeleteChat }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const bottomRef = useRef(null);
  const abortController = useRef(null);

  useEffect(() => {
    if (activeChat?.id) {
        loadChat(activeChat.id);
    }
  }, [activeChat]);

  // Fetch available models on mount
  useEffect(() => {
      const fetchModels = async () => {
          try {
              const res = await fetch('/api/models/');
              if (res.ok) {
                  const data = await res.json();
                  const models = data.models || [];
                  setAvailableModels(models);
                  // Ensure default is in the list, or select first available if not
                  if (models.length > 0 && !models.includes(DEFAULT_MODEL)) {
                      setSelectedModel(models[0]);
                  }
              }
          } catch (error) {
              console.error("Failed to fetch models:", error);
          }
      };
      
      fetchModels();
  }, []);

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

  /**
   * Handles sending a message to the backend.
   * Utilizes the native fetch API with a ReadableStream reader for real-time response streaming.
   * 
   * @param {Event} e - Form submission event
   */
  const handleSend = async (e) => {
      e.preventDefault();
      if (!input.trim() || streaming) return;

      const userMsg = { role: 'user', content: input };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      setStreaming(true);

      const controller = new AbortController();
      abortController.current = controller;

      try {
          // Prepare messages context for the API
          // We include the full history so far + new message, but limited to MAX_CONTEXT_MESSAGES
          const allMessages = [...messages, userMsg];
          const recentMessages = allMessages.slice(-MAX_CONTEXT_MESSAGES);
          const contextMessages = recentMessages.map(m => ({ role: m.role, content: m.content }));
          
          const response = await fetch(`/api/chat/${activeChat.id}/message`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  model: selectedModel, 
                  messages: contextMessages,
                  stream: true
              }),
              signal: controller.signal
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
                  const lastMsgIndex = newMsgs.length - 1;
                  const lastMsg = { ...newMsgs[lastMsgIndex] };
                  lastMsg.content += chunk;
                  newMsgs[lastMsgIndex] = lastMsg;
                  return newMsgs;
              });
          }
      } catch (err) {
          if (err.name === 'AbortError') {
              console.log('Generation stopped by user');
              // Optional: Indicate stopped state in UI if needed, or just leave as is
          } else {
              console.error(err);
              setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get response.' }]);
          }
      } finally {
          setLoading(false);
          setStreaming(false);
          abortController.current = null;
      }
  };

  const handleStop = () => {
      if (abortController.current) {
          abortController.current.abort();
      }
  };



// ...

  return (
    <div className="chat-window">
        <div className="chat-header">
             <h3 className="chat-title">{activeChat.title}</h3>
             
             <div className="chat-header-actions">
                <button 
                     onClick={() => {
                        if (window.confirm('Are you sure you want to delete this chat?')) {
                            onDeleteChat(activeChat.id);
                        }
                     }}
                     className="delete-chat-btn"
                     title="Delete Chat"
                >
                    <Trash2 size={18} />
                </button>
                <div className="model-selector-container">
                    <span className="model-label">Model:</span>
                    <select 
                        value={selectedModel} 
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="model-select"
                    >
                        {availableModels.length > 0 ? (
                            availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))
                        ) : (
                            <option value={selectedModel}>{selectedModel}</option>
                        )}
                    </select>
                </div>
             </div>
        </div>
        
        <div className="messages-container">
            {messages.map((msg, idx) => (
                <MessageBubble key={idx} role={msg.role} content={msg.content} />
            ))}
            {loading && !streaming && (
                <div className="loader-container">
                    <Loader2 className="spin" />
                </div>
            )}
            <div ref={bottomRef} />
        </div>

        <div className="input-area-container">
            <ChatInput 
                input={input}
                setInput={setInput}
                handleSend={handleSend}
                handleStop={handleStop}
                loading={loading}
                streaming={streaming}
            />
            <div className="input-disclaimer">
                Jarvis can make mistakes. Please verify important information.
            </div>
        </div>
    </div>
  );
};

export default ChatWindow;
