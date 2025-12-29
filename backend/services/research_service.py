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

    def get_latest_papers(self, limit: int = 5) -> str:
        """
        Fetches the latest papers from Arxiv in AI/ML.
        Returns a formatted markdown string.
        """
        try:
            client = arxiv.Client()
            search = arxiv.Search(
                query=self.ARXIV_QUERY,
                max_results=limit,
                sort_by=arxiv.SortCriterion.SubmittedDate
            )
            
            results = list(client.results(search))
            
            if not results:
                return "No new papers found."
                
            summary = ["**Latest Arxiv Papers:**"]
            for r in results:
                summary.append(f"- **[{r.title}]({r.entry_id})**")
                # Add a concise summary line? Limit to 200 chars
                abstract = r.summary.replace("\n", " ")
                if len(abstract) > 200:
                    abstract = abstract[:197] + "..."
                summary.append(f"  > *{abstract}*")
            
            return "\n".join(summary)
            
        except Exception as e:
            return f"Error fetching Arxiv papers: {str(e)}"

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
