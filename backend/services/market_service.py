import yfinance as yf
import pandas as pd
import datetime
import traceback
from typing import List, Dict, Any

class MarketService:
    def __init__(self):
        # Cache standard index tickers
        self.indices = {
            "SPY": "S&P 500 ETF",
            "QQQ": "Nasdaq 100 ETF",
            "DIA": "Dow Jones ETF",
            "IWM": "Russell 2000 ETF"
        }
        # Predefined mock stocks for fallback
        self.mock_stocks = {
            "AAPL": {"name": "Apple Inc.", "price": 182.50, "change": 1.25, "percent": 0.69, "sector": "Technology", "volume": "52M"},
            "MSFT": {"name": "Microsoft Corp.", "price": 415.60, "change": -2.40, "percent": -0.57, "sector": "Technology", "volume": "22M"},
            "TSLA": {"name": "Tesla Inc.", "price": 175.40, "change": 8.50, "percent": 5.09, "sector": "Automotive", "volume": "88M"},
            "AMZN": {"name": "Amazon.com Inc.", "price": 178.15, "change": 0.45, "percent": 0.25, "sector": "Consumer Cyclical", "volume": "35M"},
            "NVDA": {"name": "NVIDIA Corp.", "price": 875.12, "change": 15.30, "percent": 1.78, "sector": "Technology", "volume": "41M"},
            "GOOGL": {"name": "Alphabet Inc.", "price": 151.60, "change": -0.80, "percent": -0.52, "sector": "Technology", "volume": "27M"},
            "META": {"name": "Meta Platforms", "price": 505.30, "change": 4.10, "percent": 0.82, "sector": "Technology", "volume": "18M"},
            "NFLX": {"name": "Netflix Inc.", "price": 610.50, "change": -12.10, "percent": -1.94, "sector": "Communication Services", "volume": "5M"}
        }

    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        symbol = symbol.upper().strip()
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # yfinance returns empty info dict or throws error if symbol invalid
            if not info or "regularMarketPrice" not in info and "currentPrice" not in info:
                # Try fallback
                if symbol in self.mock_stocks:
                    return self._get_mock_info(symbol)
                raise ValueError("Symbol not found or yfinance rate limit")

            price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("navPrice") or 0.0
            prev_close = info.get("regularMarketPreviousClose") or price
            change = price - prev_close
            change_percent = (change / prev_close) * 100 if prev_close else 0.0

            return {
                "symbol": symbol,
                "name": info.get("longName") or info.get("shortName") or symbol,
                "price": round(float(price), 2),
                "change": round(float(change), 2),
                "change_percent": round(float(change_percent), 2),
                "sector": info.get("sector") or "Unknown",
                "industry": info.get("industry") or "Unknown",
                "market_cap": info.get("marketCap") or 0,
                "volume": info.get("volume") or 0,
                "pe_ratio": info.get("trailingPE") or None,
                "day_high": info.get("dayHigh") or price,
                "day_low": info.get("dayLow") or price,
                "summary": info.get("longBusinessSummary") or f"{symbol} stock detail analysis and market metrics.",
                "is_mock": False
            }
        except Exception as e:
            print(f"Error fetching info for {symbol}: {e}")
            return self._get_mock_info(symbol)

    def get_stock_history(self, symbol: str, period: str = "1mo") -> List[Dict[str, Any]]:
        symbol = symbol.upper().strip()
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            if hist.empty:
                return self._get_mock_history(symbol, period)
            
            records = []
            for date, row in hist.iterrows():
                records.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"])
                })
            return records
        except Exception as e:
            print(f"Error fetching history for {symbol}: {e}")
            return self._get_mock_history(symbol, period)

    def get_stock_news(self, symbol: str) -> List[Dict[str, Any]]:
        symbol = symbol.upper().strip()
        try:
            ticker = yf.Ticker(symbol)
            yf_news = ticker.news
            if not yf_news:
                return self._get_mock_news(symbol)
            
            news_items = []
            for item in yf_news[:10]:
                published_epoch = item.get("providerPublishTime")
                published_dt = datetime.datetime.fromtimestamp(published_epoch) if published_epoch else datetime.datetime.utcnow()
                
                news_items.append({
                    "title": item.get("title", ""),
                    "summary": item.get("summary") or f"Market activity report regarding {symbol}.",
                    "url": item.get("link", ""),
                    "publisher": item.get("publisher", "Yahoo Finance"),
                    "published_at": published_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "stock_symbol": symbol
                })
            return news_items
        except Exception as e:
            print(f"Error fetching news for {symbol}: {e}")
            return self._get_mock_news(symbol)

    def get_market_overview(self) -> Dict[str, Any]:
        indices_data = []
        for symbol, name in self.indices.items():
            try:
                # yfinance indices usually start with ^, e.g. ^GSPC for S&P 500, ^IXIC for Nasdaq
                # Let's map SPY -> ^GSPC, QQQ -> ^IXIC, DIA -> ^DJI for index mapping
                mapped_symbol = symbol
                if symbol == "SPY": mapped_symbol = "^GSPC"
                elif symbol == "QQQ": mapped_symbol = "^IXIC"
                elif symbol == "DIA": mapped_symbol = "^DJI"
                
                ticker = yf.Ticker(mapped_symbol)
                info = ticker.history(period="2d")
                if len(info) >= 2:
                    price = info["Close"].iloc[-1]
                    prev_close = info["Close"].iloc[-2]
                else:
                    # Fallback to currentPrice if history is empty
                    price = ticker.info.get("regularMarketPrice") or ticker.info.get("currentPrice") or 100.0
                    prev_close = ticker.info.get("regularMarketPreviousClose") or price
                
                change = price - prev_close
                change_percent = (change / prev_close) * 100 if prev_close else 0.0

                indices_data.append({
                    "symbol": symbol,
                    "name": name,
                    "price": round(float(price), 2),
                    "change": round(float(change), 2),
                    "change_percent": round(float(change_percent), 2)
                })
            except Exception as e:
                print(f"Index error {symbol}: {e}")
                # Mock indices
                mock_vals = {"SPY": 5460.30, "QQQ": 19780.20, "DIA": 39110.50, "IWM": 202.10}
                mock_chg = {"SPY": (25.10, 0.46), "QQQ": (-120.40, -0.61), "DIA": (180.20, 0.46), "IWM": (1.15, 0.57)}
                indices_data.append({
                    "symbol": symbol,
                    "name": name,
                    "price": mock_vals.get(symbol, 100.0),
                    "change": mock_chg.get(symbol, (0.0, 0.0))[0],
                    "change_percent": mock_chg.get(symbol, (0.0, 0.0))[1]
                })

        # Gainers, Losers, Trending (Mixed dynamic + mock fallback)
        gainers = []
        losers = []
        trending = []
        
        for sym, d in self.mock_stocks.items():
            info = self.get_stock_info(sym)
            item = {
                "symbol": sym,
                "name": info["name"],
                "price": info["price"],
                "change": info["change"],
                "change_percent": info["change_percent"],
                "sector": info["sector"]
            }
            trending.append(item)
            if info["change_percent"] > 0:
                gainers.append(item)
            else:
                losers.append(item)
                
        # Sort collections
        gainers = sorted(gainers, key=lambda x: x["change_percent"], reverse=True)[:4]
        losers = sorted(losers, key=lambda x: x["change_percent"])[:4]
        trending = trending[:6]

        # General market news
        market_news = self.get_news_feed()

        # Mood meter & Fear and Greed Index calculated dynamically based on index changes
        # S&P 500 change controls Fear/Greed. (e.g. S&P bullish = greed, bearish = fear)
        spy_change = next((x["change_percent"] for x in indices_data if x["symbol"] == "SPY"), 0.0)
        mood_value = min(max(50 + int(spy_change * 15), 10), 90) # default fear/greed scale (10 to 90)
        
        return {
            "indices": indices_data,
            "top_gainers": gainers,
            "top_losers": losers,
            "trending": trending,
            "market_news": market_news,
            "mood_value": mood_value,
            "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }

    def get_news_feed(self) -> List[Dict[str, Any]]:
        # Fetch generic market news (using standard SPY ticker news)
        try:
            ticker = yf.Ticker("SPY")
            yf_news = ticker.news
            if not yf_news:
                return self._get_mock_news("MARKET")
            
            news_items = []
            for item in yf_news[:8]:
                published_epoch = item.get("providerPublishTime")
                published_dt = datetime.datetime.fromtimestamp(published_epoch) if published_epoch else datetime.datetime.utcnow()
                news_items.append({
                    "title": item.get("title", ""),
                    "summary": item.get("summary") or "Finance news update reporting market movements and economic statistics.",
                    "url": item.get("link", ""),
                    "publisher": item.get("publisher", "Yahoo Finance"),
                    "published_at": published_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                })
            return news_items
        except Exception:
            return self._get_mock_news("MARKET")

    def _get_mock_info(self, symbol: str) -> Dict[str, Any]:
        mock = self.mock_stocks.get(symbol, {"name": f"{symbol} Corp.", "price": 100.0, "change": 0.0, "percent": 0.0, "sector": "Finance", "volume": "10M"})
        return {
            "symbol": symbol,
            "name": mock["name"],
            "price": mock["price"],
            "change": mock["change"],
            "change_percent": mock["percent"],
            "sector": mock["sector"],
            "industry": "Global Markets",
            "market_cap": 1500000000,
            "volume": 5000000,
            "pe_ratio": 22.5,
            "day_high": mock["price"] + 2.0,
            "day_low": mock["price"] - 2.0,
            "summary": f"{mock['name']} is a leading player in the {mock['sector']} sector. This is simulated mock data to guarantee responsiveness.",
            "is_mock": True
        }

    def _get_mock_history(self, symbol: str, period: str) -> List[Dict[str, Any]]:
        mock = self.mock_stocks.get(symbol, {"price": 100.0})
        base_price = mock["price"]
        days = 30 if period == "1mo" else 7 if period == "5d" else 90
        
        import random
        random.seed(hash(symbol) % 1000)
        
        history = []
        curr_price = base_price - (days * 0.5)  # Make it trend upwards generally
        
        for i in range(days):
            date_str = (datetime.date.today() - datetime.timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
            change = random.uniform(-3.0, 3.5)
            open_p = curr_price
            close_p = open_p + change
            high_p = max(open_p, close_p) + random.uniform(0.1, 1.5)
            low_p = min(open_p, close_p) - random.uniform(0.1, 1.5)
            
            history.append({
                "date": date_str,
                "open": round(open_p, 2),
                "high": round(high_p, 2),
                "low": round(low_p, 2),
                "close": round(close_p, 2),
                "volume": random.randint(100000, 5000000)
            })
            curr_price = close_p
            
        return history

    def _get_mock_news(self, symbol: str) -> List[Dict[str, Any]]:
        is_market = symbol == "MARKET"
        pub_date = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        
        if is_market:
            return [
                {
                    "title": "Fed Signals High Interest Rates Could Stay Longer to Control Inflation",
                    "summary": "Federal Reserve officials indicated that interest rates might remain elevated for a prolonged period, citing stubborn inflation statistics.",
                    "url": "https://finance.yahoo.com/news/fed-signals-rates-120000.html",
                    "publisher": "Wall Street Journal",
                    "published_at": pub_date
                },
                {
                    "title": "Tech Stocks Rally as Semiconductor Demand Surge Continues",
                    "summary": "Nvidia and other microchip developers lead Nasdaq higher on strong guidance and corporate cloud spending forecasts.",
                    "url": "https://finance.yahoo.com/news/tech-stocks-rally-150000.html",
                    "publisher": "Reuters",
                    "published_at": pub_date
                },
                {
                    "title": "Oil Prices Stabilize Amid OPEC+ Production Restraints and Geopolitical Risks",
                    "summary": "Crude futures trade steady as energy markets digest extension of output cuts and ongoing shipping vulnerabilities.",
                    "url": "https://finance.yahoo.com/news/oil-prices-stabilize-160000.html",
                    "publisher": "Bloomberg",
                    "published_at": pub_date
                }
            ]
        else:
            return [
                {
                    "title": f"Analyzing {symbol}'s Market Position and Strategic Tailwinds",
                    "summary": f"Analysts examine {symbol}'s recent earnings results, product expansion announcements, and overall positioning relative to industry competitors.",
                    "url": f"https://finance.yahoo.com/news/{symbol.lower()}-analysis-110000.html",
                    "publisher": "MarketWatch",
                    "published_at": pub_date,
                    "stock_symbol": symbol
                },
                {
                    "title": f"Why Investors Are Bullish on {symbol} Moving Into Next Quarter",
                    "summary": f"Strong balance sheets, robust profit margins, and favorable secular industry growth support a bullish narrative for {symbol}.",
                    "url": f"https://finance.yahoo.com/news/{symbol.lower()}-bullish-case-130000.html",
                    "publisher": "InvestorPlace",
                    "published_at": pub_date,
                    "stock_symbol": symbol
                }
            ]

market_service = MarketService()
