import React, { useState } from 'react';
import { Package, MessageSquare, Plus } from 'lucide-react';
import { fetchChatHistory } from '../api';

const Sidebar = ({ projects, activeProject, onSelectProject, onSelectChat, onCreateProject }) => {
  const [expandedProject, setExpandedProject] = useState(null);
  const [projectChats, setProjectChats] = useState({}); // { projectId: [chats] }

  const toggleProject = async (projectId) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
        setExpandedProject(projectId);
        const project = projects.find(p => p.id === projectId);
        onSelectProject(project);
        
        // Fetch chats
        if (!projectChats[projectId]) {
            try {
                const chats = await fetchChatHistory(projectId);
                setProjectChats(prev => ({ ...prev, [projectId]: chats }));
            } catch (err) {
                console.error("Failed to load chats", err);
            }
        }
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%' }}></div>
          Jarvis <span style={{fontSize: '0.8em', opacity: 0.5}}>Local</span>
        </h2>
      </div>
      
      <div style={{ padding: '1rem' }}>
        <button 
            onClick={onCreateProject} 
            style={{ 
                width: '100%',
                padding: '0.75rem', 
                background: 'var(--bg-tertiary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.borderColor = 'var(--text-secondary)'}
            onMouseOut={(e) => e.target.style.borderColor = 'var(--border-color)'}
        >
            <Plus size={16} /> New Project
        </button>
      </div>

      <div className="project-list" style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
        {projects.map(project => (
            <div key={project.id} style={{ marginBottom: '0.5rem' }}>
                <div 
                    onClick={() => toggleProject(project.id)}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: activeProject?.id === project.id ? 'var(--bg-tertiary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: activeProject?.id === project.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                >
                    <Package size={16} />
                    <span style={{ fontWeight: 500 }}>{project.name}</span>
                </div>
                
                {expandedProject === project.id && (
                    <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.5rem' }}>
                        {projectChats[project.id]?.map(chat => (
                            <div 
                                key={chat.id}
                                onClick={() => onSelectChat(chat)}
                                style={{
                                    padding: '0.4rem',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <MessageSquare size={14} />
                                {chat.title || "Untitled Chat"}
                            </div>
                        ))}
                         {(!projectChats[project.id] || projectChats[project.id].length === 0) && (
                            <div style={{ padding: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                No chats
                            </div>
                        )}
                    </div>
                )}
            </div>
        ))}
        {projects.length === 0 && <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No projects yet.</p>}
      </div>
    </div>
  );
};

export default Sidebar;
