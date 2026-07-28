import json
import re
from openai import OpenAI
from typing import List, Dict, Any
from backend.config import settings

class AIService:
    def __init__(self):
        self.is_mocked = settings.is_ai_mocked
        self.model_name = "mistralai/Mistral-7B-Instruct-v0.2" # Default non-gated model
        self.client = None
        
        if not self.is_mocked:
            try:
                self.client = OpenAI(
                    base_url="https://api.featherless.ai/v1",
                    api_key=settings.FEATHERLESS_API_KEY
                )
                print("Featherless AI API Client Initialized.")
            except Exception as e:
                print(f"Error configuring Featherless API. Falling back to Mock: {e}")
                self.is_mocked = True
        else:
            print("Featherless API key not found. Starting in Mock AI Mode.")

    def analyze_news_sentiment(self, title: str, summary: str) -> Dict[str, Any]:
        """Analyzes sentiment and confidence score of a news article."""
        if self.is_mocked:
            return self._mock_news_sentiment(title)

        prompt = f"""
        Analyze the market sentiment of the following financial news article:
        Title: {title}
        Summary: {summary}

        Return your answer as a JSON object with exactly three keys:
        - "sentiment": either "Bullish", "Bearish", or "Neutral"
        - "confidence": a number between 0 and 100 representing your confidence percentage
        - "explanation": a 1-2 sentence explanation of your decision.

        Respond with ONLY the JSON object, no Markdown blocks or explanations.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            clean_json = self._extract_json(response.choices[0].message.content)
            if clean_json:
                return clean_json
        except Exception as e:
            print(f"Featherless AI news sentiment error: {e}")
        
        return self._mock_news_sentiment(title)

    def generate_copilot_chat(self, question: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """Generates comprehensive copilot responses with structured fields like risks, sentiment, and charts."""
        ticker = self._detect_ticker(question)
        
        if self.is_mocked:
            return self._mock_copilot_chat(question, ticker)

        history_context = ""
        if history:
            history_context = "\n".join([f"{h['role']}: {h['content']}" for h in history[-5:]])

        prompt = f"""
        You are DUODO AI Copilot, a premium financial sentiment analyst.
        Answer the following user question using your financial intelligence:
        Question: {question}
        
        Recent chat history for context (if any):
        {history_context}

        Provide a structured response. Return a JSON object with the following fields:
        1. "summary": The main conversational answer to the question (3-5 sentences, highly detailed).
        2. "sentiment": "Bullish", "Bearish", or "Neutral" regarding the asset or sector discussed.
        3. "confidence": A confidence score between 0 and 100.
        4. "supporting_news": A list of 2-3 mock/historical headlines supporting this sentiment (each with "title", "publisher", "url").
        5. "risks": A list of 2-3 key potential risks associated with the asset/market.
        6. "related_stocks": A list of 2-3 related stock symbols (e.g. ["AAPL", "MSFT"]).
        7. "sources": A list of 2-3 sources of information (e.g. ["Bloomberg", "S&P Global"]).

        Respond with ONLY the raw JSON, no markdown wrapper codeblocks.
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            clean_json = self._extract_json(response.choices[0].message.content)
            if clean_json:
                return clean_json
        except Exception as e:
            print(f"Featherless AI copilot chat error: {e}")

        return self._mock_copilot_chat(question, ticker)

    def analyze_portfolio_sentiment(self, holdings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyzes portfolio holdings to calculate overall portfolio sentiment and risk score."""
        if not holdings:
            return {
                "sentiment": "Neutral",
                "portfolio_sentiment_score": 50.0,
                "risk_score": 30.0,
                "recommendation": "Add assets to begin portfolio sentiment tracking.",
                "diversification_status": "No assets"
            }

        if self.is_mocked:
            return self._mock_portfolio_analysis(holdings)

        holdings_str = ", ".join([f"{h['stock_symbol']}: Qty {h['quantity']} @ ${h['avg_price']}" for h in holdings])

        prompt = f"""
        Analyze the following stock portfolio holdings:
        {holdings_str}

        Evaluate the portfolio and return a JSON object with:
        - "sentiment": "Bullish", "Bearish", or "Neutral"
        - "portfolio_sentiment_score": overall sentiment score between 0 (highly bearish) and 100 (highly bullish)
        - "risk_score": overall risk score between 0 (very safe) and 100 (extremely risky)
        - "recommendation": A 2-sentence optimization/hedging recommendation
        - "diversification_status": E.g. "Good diversification", "Tech heavy", etc.

        Return ONLY the JSON object.
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            clean_json = self._extract_json(response.choices[0].message.content)
            if clean_json:
                return clean_json
        except Exception as e:
            print(f"Featherless AI portfolio sentiment error: {e}")

        return self._mock_portfolio_analysis(holdings)

    # --- Utility Methods ---
    def _extract_json(self, text: str) -> Dict[str, Any]:
        try:
            text_cleaned = re.sub(r"^```json\s*", "", text, flags=re.MULTILINE)
            text_cleaned = re.sub(r"\s*```$", "", text_cleaned, flags=re.MULTILINE)
            text_cleaned = text_cleaned.strip()
            # Try to find JSON object bounds if there's text before/after
            start = text_cleaned.find('{')
            end = text_cleaned.rfind('}')
            if start != -1 and end != -1:
                text_cleaned = text_cleaned[start:end+1]
            return json.loads(text_cleaned)
        except Exception as e:
            print(f"Failed to parse JSON from AI response: {e}. Raw text: {text}")
            return None

    def _detect_ticker(self, question: str) -> str:
        question = question.upper()
        tickers = ["AAPL", "TSLA", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "NFLX"]
        for t in tickers:
            if t in question or t.lower() in question.lower():
                return t
        
        if "APPLE" in question: return "AAPL"
        if "TESLA" in question: return "TSLA"
        if "MICROSOFT" in question: return "MSFT"
        if "NVIDIA" in question: return "NVDA"
        if "AMAZON" in question: return "AMZN"
        if "GOOGLE" in question or "ALPHABET" in question: return "GOOGL"
        if "META" in question or "FACEBOOK" in question: return "META"
        if "NETFLIX" in question: return "NFLX"
        return "MARKET"

    # --- Mocks ---
    def _mock_news_sentiment(self, title: str) -> Dict[str, Any]:
        title_lower = title.lower()
        sentiment = "Neutral"
        confidence = 50.0
        
        bullish_words = ["rise", "rally", "gain", "bull", "surge", "growth", "positive", "exceeds", "beat", "higher", "record"]
        bearish_words = ["fall", "drop", "lose", "bear", "plunge", "decline", "negative", "miss", "lower", "inflation", "debt", "selloff"]
        
        bull_count = sum(1 for w in bullish_words if w in title_lower)
        bear_count = sum(1 for w in bearish_words if w in title_lower)
        
        if bull_count > bear_count:
            sentiment = "Bullish"
            confidence = min(60.0 + (bull_count * 10), 95.0)
        elif bear_count > bull_count:
            sentiment = "Bearish"
            confidence = min(60.0 + (bear_count * 10), 95.0)
        else:
            sentiment = "Neutral"
            confidence = 50.0

        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "explanation": f"Based on news indicators, this title shows a {sentiment.lower()} lean with moderate confidence."
        }

    def _mock_copilot_chat(self, question: str, ticker: str) -> Dict[str, Any]:
        if ticker == "MARKET":
            return {
                "summary": "The broader equity markets are exhibiting mixed momentum today. Small-cap indexes are holding up on expectations of Federal Reserve interest rate policy softening, while mega-cap technology shares are experiencing minor profit-taking. Investors are eagerly awaiting key macroeconomic releases, including core PCE inflation data, which will dictate the trend for the third quarter.",
                "sentiment": "Neutral",
                "confidence": 75.0,
                "supporting_news": [
                    {"title": "Global Indices Flat Ahead of Core Inflation Release", "publisher": "Bloomberg", "url": "#"},
                    {"title": "Treasury Yields Stability Limits Market Downside", "publisher": "Reuters", "url": "#"}
                ],
                "risks": [
                    "Unexpected spike in core inflation prints.",
                    "Sustained elevated bond yields compressing equity multiples.",
                    "Geopolitical tensions in key transit and shipping corridors."
                ],
                "related_stocks": ["SPY", "QQQ", "DIA"],
                "sources": ["Bloomberg Finance", "Federal Reserve Board"]
            }
        
        ticker_details = {
            "AAPL": {
                "summary": "Apple Inc. (AAPL) is exhibiting a bullish sentiment wave. Optimism is driven by structural updates regarding Apple Intelligence, its proprietary on-device AI system. Wall Street expects that this suite of features will trigger a significant iPhone upgrade cycle, driving high single-digit growth in device revenues and strengthening services ecosystem margins.",
                "sentiment": "Bullish",
                "confidence": 88.0,
                "supporting_news": [
                    {"title": "Apple Intelligence Beta Launch Beats User Projections", "publisher": "TechCrunch", "url": "#"},
                    {"title": "Brokerage Firms Upgrades Apple Price Target to $230", "publisher": "Morgan Stanley", "url": "#"}
                ],
                "risks": [
                    "Slowing smartphone shipments in competitive Asian markets.",
                    "Antitrust regulatory scrutiny in both the US and the European Union."
                ],
                "related_stocks": ["MSFT", "GOOGL", "NVDA"],
                "sources": ["SEC Filings", "Morgan Stanley Research"]
            },
            "TSLA": {
                "summary": "Tesla Inc. (TSLA) currently has a bearish/neutral bias. While recent price cuts have successfully defended sales volumes, they have placed downward pressure on operating margins, which fell below analyst estimates. Market participants are heavily focused on the upcoming Robotaxi unveil event, which could serve as a major structural catalyst.",
                "sentiment": "Bearish",
                "confidence": 82.0,
                "supporting_news": [
                    {"title": "Tesla Q2 Auto Margins Contract Amid Competitive Incentives", "publisher": "WSJ", "url": "#"},
                    {"title": "EV Registration Metrics Soften in Major European Hubs", "publisher": "Automotive News", "url": "#"}
                ],
                "risks": [
                    "Intensifying competition from domestic electric vehicle makers in China.",
                    "Delayed launch timelines for the Next-Gen low-cost model."
                ],
                "related_stocks": ["RIVN", "BYDDF", "LCID"],
                "sources": ["Tesla IR", "Bloomberg Automotive"]
            },
            "NVDA": {
                "summary": "NVIDIA Corporation (NVDA) remains strongly bullish. The demand for Blackwell and Hopper architectures continues to outstrip production capacity. Hyperscalers (Microsoft, AWS, Google) have committed to expanding their capital expenditures, indicating that AI chip demand remains solid for the near-to-mid term.",
                "sentiment": "Bullish",
                "confidence": 94.0,
                "supporting_news": [
                    {"title": "NVIDIA Blackwell Production Yields Solidify After Re-tape", "publisher": "Tom's Hardware", "url": "#"},
                    {"title": "Cloud Spending Surge Signals Durable AI Hardware Run-rate", "publisher": "Forbes", "url": "#"}
                ],
                "risks": [
                    "Supply-side bottlenecks from foundry and advanced packaging partners (TSMC).",
                    "Geopolitical restrictions on custom AI exports."
                ],
                "related_stocks": ["AMD", "SMCI", "ASML"],
                "sources": ["TSMC Reports", "NVIDIA Q1 Earnings call"]
            }
        }
        
        if ticker in ticker_details:
            return ticker_details[ticker]
            
        return {
            "summary": f"{ticker} is currently experiencing a neutral market sentiment phase. The stock price is consolidative as volume metrics remain average. Key technical indicators (RSI and MACD) suggest a short-term holding pattern as the market evaluates structural fundamentals and upcoming quarterly reporting.",
            "sentiment": "Neutral",
            "confidence": 65.0,
            "supporting_news": [
                {"title": f"Analyzing {ticker} Earnings Outlook For The Upcoming Quarter", "publisher": "MarketWatch", "url": "#"},
                {"title": f"Institutional Holdings Shift Positions In {ticker} Shares", "publisher": "SEC Form 13F", "url": "#"}
            ],
            "risks": [
                "Macroeconomic slowdown compressing consumer and enterprise budgets.",
                "Technical resistance levels near the 200-day moving average."
            ],
            "related_stocks": ["SPY", "QQQ"],
            "sources": ["Yahoo Finance", "SEC Filings"]
        }

    def _mock_portfolio_analysis(self, holdings: List[Dict[str, Any]]) -> Dict[str, Any]:
        symbols = [h["stock_symbol"].upper() for h in holdings]
        is_tech_heavy = any(s in ["AAPL", "MSFT", "NVDA", "GOOGL"] for s in symbols)
        
        sentiment = "Bullish"
        sentiment_score = 72.0
        risk_score = 45.0
        
        if is_tech_heavy:
            sentiment_score = 80.0
            risk_score = 65.0
            diversification = "Technology-heavy allocation. High growth potential, elevated volatility."
            recommendation = "Consider hedging technology exposure by adding defensive positions in Consumer Staples or Utilities."
        else:
            diversification = "Well-diversified across multiple market sectors."
            recommendation = "Maintain current allocations and review alerts settings to manage sudden downside volatility."

        return {
            "sentiment": sentiment,
            "portfolio_sentiment_score": sentiment_score,
            "risk_score": risk_score,
            "recommendation": recommendation,
            "diversification_status": diversification
        }

ai_service = AIService()
