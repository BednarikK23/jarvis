from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from datetime import datetime
from services.rag_service import rag_service

router = APIRouter(
    prefix="/api/projects",
    tags=["knowledge"]
)

def ingest_background(project_id: int, source_id: int, path: str, db: Session):
    # This runs in background
    # 1. Update status to indexing
    # We need a new session for background task if we want to be safe, 
    # but here we might just rely on the service updating status if we passed DB.
    # Actually rag_service is independent of SQL DB (uses Chroma).
    # We update SQL DB status here.
    
    # Re-create session since the request session is closed
    from database import SessionLocal
    local_db = SessionLocal()
    try:
        source = local_db.query(models.KnowledgeSource).filter(models.KnowledgeSource.id == source_id).first()
        if source:
            source.status = "indexing"
            local_db.commit()
            
            # 2. Run Ingestion
            rag_service.ingest_source(project_id, path)
            
            # 3. Update status to indexed
            source.status = "indexed"
            source.last_indexed = datetime.utcnow()
            local_db.commit()
    except Exception as e:
        print(f"Ingestion error: {e}")
        if source:
            source.status = "error"
            local_db.commit()
    finally:
        local_db.close()

@router.post("/{project_id}/sources", response_model=schemas.KnowledgeSource)
def add_knowledge_source(
    project_id: int, 
    source_data: schemas.KnowledgeSourceCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check if path already exists for this project
    existing = db.query(models.KnowledgeSource).filter(
        models.KnowledgeSource.project_id == project_id,
        models.KnowledgeSource.path == source_data.path
    ).first()
    if existing:
        return existing

    new_source = models.KnowledgeSource(
        project_id=project_id,
        path=source_data.path,
        status="pending"
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)

    # Trigger background ingestion
    background_tasks.add_task(ingest_background, project_id, new_source.id, new_source.path, db)

    return new_source

@router.get("/{project_id}/sources", response_model=List[schemas.KnowledgeSource])
def get_knowledge_sources(project_id: int, db: Session = Depends(get_db)):
    # Verify project exists
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return db.query(models.KnowledgeSource).filter(models.KnowledgeSource.project_id == project_id).all()

@router.delete("/{project_id}/sources/{source_id}")
def delete_knowledge_source(project_id: int, source_id: int, db: Session = Depends(get_db)):
    source = db.query(models.KnowledgeSource).filter(
        models.KnowledgeSource.id == source_id,
        models.KnowledgeSource.project_id == project_id
    ).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
        
    db.delete(source)
    db.commit()
    
    # We might want to clear from Chroma too, but Chroma deletes by Collection usually.
    # rag_service doesn't have delete_source yet, and deleting single docs is harder if we don't track IDs perfectly.
    # For now, we accept that the embeddings might stay until project is deleted or re-indexed.
    # A full re-sync feature could be added later.
    
    return {"status": "success"}
