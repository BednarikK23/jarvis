
import React, { useState } from 'react';
import { Package, MessageSquare, Plus, Trash2, Settings } from 'lucide-react';

import PromptEditor from './PromptEditor';
import ProjectItem from './ProjectItem';

import './Sidebar.css';

const Sidebar = ({ 
    projects, 
    projectChats, 
    loadProjectChats, 
    activeProject, 
    onSelectProject, 
    onSelectChat, 
    onCreateProject, 
    onCreateChat,
    onDeleteProject, 
    onUpdateProject,
    onRenameChat
}) => {
  const [expandedProject, setExpandedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null); // project object

  const toggleProject = (projectId) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
        setExpandedProject(projectId);
        const project = projects.find(p => p.id === projectId);
        onSelectProject(project);
        
        // Fetch chats via parent
        loadProjectChats(projectId);
    }
  };

  const handleUpdatePrompt = async (payload) => {
      if (!editingProject) return;
      try {
          const res = await fetch(`/api/projects/${editingProject.id}/prompt`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error("Failed to update prompt");
          const data = await res.json();
          
          // Notify parent to update local state
          if (onUpdateProject) {
              onUpdateProject(editingProject.id, { system_prompt: data.system_prompt });
          }
      } catch (err) {
          console.error(err);
          alert("Error updating prompt: " + err.message);
      }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <div className="sidebar-title-dot"></div>
          Jarvis <span className="sidebar-title-suffix">Local</span>
        </h2>
      </div>
      
      <div className="new-project-btn-container">
        <button 
            onClick={onCreateProject} 
            className="new-project-btn"
        >
            <Plus size={16} /> New Project
        </button>
      </div>

      <div className="project-list">
        {projects.map(project => (
            <ProjectItem 
                key={project.id}
                project={project}
                activeProject={activeProject}
                expandedProject={expandedProject}
                projectChats={projectChats}
                toggleProject={toggleProject}
                onSelectChat={onSelectChat}
                setEditingProject={setEditingProject}
                onDeleteProject={onDeleteProject}
                onCreateChat={onCreateChat}
                onRenameChat={onRenameChat}
            />
        ))}
        {projects.length === 0 && <p className="project-empty-state">No projects yet.</p>}
      </div>

      {editingProject && (
          <PromptEditor 
            projectId={editingProject.id}
            currentPrompt={editingProject.system_prompt}
            onClose={() => setEditingProject(null)}
            onSave={handleUpdatePrompt}
          />
      )}
    </div>
  );
};

export default Sidebar;
