
import React, { useState } from 'react';
import { X, MessageSquare, Database } from 'lucide-react';

import KnowledgeBase from './KnowledgeBase';
import PromptSettings from './PromptSettings';
import './ProjectSettingsModal.css';

const ProjectSettingsModal = ({ projectId, currentPrompt, onClose, onSavePrompt }) => {
    const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' or 'knowledge'
    
    return (
        <div className="settings-modal-overlay">
            <div className="settings-modal">
                <div className="settings-modal-header">
                    <h3 className="settings-modal-title">Project Settings</h3>
                    <button onClick={onClose} className="settings-modal-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="settings-modal-tabs">
                     <button 
                        onClick={() => setActiveTab('prompt')}
                        className={`settings-tab ${activeTab === 'prompt' ? 'active' : ''}`}
                    >
                        <MessageSquare size={16} /> System Prompt
                    </button>
                    <button 
                        onClick={() => setActiveTab('knowledge')}
                        className={`settings-tab ${activeTab === 'knowledge' ? 'active' : ''}`}
                    >
                        <Database size={16} /> Knowledge Base
                    </button>
                </div>

                <div className="settings-modal-content">
                    
                    {activeTab === 'prompt' && (
                        <PromptSettings 
                            currentPrompt={currentPrompt} 
                            onSavePrompt={async (payload) => {
                                await onSavePrompt(payload);
                                onClose();
                            }} 
                        />
                    )}

                    {activeTab === 'knowledge' && (
                        <div className="knowledge-section">
                             <p className="settings-desc">
                                Add local folders to give the AI access to your code files and documents.
                            </p>
                            <KnowledgeBase projectId={projectId} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ProjectSettingsModal;
