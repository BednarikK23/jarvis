from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Message Schemas ---
class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    chat_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Chat Schemas ---
class ChatBase(BaseModel):
    title: Optional[str] = None

class ChatCreate(ChatBase):
    project_id: int

class Chat(ChatBase):
    id: int
    project_id: int
    created_at: datetime
    messages: List[Message] = []

    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    # We might not want to return all chats for a project list view, so maybe make this optional or separate
    chats: List[Chat] = []

    class Config:
        from_attributes = True

# --- Chat Completion Request ---
class ChatRequest(BaseModel):
    model: str
    messages: List[MessageBase]
    stream: bool = True

class KnowledgeSourceBase(BaseModel):
    path: str

class KnowledgeSourceCreate(KnowledgeSourceBase):
    pass

class KnowledgeSource(KnowledgeSourceBase):
    id: int
    project_id: int
    status: str
    last_indexed: Optional[datetime] = None

    class Config:
        from_attributes = True
