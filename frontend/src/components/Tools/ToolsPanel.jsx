import React from 'react';
import TodoWidget from './TodoWidget';
import CalendarWidget from './CalendarWidget';
import './Tools.css';
import { X } from 'lucide-react';

const ToolsPanel = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="tools-panel">
            <div className="tools-header">
                <h2>Productivity</h2>
                <button onClick={onClose} className="close-tools"><X size={20} /></button>
            </div>
            <div className="tools-content">
                <TodoWidget />
                <div className="tools-divider"></div>
                <CalendarWidget />
            </div>
        </div>
    );
};

export default ToolsPanel;
