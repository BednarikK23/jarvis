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

@router.post("/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    # Default Jarvis Personality
    if not project.system_prompt:
        project.system_prompt = (
            "You are J.A.R.V.I.S. (Just A Rather Very Intelligent System). "
            "You are a helpful, witty, and precise AI assistant. "
            "Always address the user as 'Sir'. "
            "Keep your responses concise and efficient, just like the original AI from Iron Man."
        )
    
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
