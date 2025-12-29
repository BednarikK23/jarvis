import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { fetchProjects, createProject, createChat, fetchChatHistory } from './api';
import ToolsPanel from './components/Tools/ToolsPanel';
import { PanelRight } from 'lucide-react';
import './App.css';

function App() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTools, setShowTools] = useState(false);


  const [projectChats, setProjectChats] = useState({}); // { projectId: [chats] }

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
      // Optional: auto-load chats for active project if we had persistence
      setLoading(false);
    } catch (err) {
      console.error("Failed to load projects", err);
      setLoading(false);
    }
  };

  const loadProjectChats = async (projectId) => {
      if (projectChats[projectId]) return; // already loaded
      try {
          const chats = await fetchChatHistory(projectId);
          setProjectChats(prev => ({ ...prev, [projectId]: chats }));
      } catch (err) {
          console.error("Failed to load chats", err);
      }
  };

  const handleCreateProject = async () => {
      const name = prompt("Enter project name:");
      if (!name) return;
      
      const description = prompt("Description (optional):");
      
      try {
          const newProject = await createProject(name, description, "");
          setProjects([newProject, ...projects]);
          setActiveProject(newProject);
          
          // UX: Immediately create a new chat for this project
          try {
              const newChat = await createChat(newProject.id, "New Chat");
              setProjectChats(prev => ({ 
                  ...prev, 
                  [newProject.id]: [newChat] 
              }));
              setActiveChat(newChat);
          } catch (chatErr) {
              console.error("Failed to auto-create chat", chatErr);
          }
      } catch (err) {
          alert("Failed to create project");
          console.error(err);
      }
  };

  const handleCreateChat = async (projectIdOverride = null) => {
      const targetProjectId = projectIdOverride || activeProject?.id;
      if (!targetProjectId) return;

      const title = prompt("Chat Title (optional):") || "New Chat";
      
      try {
          const newChat = await createChat(targetProjectId, title);
          
          setProjectChats(prev => {
              const existing = prev[targetProjectId] || [];
              return { ...prev, [targetProjectId]: [newChat, ...existing] };
          });
          
          // If created for active project, switch to it. If for another project, maybe just expand it?
          // For now, let's switch to it if it's the active project
          if (activeProject && activeProject.id === targetProjectId) {
               setActiveChat(newChat);
          }
      } catch (err) {
          console.error(err);
          alert("Failed to create chat");
      }
  };

  const handleRenameChat = async (chatId, currentTitle) => {
      const newTitle = prompt("Rename Chat:", currentTitle);
      if (!newTitle || newTitle === currentTitle) return;

      try {
          const res = await fetch(`/api/chat/${chatId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ project_id: 0, title: newTitle }) // project_id ignored by backend update logic but required by schema
          });
          
          if (!res.ok) throw new Error("Failed to update chat");
          const updatedChat = await res.json();

          // Update state
          setProjectChats(prev => {
              const next = { ...prev };
              for (const pid in next) {
                   next[pid] = next[pid].map(c => c.id === chatId ? updatedChat : c);
              }
              return next;
          });
          
          if (activeChat && activeChat.id === chatId) {
              setActiveChat(updatedChat);
          }
      } catch (err) {
          console.error(err);
          alert("Failed to rename chat");
      }
  };

  const handleUpdateProject = (projectId, updates) => {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
      if (activeProject && activeProject.id === projectId) {
          setActiveProject(prev => ({ ...prev, ...updates }));
      }
  };

  const handleDeleteProject = async (projectId) => {
      if (!window.confirm("Are you sure you want to delete this project?")) return;
      
      try {
          const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error("Failed to delete project");
          
          setProjects(prev => prev.filter(p => p.id !== projectId));
          if (activeProject && activeProject.id === projectId) {
              setActiveProject(null);
              setActiveChat(null);
          }
          // Cleanup chats from state
          setProjectChats(prev => {
              const next = { ...prev };
              delete next[projectId];
              return next;
          });
      } catch (err) {
          console.error(err);
          alert("Error deleting project");
      }
  };

  const handleDeleteChat = async (chatId) => {
      if (!window.confirm("Delete this chat?")) return;
      
      try {
          const res = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error("Failed to delete chat");
          
          if (activeChat && activeChat.id === chatId) {
              setActiveChat(null);
          }
          
          // Update state without reload
          // We need to find which project this chat belongs to. 
          // activeChat has project_id, but if we deleted a non-active chat?
          // We can iterate or rely on the fact that we usually delete active chats or from list.
          // Since we lifted state, we can iterate.
          setProjectChats(prev => {
              const next = { ...prev };
              for (const pid in next) {
                  next[pid] = next[pid].filter(c => c.id !== chatId);
              }
              return next;
          });
          
      } catch (err) {
          console.error(err);
          alert("Error deleting chat");
      }
  };

  const handleOpenDigestChat = async (chatId) => {
      try {
          const res = await fetch(`/api/chat/${chatId}`);
          if (!res.ok) throw new Error("Failed to fetch chat");
          const chat = await res.json();
          
          // Switch project context if needed
          if (!activeProject || activeProject.id !== chat.project_id) {
              const pRes = await fetch(`/api/projects/${chat.project_id}`);
              if (pRes.ok) {
                  const project = await pRes.json();
                  setActiveProject(project);
                  loadProjectChats(project.id);
              }
          }
          
          setActiveChat(chat);
          setShowTools(false);
      } catch (err) {
          console.error("Failed to open chat", err);
      }
  };

  return (
    <div className="app-container">
      <Sidebar 
         projects={projects}
         projectChats={projectChats}
         loadProjectChats={loadProjectChats}
         activeProject={activeProject}
         onSelectProject={setActiveProject}
         onSelectChat={setActiveChat}
         onCreateProject={handleCreateProject}
         onCreateChat={handleCreateChat}
         onDeleteProject={handleDeleteProject}
         onUpdateProject={handleUpdateProject}
         onRenameChat={handleRenameChat}
      />
      <main className="main-content">
        {activeProject ? (
            activeChat ? (
                <ChatWindow activeChat={activeChat} onDeleteChat={handleDeleteChat} />
            ) : (
                <div className="empty-state">
                    <h1>{activeProject.name}</h1>
                    <p>{activeProject.description || "No description"}</p>
                    <button 
                        style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'var(--accent-color)', borderRadius: 'var(--radius-md)', color: 'white' }}
                        onClick={handleCreateChat}
                    >
                        Start New Chat
                    </button>
                    {/* List existing chats here too just in case sidebar is confusing */}
                </div>
            )
        ) : (
            <div className="empty-state">
                <h1>Welcome to Jarvis</h1>
                <p>Select a project from the sidebar to begin.</p>
            </div>
        )}
      </main>

      
      <button 
        className="tools-toggle-btn"
        onClick={() => setShowTools(!showTools)}
        title="Toggle Tools"
      >
        <PanelRight size={20} />
      </button>
      
      <ToolsPanel 
        isOpen={showTools} 
        onClose={() => setShowTools(false)} 
        onOpenChat={handleOpenDigestChat}
      />
    </div>
  );
}

export default App;
