from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
import datetime
import models
from prompts import FINANCIAL_REPORT_PROMPT, TECH_REPORT_PROMPT, DIGEST_LLM_MODEL
from services.chat_service import chat_service
from services.rag_service import rag_service

class DigestService:
    def __init__(self, finance_service=None, research_service=None, weather_service=None):
        self.finance_service = finance_service
        self.research_service = research_service
        self.weather_service = weather_service

    async def get_digest_data(self) -> str:
        # Legacy support if needed, but we are switching to structured
        return "Please use get_digest_data_structured"

    def get_digest_data_structured(self) -> dict:
        """
        Aggregates data and returns a structured dictionary.
        """
        # 1. Gather Data (Sync calls)
        finance_summary = self.finance_service.get_market_summary()
        finance_news = self.finance_service.get_market_news()
        # This now downloads PDFs too
        research_papers = self.research_service.get_latest_papers_structured()
        tech_blogs = self.research_service.get_tech_blog_updates()
        
        return {
            "finance": {
                "summary": finance_summary,
                "news": finance_news
            },
            "tech": {
                "papers": research_papers,
                "blogs": tech_blogs
            }
        }

    def generate_daily_digest(self, db: Session, project_name: str, background_tasks: BackgroundTasks) -> int:
        """
        Orchestrates the full digest generation flow.
        Returns the ID of the created chat.
        """
        # 1. Get or Create Project
        project = db.query(models.Project).filter(models.Project.name == project_name).first()
        if not project:
            project = models.Project(name=project_name, system_prompt="You are a helpful assistant generating daily digests.")
            db.add(project)
            db.commit()
            db.refresh(project)
        
        # 2. Fetch Data
        data = self.get_digest_data_structured()
        
        # 3. Create Chat
        date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        chat_title = f"Digest: {date_str}"
        
        chat = models.Chat(project_id=project.id, title=chat_title)
        db.add(chat)
        db.commit()
        db.refresh(chat)
        
        # 4. Generate Content via Ollama
        model = DIGEST_LLM_MODEL
        
        # --- Financial Part ---
        fin_prompt = FINANCIAL_REPORT_PROMPT.format(
            finance_summary=data['finance']['summary'],
            finance_news=data['finance']['news']
        )
        fin_response = ""
        try:
            for chunk in chat_service.ollama_client.chat(model=model, messages=[{"role": "user", "content": fin_prompt}], stream=True):
                fin_response += chunk
        except Exception as e:
            fin_response = f"Error generating financial report: {e}"

        # --- Tech Part ---
        papers_text = "\n".join([f"- Title: {p['title']}\n  Abstract: {p['abstract']}\n" for p in data['tech']['papers']])
        tech_prompt = TECH_REPORT_PROMPT.format(
            papers_text=papers_text,
            tech_blogs=data['tech']['blogs']
        )
        tech_response = ""
        try:
            for chunk in chat_service.ollama_client.chat(model=model, messages=[{"role": "user", "content": tech_prompt}], stream=True):
                tech_response += chunk
        except Exception as e:
            tech_response = f"Error generating tech report: {e}"

        # 5. Combine and Save
        full_content = f"# Daily Digest\n\n## 💹 Financial Report\n{fin_response}\n\n## 🤖 Tech Report\n{tech_response}"
        
        msg = models.Message(chat_id=chat.id, role="assistant", content=full_content)
        db.add(msg)
        db.commit()

        # 6. Background RAG Indexing
        for paper in data['tech']['papers']:
            if paper.get('pdf_path') and paper.get('title'):
                 background_tasks.add_task(rag_service.ingest_source, project.id, paper['pdf_path'])

        return chat.id
