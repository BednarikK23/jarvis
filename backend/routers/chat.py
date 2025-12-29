from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Generator, Any, Dict
from database import get_db
import models
import schemas
from services.chat_service import chat_service

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"]
)



@router.post("/new", response_model=schemas.Chat)
def create_chat(chat_data: schemas.ChatCreate, db: Session = Depends(get_db)) -> models.Chat:
    """
    Create a new chat session within a project.

    Args:
        chat_data (schemas.ChatCreate): Data required to create a chat.
        db (Session): Database session.

    Returns:
        models.Chat: The created chat object.

    Raises:
        HTTPException: If the associated project is not found.
    """
    # Verify project exists
    project = db.query(models.Project).filter(models.Project.id == chat_data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_chat = models.Chat(project_id=chat_data.project_id, title=chat_data.title)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

@router.get("/history/{project_id}", response_model=List[schemas.Chat])
def get_project_chats(project_id: int, db: Session = Depends(get_db)) -> List[models.Chat]:
    """
    Retrieve all chats associated with a specific project.

    Args:
        project_id (int): ID of the project.
        db (Session): Database session.

    Returns:
        List[models.Chat]: List of chat objects ordered by creation date.
    """
    chats = db.query(models.Chat).filter(models.Chat.project_id == project_id).order_by(models.Chat.created_at.desc()).all()
    return chats

@router.get("/{chat_id}", response_model=schemas.Chat)
def get_chat(chat_id: int, db: Session = Depends(get_db)) -> models.Chat:
    """
    Retrieve a specific chat by its ID.

    Args:
        chat_id (int): ID of the chat.
        db (Session): Database session.

    Returns:
        models.Chat: The requested chat object.

    Raises:
        HTTPException: If the chat is not found.
    """
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@router.delete("/{chat_id}")
def delete_chat(chat_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    """
    Delete a specific chat.

    Args:
        chat_id (int): ID of the chat to delete.
        db (Session): Database session.

    Returns:
        Dict[str, str]: Status message.

    Raises:
        HTTPException: If the chat is not found.
    """
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db.delete(chat)
    db.commit()
    db.delete(chat)
    db.commit()
    return {"status": "success", "message": "Chat deleted"}

@router.put("/{chat_id}", response_model=schemas.Chat)
def update_chat(chat_id: int, chat_update: schemas.ChatCreate, db: Session = Depends(get_db)) -> models.Chat:
    """
    Update a chat's title.
    
    Args:
        chat_id (int): ID of the chat.
        chat_update (schemas.ChatCreate): New data (title).
        db (Session): Database session.
        
    Returns:
        models.Chat: The updated chat.
    """
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat.title = chat_update.title
    db.commit()
    db.refresh(chat)
    return chat

@router.post("/{chat_id}/message")
def send_message(chat_id: int, request: schemas.ChatRequest, db: Session = Depends(get_db)) -> StreamingResponse:
    """
    Send a message to the chat and stream the AI response.

    Args:
        chat_id (int): ID of the chat.
        request (schemas.ChatRequest): Request body containing messages and model.
        db (Session): Database session.

    Returns:
        StreamingResponse: SSE stream of the AI response.

    Raises:
        HTTPException: If chat not found or request is invalid.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    
    last_msg = request.messages[-1]
    if last_msg.role != "user":
         raise HTTPException(status_code=400, detail="Last message must be from user")

    try:
        # Delegate to service
        response_generator = chat_service.process_message(
            db=db,
            chat_id=chat_id,
            message_content=last_msg.content,
            model=request.model
        )
        return StreamingResponse(response_generator, media_type="text/plain")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error in chat processing: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

