import React from 'react';
import { Package, MessageSquare, Trash2, Settings, Plus, Edit2 } from 'lucide-react';

const ProjectItem = ({ 
    project, 
    activeProject, 
    expandedProject, 
    projectChats, 
    toggleProject, 
    onSelectChat, 
    setEditingProject, 
    onDeleteProject,
    onCreateChat,
    onRenameChat
}) => {
    const isActive = activeProject?.id === project.id;
    const isExpanded = expandedProject === project.id;
    const chats = projectChats[project.id];

    return (
        <div className="project-item-container">
            <div className={`project-item-header ${isActive ? 'active' : ''}`}>
                <div 
                    onClick={() => toggleProject(project.id)}
                    className="project-name-container"
                >
                    <Package size={16} style={{ flexShrink: 0 }} />
                    <span className="project-name">
                        {project.name}
                    </span>
                </div>
                
                {/* Project Actions */}
                <div className="project-actions">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCreateChat(project.id);
                        }}
                        className="icon-btn"
                        title="New Chat"
                    >
                        <Plus size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                        }}
                        className="icon-btn"
                        title="Project Settings"
                    >
                        <Settings size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete project "${project.name}" and all its chats?`)) {
                                onDeleteProject(project.id);
                            }
                        }}
                        className="icon-btn"
                        title="Delete Project"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            
            {isExpanded && (
                <div className="chat-list">
                    {chats?.map(chat => (
                        <div 
                            key={chat.id}
                            onClick={() => onSelectChat(chat)}
                            className="chat-item"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                                <MessageSquare size={14} style={{flexShrink: 0}} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {chat.title || "Untitled Chat"}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRenameChat(chat.id, chat.title);
                                }}
                                className="chat-edit-btn"
                                title="Rename Chat"
                            >
                                <Edit2 size={12} />
                            </button>
                        </div>
                    ))}
                     {(!chats || chats.length === 0) && (
                        <div className="chat-empty">
                            No chats
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectItem;
