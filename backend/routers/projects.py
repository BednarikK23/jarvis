from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
import os
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)

# Load prompts
PROMPTS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts.json")
try:
    with open(PROMPTS_FILE, "r") as f:
        SYSTEM_PROMPTS = json.load(f)
except Exception as e:
    print(f"Warning: Could not load prompts.json: {e}")
    SYSTEM_PROMPTS = {}

@router.post("/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)) -> models.Project:
    """
    Create a new project.

    Args:
        project (schemas.ProjectCreate): The project creation data.
        db (Session): The database session.

    Returns:
        models.Project: The created project.
    """
    # Default Jarvis Personality from JSON
    if not project.system_prompt:
        default_persona = SYSTEM_PROMPTS.get("default", {})
        project.system_prompt = default_persona.get("system_prompt", "You are a helpful AI assistant.")
    
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)) -> List[models.Project]:
    """
    Retrieve a list of projects.

    Args:
        skip (int): Number of records to skip.
        limit (int): Maximum number of records to return.
        db (Session): The database session.

    Returns:
        List[models.Project]: A list of projects.
    """
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, db: Session = Depends(get_db)) -> models.Project:
    """
    Retrieve a specific project by ID.

    Args:
        project_id (int): The ID of the project to retrieve.
        db (Session): The database session.

    Returns:
        models.Project: The requested project.

    Raises:
        HTTPException: If the project is not found.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    """
    Delete a project and its associated chats.

    Args:
        project_id (int): The ID of the project to delete.
        db (Session): The database session.

    Returns:
        Dict[str, str]: A status message indicating success.

    Raises:
        HTTPException: If the project is not found.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Manually deleting chats to ensure cleanup
    for chat in project.chats:
        db.delete(chat)
        
    db.delete(project)
    db.commit()
    return {"status": "success", "message": "Project deleted"}

@router.put("/{project_id}/prompt")
@router.put("/{project_id}/prompt")
def update_project_prompt(project_id: int, prompt_data: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Update the system prompt for a project.
    Supports partial updates (JSON merge) and text appending.

    Args:
        project_id (int): The ID of the project.
        prompt_data (Dict[str, Any]): Dictionary containing:
            - mode (str, optional): 'replace' (default), 'json_merge', or 'text_append'.
            - content (str, optional): The content to merge or append.
            - system_prompt (str, optional): Legacy key for direct replacement.
        db (Session): The database session.

    Returns:
        Dict[str, Any]: Status and the updated system prompt.

    Raises:
        HTTPException: If project not found or content is invalid.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Logic for update modes
    mode = prompt_data.get("mode", "replace") 
    content = prompt_data.get("content")
    
    if not content:
         # Fallback to old behavior if just 'system_prompt' key was sent
         if "system_prompt" in prompt_data:
             project.system_prompt = prompt_data["system_prompt"]
             db.commit()
             return {"status": "success", "system_prompt": project.system_prompt}
         raise HTTPException(status_code=400, detail="Content required")

    current_prompt_str = project.system_prompt or ""
    
    # Try to parse current prompt as JSON
    try:
        current_prompt_json = json.loads(current_prompt_str)
    except json.JSONDecodeError:
        # If not JSON, treat it as a simple text prompt wrapped in a default structure
        current_prompt_json = {"role": current_prompt_str} if current_prompt_str else {}

    if mode == "json_merge":
        try:
            new_content_json = json.loads(content)
            # Merge: update existing keys with new ones
            current_prompt_json.update(new_content_json)
        except json.JSONDecodeError:
             raise HTTPException(status_code=400, detail="Invalid JSON content for merge")
             
    elif mode == "text_append":
        # Append to a specific key, e.g., 'user_specification'
        existing_spec = current_prompt_json.get("user_specification", "")
        if existing_spec:
            existing_spec += "\n\n" + content
        else:
            existing_spec = content
        current_prompt_json["user_specification"] = existing_spec
        
    # Save back as JSON string
    project.system_prompt = json.dumps(current_prompt_json)
    db.commit()
    
    return {"status": "success", "system_prompt": project.system_prompt}
