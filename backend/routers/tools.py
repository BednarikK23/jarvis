from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
import models
import schemas
from services.finance_service import FinanceService
from services.research_service import ResearchService
from services.weather_service import WeatherService
from services.digest_service import DigestService
from services.json_storage import JsonStorageService

router = APIRouter(
    prefix="/api/tools",
    tags=["tools"]
)

# Initialize services
finance_service = FinanceService()
research_service = ResearchService()
weather_service = WeatherService()
digest_service = DigestService(finance_service, research_service, weather_service)

# Tool Storage
todo_storage = JsonStorageService("todos.json")
calendar_storage = JsonStorageService("calendar.json")

PROJECT_NAME = "Daily Briefing"

class DigestResponse(BaseModel):
    chat_id: int
    message: str

@router.post("/digest", response_model=DigestResponse)
def create_digest(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Triggers the generation of a daily digest.
    """
    try:
        chat_id = digest_service.generate_daily_digest(db, PROJECT_NAME, background_tasks)
        return DigestResponse(chat_id=chat_id, message="Digest generated successfully")
    except Exception as e:
        # In a real app we might want to log this properly
        raise HTTPException(status_code=500, detail=f"Failed to generate digest: {str(e)}")

@router.get("/digest/history", response_model=List[schemas.Chat])
def get_digest_history(db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.name == PROJECT_NAME).first()
    if not project:
        return []
    chats = db.query(models.Chat).filter(models.Chat.project_id == project.id).order_by(models.Chat.created_at.desc()).limit(30).all()
    return chats

class WeatherResponse(BaseModel):
    summary: str

@router.get("/weather", response_model=WeatherResponse)
def get_weather():
    return {"summary": weather_service.get_forecast()}

# --- Todo Endpoints ---

class TodoItem(BaseModel):
    id: Optional[str] = None
    text: str
    completed: bool = False

class TodoCreate(BaseModel):
    text: str

class TodoUpdate(BaseModel):
    text: Optional[str] = None
    completed: Optional[bool] = None

@router.get("/todos", response_model=List[TodoItem])
def get_todos():
    return todo_storage.get_all()

@router.post("/todos", response_model=TodoItem)
def add_todo(todo: TodoCreate):
    return todo_storage.add_item({"text": todo.text, "completed": False})

@router.patch("/todos/{todo_id}", response_model=TodoItem)
def update_todo(todo_id: str, update: TodoUpdate):
    updated = todo_storage.update_item(todo_id, update.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Todo not found")
    return updated

@router.delete("/todos/{todo_id}")
def delete_todo(todo_id: str):
    if todo_storage.delete_item(todo_id):
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Todo not found")

# --- Calendar Endpoints ---

class CalendarEvent(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = ""
    start: str
    end: str
    color: Optional[str] = "#3b82f6"

@router.get("/calendar", response_model=List[CalendarEvent])
def get_events():
    return calendar_storage.get_all()

@router.post("/calendar", response_model=CalendarEvent)
def add_event(event: CalendarEvent):
    data = event.dict()
    if 'id' in data: del data['id']
    return calendar_storage.add_item(data)

@router.patch("/calendar/{event_id}", response_model=CalendarEvent)
def update_event(event_id: str, event: CalendarEvent):
    updated = calendar_storage.update_item(event_id, event.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated

@router.delete("/calendar/{event_id}")
def delete_event(event_id: str):
    if calendar_storage.delete_item(event_id):
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Event not found")
