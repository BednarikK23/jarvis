import React, { useState } from 'react';
import TodoWidget from './TodoWidget';
import DigestWidget from './DigestWidget';
import CalendarWidget from './CalendarWidget';
import WeatherWidget from './WeatherWidget'; // Assuming created
import ErrorBoundary from '../ErrorBoundary';
import './Tools.css';
import { X, Layout, Newspaper } from 'lucide-react';

const ToolsPanel = ({ isOpen, onClose, onOpenChat }) => {
    const [activeTab, setActiveTab] = useState('productivity'); // 'productivity' | 'news'

    if (!isOpen) return null;

    return (
        <div className="tools-panel">
            <div className="tools-header">
                <div className="tools-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'productivity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('productivity')}
                    >
                        <Layout size={16} /> Productivity
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`}
                        onClick={() => setActiveTab('news')}
                    >
                        <Newspaper size={16} /> News
                    </button>
                </div>
                <button onClick={onClose} className="close-tools"><X size={20} /></button>
            </div>
            
            <div className="tools-content">
                {activeTab === 'productivity' && (
                    <div className="tab-content">
                         <ErrorBoundary key="todo">
                            <TodoWidget />
                        </ErrorBoundary>
                        <div className="tools-divider"></div>
                        <ErrorBoundary key="calendar">
                            <CalendarWidget />
                        </ErrorBoundary>
                    </div>
                )}

                {activeTab === 'news' && (
                    <div className="tab-content full-height">
                        <ErrorBoundary key="digest">
                            <DigestWidget onOpenChat={(chatId) => {
                                onOpenChat(chatId);
                                onClose();
                            }}/>
                        </ErrorBoundary>
                         {/* Spacer to push weather to bottom if flex column */}
                        <div style={{ flex: 1 }}></div>
                        <div className="tools-divider"></div>
                        <ErrorBoundary key="weather">
                            <WeatherWidget />
                        </ErrorBoundary>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolsPanel;
