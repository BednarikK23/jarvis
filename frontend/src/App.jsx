import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { fetchProjects, createProject, createChat, fetchChatHistory } from './api';
import './App.css';

function App() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
      if (data.length > 0 && !activeProject) {
        // Optionally auto-select first project? No, let user choose.
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load projects", err);
      setLoading(false);
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
      } catch (err) {
          alert("Failed to create project");
          console.error(err);
      }
  };

  const handleCreateChat = async () => {
      if (!activeProject) return;
      const title = prompt("Chat Title (optional):") || "New Chat";
      try {
          const newChat = await createChat(activeProject.id, title);
          // We need to refresh chats or let Sidebar handle it. 
          // Ideally Sidebar should manage chats fetching or we pass a callback.
          // For now, let's just set it as active and let ChatWindow load it?
          // But Sidebar won't show it unless we reload chats list there.
          // Let's pass a trigger or reload function to Sidebar.
          setActiveChat(newChat);
          // Quick hack: reload projects/chats? No, better state management needed.
          // We'll pass `projects` to Sidebar, but sidebar needs to know a new chat exists for the active project.
          // We'll add a refreshKey or similar.
          window.location.reload(); // BRUTE FORCE for MVP speed
      } catch (err) {
          console.error(err);
      }
  };

  const handleUpdateProject = (projectId, updates) => {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
      if (activeProject && activeProject.id === projectId) {
          setActiveProject(prev => ({ ...prev, ...updates }));
      }
  };

  const handleDeleteProject = async (projectId) => {
      console.log("Deleting project:", projectId);
      try {
          const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
          console.log("Delete project response:", res.status);
          if (!res.ok) {
              const text = await res.text();
              console.error("Delete project error body:", text);
              throw new Error("Failed to delete project: " + text);
          }
          
          setProjects(prev => prev.filter(p => p.id !== projectId));
          if (activeProject && activeProject.id === projectId) {
              setActiveProject(null);
              setActiveChat(null);
          }
      } catch (err) {
          console.error("Delete project caught error:", err);
          alert("Error deleting project: " + err.message);
      }
  };

  const handleDeleteChat = async (chatId) => {
      console.log("Deleting chat:", chatId);
      try {
          const res = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
          console.log("Delete chat response:", res.status);
          if (!res.ok) {
              const text = await res.text();
              console.error("Delete chat error body:", text);
              throw new Error("Failed to delete chat: " + text);
          }
          
          setActiveChat(null);
          window.location.reload(); // Refresh to update sidebar list
      } catch (err) {
          console.error("Delete chat caught error:", err);
          alert("Error deleting chat: " + err.message);
      }
  };

  return (
    <div className="app-container">
      <Sidebar 
         projects={projects}
         activeProject={activeProject}
         onSelectProject={setActiveProject}
         onSelectChat={setActiveChat}
         onCreateProject={handleCreateProject}
         onDeleteProject={handleDeleteProject}
         onUpdateProject={handleUpdateProject}
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
    </div>
  );
}

export default App;
