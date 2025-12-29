const API_BASE = '/api';

export const fetchModels = async () => {
  const response = await fetch(`${API_BASE}/models/`);
  if (!response.ok) throw new Error('Failed to fetch models');
  return response.json();
};

export const fetchProjects = async () => {
  const response = await fetch(`${API_BASE}/projects/`);
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
};

export const createProject = async (name, description, systemPrompt) => {
  const response = await fetch(`${API_BASE}/projects/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, system_prompt: systemPrompt }),
  });
  if (!response.ok) throw new Error('Failed to create project');
  return response.json();
};

export const createChat = async (projectId, title) => {
  const response = await fetch(`${API_BASE}/chat/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, title }),
  });
  if (!response.ok) throw new Error('Failed to create chat');
  return response.json();
};

export const fetchChatHistory = async (projectId) => {
  const response = await fetch(`${API_BASE}/chat/history/${projectId}`);
  if (!response.ok) throw new Error('Failed to fetch chat history');
  return response.json();
};

export const fetchChat = async (chatId) => {
  const response = await fetch(`${API_BASE}/chat/${chatId}`);
  if (!response.ok) throw new Error('Failed to fetch chat');
  return response.json();
};
