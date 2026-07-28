-- DB Schema Setup for DUODO - AI Copilot for Market Sentiment Analysis

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Watchlists Table
CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stock_symbol)
);

-- 3. Sentiment History Table
CREATE TABLE IF NOT EXISTS sentiment_history (
    id SERIAL PRIMARY KEY,
    stock_symbol VARCHAR(50) NOT NULL,
    sentiment VARCHAR(50) NOT NULL, -- 'Bullish', 'Bearish', 'Neutral'
    confidence NUMERIC(5,2) NOT NULL, -- e.g. 85.50
    source TEXT NOT NULL, -- 'News', 'Social', 'Combined'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. News Table
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT UNIQUE NOT NULL,
    publisher VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ai_summary TEXT,
    sentiment VARCHAR(50),
    confidence NUMERIC(5,2)
);

-- 5. Portfolio Table
CREATE TABLE IF NOT EXISTS portfolio (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(50) NOT NULL,
    quantity NUMERIC(12,4) NOT NULL,
    avg_price NUMERIC(12,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stock_symbol)
);

-- 6. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(50) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'sentiment_above', 'sentiment_below', 'sentiment_change'
    threshold NUMERIC(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sentiment_data JSONB, -- stores sentiment, confidence, potential risks, etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for optimizing search
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_history_symbol ON sentiment_history(stock_symbol);
