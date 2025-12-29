import yfinance as yf
from typing import List, Dict, Any

class FinanceService:
    """
    Service to fetch financial data and news using yfinance.
    """
    
    # Major indices and assets to track
    TRACKED_TICKERS = {
        "^GSPC": "S&P 500",
        "^IXIC": "NASDAQ",
        "BTC-USD": "Bitcoin",
        "ETH-USD": "Ethereum",
        "EURUSD=X": "EUR/USD"
    }

    def get_market_summary(self) -> str:
        """
        Fetches current price and daily change for tracked assets.
        Returns a formatted markdown string.
        """
        summary_lines = ["**Market Snapshot:**"]
        
        try:
            tickers = list(self.TRACKED_TICKERS.keys())
            data = yf.download(tickers, period="1d", progress=False)
            
            # yfinance structure can be complex with multi-index columns, 
            # let's try a simpler approach iterating one by one if bulk fails or is messy,
            # but yf.Ticker is often safer for immediate data.
            
            for ticker_symbol, name in self.TRACKED_TICKERS.items():
                try:
                    ticker = yf.Ticker(ticker_symbol)
                    # fast_info is often faster and more reliable for real-time-ish data
                    price = ticker.fast_info.last_price
                    prev_close = ticker.fast_info.previous_close
                    
                    if price and prev_close:
                        change = ((price - prev_close) / prev_close) * 100
                        emoji = "🟢" if change >= 0 else "🔴"
                        summary_lines.append(f"- {emoji} **{name}**: {price:,.2f} ({change:+.2f}%)")
                    else:
                        summary_lines.append(f"- **{name}**: N/A")
                except Exception:
                    summary_lines.append(f"- **{name}**: Error")
            
            return "\n".join(summary_lines)
        except Exception as e:
            return f"Error fetching market data: {str(e)}"

    def get_market_news(self) -> str:
        """
        Fetches general market news.
        Returns a summarized string of headlines.
        """
        # We can use a general ticker like SPY or just search to get general market news
        try:
            # S&P 500 is a good proxy for general market news
            ticker = yf.Ticker("^GSPC")
            exclude_keys = ["thumbnail", "resolutions", "providerPublishTime"]
            news_items = ticker.news
            
            if not news_items:
                return "No recent market news found."
                
            summary_lines = ["**Latest Market News:**"]
            # Take top 10 as requested
            count = 0
            for item in news_items:
                if count >= 10:
                    break
                    
                # Handle nested structure (yfinance new format)
                content = item.get("content", {}) if "content" in item else item
                
                title = content.get("title")
                if not title:
                    continue
                    
                # Try to find a link
                link = "#"
                if "clickThroughUrl" in content and content["clickThroughUrl"]:
                    link = content["clickThroughUrl"].get("url", "#")
                elif "canonicalUrl" in content and content["canonicalUrl"]:
                    link = content["canonicalUrl"].get("url", "#")
                elif "link" in content:
                    link = content.get("link", "#")
                    
                summary_lines.append(f"- [{title}]({link})")
                count += 1
                
            return "\n".join(summary_lines)
            
        except Exception as e:
            return f"Error fetching market news: {str(e)}"
