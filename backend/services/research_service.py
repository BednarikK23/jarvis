import arxiv
import feedparser
from typing import List, Dict

class ResearchService:
    """
    Service to fetch research papers and tech blog updates.
    """
    
    # Arxiv Categories: AI, Machine Learning, Computation and Language
    ARXIV_QUERY = "cat:cs.AI OR cat:cs.LG OR cat:cs.CL"
    
    TECH_BLOGS = {
        "OpenAI": "https://openai.com/blog/rss.xml",
        "Google AI": "https://blog.google/technology/ai/rss/",
        # Meta AI often doesn't have a direct clean RSS, but we can try engineering.fb.com
        "Meta Engineering": "https://engineering.fb.com/category/ai-research/feed/",
        "Hugging Face": "https://huggingface.co/blog/feed.xml"
    }

    def download_paper(self, paper_id: str, pdf_url: str) -> str:
        """
        Downloads a paper's PDF to local storage.
        Returns absolute path to the file.
        """
        import requests
        import os
        
        # Clean ID for filename
        safe_id = paper_id.replace("http://arxiv.org/abs/", "").replace("/", "_")
        filename = f"{safe_id}.pdf"
        
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data/papers")
        if not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)
            
        file_path = os.path.join(data_dir, filename)
        
        if os.path.exists(file_path):
            return file_path
            
        try:
            response = requests.get(pdf_url)
            response.raise_for_status()
            with open(file_path, "wb") as f:
                f.write(response.content)
            return file_path
        except Exception as e:
            print(f"Error downloading PDF {pdf_url}: {e}")
            return None

    def get_latest_papers_structured(self, limit: int = 5) -> List[Dict]:
        """
        Fetches papers and returns structured data including local path.
        """
        try:
            client = arxiv.Client()
            search = arxiv.Search(
                query=self.ARXIV_QUERY,
                max_results=limit,
                sort_by=arxiv.SortCriterion.SubmittedDate
            )
            
            results = list(client.results(search))
            papers = []
            
            for r in results:
                # Download PDF immediately
                # Note: pdf_url is usually r.pdf_url
                pdf_path = self.download_paper(r.entry_id, r.pdf_url)
                
                paper = {
                    "title": r.title,
                    "url": r.entry_id,
                    "abstract": r.summary,
                    "pdf_path": pdf_path,
                    "authors": [a.name for a in r.authors]
                }
                papers.append(paper)
            
            return papers
            
        except Exception as e:
            print(f"Error fetching Arxiv papers: {e}")
            return []

    def get_latest_papers(self, limit: int = 5) -> str:
        # Backward compatibility or just use structured
        # For now let's keep it but maybe unused
        papers = self.get_latest_papers_structured(limit)
        if not papers: return "No new papers found."
        
        summary = ["**Latest Arxiv Papers:**"]
        for p in papers:
            summary.append(f"- **[{p['title']}]({p['url']})**")
            abstract = p['abstract'].replace("\n", " ")
            if len(abstract) > 200:
                abstract = abstract[:197] + "..."
            summary.append(f"  > *{abstract}*")
        return "\n".join(summary)

    def get_tech_blog_updates(self) -> str:
        """
        Fetches the latest post from each tracked tech blog.
        """
        summary = ["**Tech Blog Updates:**"]
        
        for name, rss_url in self.TECH_BLOGS.items():
            try:
                feed = feedparser.parse(rss_url)
                if feed.entries:
                    # Get the latest entry
                    entry = feed.entries[0]
                    title = entry.title
                    link = entry.link
                    summary.append(f"- **{name}:** [{title}]({link})")
                else:
                    summary.append(f"- **{name}:** No recent updates.")
            except Exception:
                summary.append(f"- **{name}:** Error fetching feed.")
                
        return "\n".join(summary)
