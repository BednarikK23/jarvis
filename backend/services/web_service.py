import logging
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional

# Setup logging
logger = logging.getLogger(__name__)

# Safe imports for search libraries
try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None
    logger.error("duckduckgo-search not installed")

try:
    from googlesearch import search as google_search
except ImportError:
    google_search = None
    logger.error("googlesearch-python not installed")

class WebService:
    def __init__(self):
        self.ddgs = DDGS() if DDGS else None
        # Mock user agent
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def search_web(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """
        Search the web using:
        1. DuckDuckGo
        2. Google (Fallback)
        3. Wikipedia (Final Fallback)
        """
        results = []
        
        # 1. Try DuckDuckGo
        if self.ddgs:
            try:
                logger.info(f"Searching DuckDuckGo for: {query}")
                results = list(self.ddgs.text(query, max_results=max_results))
                if results:
                    return results
            except Exception as e:
                logger.warning(f"DuckDuckGo search failed: {e}")
        
        # 2. Fallback to Google
        if google_search:
            try:
                logger.info(f"Fallback to Google Search for: {query}")
                # googlesearch-python returns just URLs by default in simple mode,
                # but using advanced=True returns objects with title/description
                g_results = google_search(query, num_results=max_results, advanced=True)
                for res in g_results:
                    results.append({
                        "title": res.title,
                        "href": res.url,
                        "body": res.description
                    })
                if results:
                    return results
            except Exception as e:
                logger.error(f"Google search failed: {e}")
        
        # 3. Fallback to Wikipedia
        try:
            logger.info(f"Fallback to Wikipedia for: {query}")
            wiki_results = self._search_wikipedia(query, limit=max_results)
            if wiki_results:
                return wiki_results
        except Exception as e:
            logger.error(f"Wikipedia search failed: {e}")
            
        return results

    def _search_wikipedia(self, query: str, limit: int = 3) -> List[Dict[str, str]]:
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query,
            "srlimit": limit
        }
        try:
            resp = requests.get(url, params=params, headers=self.headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get('query', {}).get('search', [])
                return [{
                    "title": item['title'],
                    "href": f"https://en.wikipedia.org/wiki/{item['title'].replace(' ', '_')}",
                    "body": BeautifulSoup(item['snippet'], 'html.parser').get_text()
                } for item in items]
        except Exception as e:
            logger.error(f"Wiki API error: {e}")
            
        return []

    def scrape_url(self, url: str) -> Optional[str]:
        """
        Scrape text content from a URL.
        Returns cleaned text or None if failed.
        """
        try:
            logger.info(f"Scraping URL: {url}")
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
                
            # Get text
            text = soup.get_text()
            
            # Break into lines and remove leading/trailing space on each
            lines = (line.strip() for line in text.splitlines())
            # Break multi-headlines into a line each
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            # Drop blank lines
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            # Cap length to avoid context overflow (approx 2000 words or 10k chars)
            if len(text) > 10000:
                text = text[:10000] + "\n...[Content Truncated]..."
                
            return text
            
        except Exception as e:
            logger.error(f"Error scraping URL {url}: {e}")
            return None

web_service = WebService()
