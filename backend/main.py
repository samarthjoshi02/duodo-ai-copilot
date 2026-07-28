import os
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from backend.config import settings
from backend.services.db_service import db_service
from backend.services.market_service import market_service
from backend.services.ai_service import ai_service
from backend.services.auth_service import verify_token

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for DUODO Market Sentiment AI Copilot",
    version="1.0.0"
)

# Enable CORS for React Frontend (runs on port 5173 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all or configure frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas for Requests ---
class UserSyncRequest(BaseModel):
    # These are populated from Firebase Auth Client SDK
    firebase_uid: str
    email: str
    name: Optional[str] = None
    photo: Optional[str] = None

class WatchlistAddRequest(BaseModel):
    stock_symbol: str = Field(..., description="Stock symbol to add, e.g. TSLA")

class PortfolioAddRequest(BaseModel):
    stock_symbol: str = Field(..., description="Stock symbol, e.g. AAPL")
    quantity: float = Field(..., gt=0, description="Number of shares")
    avg_price: float = Field(..., gt=0, description="Purchase price per share")

class AlertCreateRequest(BaseModel):
    stock_symbol: str
    alert_type: str = Field(..., description="E.g., sentiment_above, sentiment_below, sentiment_change")
    threshold: float = Field(..., description="Threshold level (percentage or change value)")

class ChatRequest(BaseModel):
    question: str

class FeedbackRequest(BaseModel):
    message: str
    rating: int = Field(..., ge=1, le=5)

# --- Endpoints ---

# 1. Health check
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "SQLite (Mock)" if settings.is_db_mocked else "PostgreSQL (Supabase)",
        "ai": "Mock AI" if settings.is_ai_mocked else "Featherless API Active"
    }

# 2. User Authentication Syncing
@app.post("/api/user/sync")
def sync_user(req: UserSyncRequest, user: dict = Depends(verify_token)):
    # User object returned by verify_token will be synced to db
    return {"status": "success", "user": user}

# 3. Market Pulse & Stock Details
@app.get("/api/market/overview")
def get_market_overview():
    try:
        return market_service.get_market_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Market data failure: {str(e)}")

@app.get("/api/market/stock/{symbol}")
def get_stock_details(symbol: str, period: str = "1mo"):
    info = market_service.get_stock_info(symbol)
    history = market_service.get_stock_history(symbol, period)
    news = market_service.get_stock_news(symbol)
    
    # Run sentiment analysis on stock description/news using Gemini
    summary = info.get("summary", "")
    news_titles = " ".join([n["title"] for n in news])
    
    sentiment_res = ai_service.analyze_news_sentiment(
        title=f"Market stance on {symbol}",
        summary=f"{summary} Recent headlines: {news_titles}"
    )
    
    # Write to sentiment history database if database is configured
    try:
        db_service.save_sentiment_record(
            stock_symbol=symbol,
            sentiment=sentiment_res["sentiment"],
            confidence=sentiment_res["confidence"],
            source="Combined"
        )
    except Exception as dbe:
        print(f"Error logging sentiment history: {dbe}")

    return {
        "info": info,
        "history": history,
        "news": news,
        "sentiment": sentiment_res
    }

@app.get("/api/market/search")
def search_market(query: str = Query(..., min_length=1)):
    query = query.upper().strip()
    # Simple search algorithm matching local list or returning mock results
    matches = []
    all_stocks = [
        {"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "sector": "Technology"},
        {"symbol": "TSLA", "name": "Tesla Inc.", "sector": "Automotive"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology"},
        {"symbol": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Cyclical"},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "sector": "Technology"},
        {"symbol": "META", "name": "Meta Platforms Inc.", "sector": "Technology"},
        {"symbol": "NFLX", "name": "Netflix Inc.", "sector": "Communication Services"}
    ]
    for stock in all_stocks:
        if query in stock["symbol"] or query in stock["name"].upper():
            matches.append(stock)
            
    # Fallback to creating a dynamic search row if query is a ticker format
    if not matches and len(query) <= 5 and query.isalpha():
        matches.append({"symbol": query, "name": f"{query} Corporation", "sector": "Markets"})
        
    return {"results": matches}

# 4. Watchlist Router
@app.get("/api/watchlist")
def get_user_watchlist(user: dict = Depends(verify_token)):
    symbols = db_service.get_watchlist(user["id"])
    watchlist_details = []
    for s in symbols:
        info = market_service.get_stock_info(s)
        watchlist_details.append({
            "symbol": s,
            "name": info["name"],
            "price": info["price"],
            "change": info["change"],
            "change_percent": info["change_percent"]
        })
    return watchlist_details

@app.post("/api/watchlist")
def add_watchlist_item(req: WatchlistAddRequest, user: dict = Depends(verify_token)):
    db_service.add_to_watchlist(user["id"], req.stock_symbol)
    return {"status": "success", "message": f"{req.stock_symbol.upper()} added to watchlist"}

@app.delete("/api/watchlist/{symbol}")
def remove_watchlist_item(symbol: str, user: dict = Depends(verify_token)):
    db_service.remove_from_watchlist(user["id"], symbol)
    return {"status": "success", "message": f"{symbol.upper()} removed from watchlist"}

# 5. Portfolio Router
@app.get("/api/portfolio")
def get_user_portfolio(user: dict = Depends(verify_token)):
    holdings = db_service.get_portfolio(user["id"])
    
    portfolio_value = 0.0
    cost_basis = 0.0
    detailed_holdings = []
    
    for h in holdings:
        symbol = h["stock_symbol"]
        qty = float(h["quantity"])
        avg_price = float(h["avg_price"])
        
        info = market_service.get_stock_info(symbol)
        curr_price = info["price"]
        
        current_value = qty * curr_price
        holding_cost = qty * avg_price
        profit_loss = current_value - holding_cost
        profit_loss_pct = (profit_loss / holding_cost * 100) if holding_cost > 0 else 0.0
        
        portfolio_value += current_value
        cost_basis += holding_cost
        
        detailed_holdings.append({
            "id": h["id"],
            "stock_symbol": symbol,
            "name": info["name"],
            "quantity": qty,
            "avg_price": avg_price,
            "current_price": curr_price,
            "current_value": round(current_value, 2),
            "profit_loss": round(profit_loss, 2),
            "profit_loss_pct": round(profit_loss_pct, 2),
            "sector": info["sector"]
        })
    
    # Calculate portfolio allocations
    allocations = []
    if portfolio_value > 0:
        for dh in detailed_holdings:
            dh["allocation_pct"] = round((dh["current_value"] / portfolio_value) * 100, 2)
            allocations.append({
                "symbol": dh["stock_symbol"],
                "value": dh["current_value"],
                "percentage": dh["allocation_pct"]
            })
            
    # Calculate Sector Allocation
    sector_alloc = {}
    for dh in detailed_holdings:
        sec = dh["sector"]
        sector_alloc[sec] = sector_alloc.get(sec, 0.0) + dh["current_value"]
        
    sector_allocations = []
    for s, v in sector_alloc.items():
        pct = round((v / portfolio_value) * 100, 2) if portfolio_value > 0 else 0.0
        sector_allocations.append({"sector": s, "value": round(v, 2), "percentage": pct})

    # AI Sentiment & Risk Scores for the portfolio
    ai_analysis = ai_service.analyze_portfolio_sentiment(detailed_holdings)
    
    total_profit_loss = portfolio_value - cost_basis
    total_profit_loss_pct = (total_profit_loss / cost_basis * 100) if cost_basis > 0 else 0.0

    return {
        "holdings": detailed_holdings,
        "portfolio_value": round(portfolio_value, 2),
        "cost_basis": round(cost_basis, 2),
        "total_profit_loss": round(total_profit_loss, 2),
        "total_profit_loss_pct": round(total_profit_loss_pct, 2),
        "allocations": allocations,
        "sector_allocations": sector_allocations,
        "portfolio_sentiment": ai_analysis.get("sentiment", "Neutral"),
        "portfolio_sentiment_score": ai_analysis.get("portfolio_sentiment_score", 50.0),
        "risk_score": ai_analysis.get("risk_score", 30.0),
        "recommendation": ai_analysis.get("recommendation", ""),
        "diversification_status": ai_analysis.get("diversification_status", "")
    }

@app.post("/api/portfolio")
def add_portfolio_item(req: PortfolioAddRequest, user: dict = Depends(verify_token)):
    db_service.add_to_portfolio(user["id"], req.stock_symbol, req.quantity, req.avg_price)
    return {"status": "success", "message": f"Added holdings for {req.stock_symbol.upper()}"}

@app.delete("/api/portfolio/{symbol}")
def remove_portfolio_item(symbol: str, user: dict = Depends(verify_token)):
    db_service.remove_from_portfolio(user["id"], symbol)
    return {"status": "success", "message": f"Removed holdings for {symbol.upper()}"}

# 6. Alerts Router
@app.get("/api/alerts")
def get_user_alerts(user: dict = Depends(verify_token)):
    return db_service.get_alerts(user["id"])

@app.post("/api/alerts")
def create_user_alert(req: AlertCreateRequest, user: dict = Depends(verify_token)):
    db_service.create_alert(user["id"], req.stock_symbol, req.alert_type, req.threshold)
    return {"status": "success", "message": f"Alert set on {req.stock_symbol.upper()}"}

@app.delete("/api/alerts/{alert_id}")
def delete_user_alert(alert_id: int, user: dict = Depends(verify_token)):
    db_service.delete_alert(user["id"], alert_id)
    return {"status": "success", "message": "Alert deleted"}

# 7. AI Copilot Chat
@app.post("/api/copilot/chat")
def run_copilot_chat(req: ChatRequest, user: dict = Depends(verify_token)):
    # Retrieve past chat history
    past_chats = db_service.get_chat_history(user["id"])
    formatted_history = []
    # Reverse to read chronologically
    for c in reversed(past_chats[:6]):
        formatted_history.append({"role": "user", "content": c["question"]})
        formatted_history.append({"role": "model", "content": c["answer"]})
        
    ai_response = ai_service.generate_copilot_chat(req.question, formatted_history)
    
    # Save to Database
    db_service.save_chat_message(
        user_id=user["id"],
        question=req.question,
        answer=ai_response["summary"],
        sentiment_data=ai_response
    )
    
    return ai_response

@app.get("/api/copilot/history")
def get_user_chat_history(user: dict = Depends(verify_token)):
    return db_service.get_chat_history(user["id"])

# 8. Feedback
@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest, user: dict = Depends(verify_token)):
    db_service.save_feedback(user["id"], req.message, req.rating)
    return {"status": "success", "message": "Feedback submitted successfully"}

# 9. Admin Router
@app.get("/api/admin/analytics")
def get_admin_dashboard(user: dict = Depends(verify_token)):
    # Simple check: restrict if user is not from demo/admin email
    # For demo purposes, we display it for everyone
    return db_service.get_admin_analytics()

@app.get("/api/admin/feedback")
def get_all_feedbacks(user: dict = Depends(verify_token)):
    return db_service.get_feedbacks()

# Run server script
if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
