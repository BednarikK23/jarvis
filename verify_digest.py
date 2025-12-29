import sys
import os
import asyncio

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.services.weather_service import WeatherService
from backend.services.finance_service import FinanceService
from backend.services.research_service import ResearchService
from backend.services.digest_service import DigestService

async def test_digest():
    print("Testing Weather Service...")
    weather = WeatherService()
    print(weather.get_forecast())
    print("-" * 20)

    print("Testing Finance Service...")
    finance = FinanceService()
    print(finance.get_market_summary())
    print(finance.get_market_news())
    print("-" * 20)

    print("Testing Research Service...")
    research = ResearchService()
    print(research.get_latest_papers(limit=2))
    print(research.get_tech_blog_updates())
    print("-" * 20)
    
    print("Testing Digest Service...")
    digest = DigestService(finance, research, weather)
    # Since get_digest_data is async now, assuming I kept it async or made it async
    # Let's check the definintion I wrote. I wrote "async def get_digest_data"
    data = await digest.get_digest_data()
    print("Digest Data Length:", len(data))
    print("Sample Data:", data[:200])

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    loop.run_until_complete(test_digest())
