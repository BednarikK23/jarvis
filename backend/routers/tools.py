from fastapi import APIRouter, HTTPException, Depends
from typing import List
import schemas
from services.todo_service import TodoService
from services.calendar_service import CalendarService

router = APIRouter(
    prefix="/api/tools",
    tags=["tools"]
)

# Services
todo_service = TodoService()
calendar_service = CalendarService()

# --- TODO Endpoints ---

@router.get("/todos", response_model=List[schemas.TodoItem])
async def get_todos():
    return todo_service.get_todos()

@router.post("/todos", response_model=schemas.TodoItem)
async def create_todo(todo: schemas.TodoCreate):
    return todo_service.add_todo(todo.text)

@router.patch("/todos/{todo_id}", response_model=schemas.TodoItem)
async def update_todo(todo_id: str, updates: schemas.TodoUpdate):
    updated = todo_service.update_todo(todo_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Todo not found")
    return updated

@router.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str):
    success = todo_service.delete_todo(todo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"status": "success"}

# --- Calendar Endpoints ---

@router.get("/calendar", response_model=List[schemas.CalendarEvent])
async def get_calendar_events():
    return calendar_service.get_events()

@router.post("/calendar", response_model=schemas.CalendarEvent)
async def create_calendar_event(event: schemas.CalendarEventCreate):
    return calendar_service.add_event(event)

@router.patch("/calendar/{event_id}", response_model=schemas.CalendarEvent)
async def update_calendar_event(event_id: str, updates: schemas.CalendarEventUpdate):
    updated = calendar_service.update_event(event_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated

@router.delete("/calendar/{event_id}")
async def delete_calendar_event(event_id: str):
    success = calendar_service.delete_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "success"}
