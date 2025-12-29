import React from 'react';
import TodoWidget from './TodoWidget';
import DigestWidget from './DigestWidget';
import CalendarWidget from './CalendarWidget';
import ErrorBoundary from '../ErrorBoundary';
import './Tools.css';
import { X } from 'lucide-react';

const ToolsPanel = ({ isOpen, onClose, onOpenChat }) => {
    if (!isOpen) return null;

    return (
        <div className="tools-panel">
            <div className="tools-header">
                <h2>Productivity</h2>
                <button onClick={onClose} className="close-tools"><X size={20} /></button>
            </div>
            <div className="tools-content">
                <ErrorBoundary key="digest">
                    <DigestWidget onOpenChat={(chatId) => {
                        onOpenChat(chatId);
                        onClose();
                    }}/>
                </ErrorBoundary>
                <div className="tools-divider"></div>
                <ErrorBoundary key="todo">
                    <TodoWidget />
                </ErrorBoundary>
                <div className="tools-divider"></div>
                <ErrorBoundary key="calendar">
                    <CalendarWidget />
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default ToolsPanel;
