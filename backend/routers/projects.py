from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)

import json
import os

# Load prompts
PROMPTS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts.json")
try:
    with open(PROMPTS_FILE, "r") as f:
        SYSTEM_PROMPTS = json.load(f)
except Exception as e:
    print(f"Warning: Could not load prompts.json: {e}")
    SYSTEM_PROMPTS = {}

@router.post("/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
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
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}/prompt")
def update_project_prompt(project_id: int, prompt_data: dict, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.system_prompt = prompt_data.get("system_prompt")
    db.commit()
    return {"status": "success", "system_prompt": project.system_prompt}
