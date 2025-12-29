from datetime import datetime
from services.finance_service import FinanceService
from services.research_service import ResearchService
from services.weather_service import WeatherService
from services.rag_service import RAGService  # Reusing LLM capability via RAGService or similar
# Actually, I need a service that just exposes the LLM. 
# Looking at the file list, there is no generic LLMService, but RAGService likely has it.
# Let's check main.py or rag_service.py to see how to access the LLM.
# I'll pause to check accessing LLM, but I'll write the skeleton first.

class DigestService:
    def __init__(self, finance_service: FinanceService, research_service: ResearchService, weather_service: WeatherService):
        self.finance_service = finance_service
        self.research_service = research_service
        self.weather_service = weather_service
        # Ideally we inject an LLM provider here.

    async def get_digest_data(self) -> str:
        """
        Aggregates data and returns a formatted string with the raw info.
        """
        # 1. Gather Data
        # We can run these in parallel if we were async, but the services are synchronous requests for now.
        # Ideally we'd make them async, but for MVP synchronous is fine (just a few seconds).
        weather_summary = self.weather_service.get_forecast()
        finance_summary = self.finance_service.get_market_summary()
        finance_news = self.finance_service.get_market_news()
        research_papers = self.research_service.get_latest_papers()
        tech_blogs = self.research_service.get_tech_blog_updates()
        
        raw_data = f"""
### 📊 Financial Snapshot
{finance_summary}

### 📰 Market News
{finance_news}

### 🔬 Research Papers (Arxiv)
{research_papers}

### 📝 Tech Blog Updates
{tech_blogs}

### 🌤️ Weather Forecast
{weather_summary}
        """
        return raw_data
