import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure auth header injection interceptor
export const setupInterceptors = (getToken: () => string | null) => {
  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// --- API Wrapper Functions ---

export interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  sector: string;
  industry: string;
  market_cap: number;
  volume: number;
  pe_ratio: number | null;
  day_high: number;
  day_low: number;
  summary: string;
  is_mock?: boolean;
}

export interface StockHistoryItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publisher: string;
  published_at: string;
  stock_symbol?: string;
  ai_summary?: string;
  sentiment?: string;
  confidence?: number;
}

export interface MarketOverviewData {
  indices: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
  }>;
  top_gainers: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
    sector: string;
  }>;
  top_losers: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
    sector: string;
  }>;
  trending: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
    sector: string;
  }>;
  market_news: NewsItem[];
  mood_value: number;
  timestamp: string;
}

export interface StockDetailsResponse {
  info: StockInfo;
  history: StockHistoryItem[];
  news: NewsItem[];
  sentiment: {
    sentiment: string;
    confidence: number;
    explanation: string;
  };
}

export interface PortfolioHolding {
  id: number;
  stock_symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  current_value: number;
  profit_loss: number;
  profit_loss_pct: number;
  sector: string;
  allocation_pct?: number;
}

export interface PortfolioResponse {
  holdings: PortfolioHolding[];
  portfolio_value: number;
  cost_basis: number;
  total_profit_loss: number;
  total_profit_loss_pct: number;
  allocations: Array<{ symbol: string; value: number; percentage: number }>;
  sector_allocations: Array<{ sector: string; value: number; percentage: number }>;
  portfolio_sentiment: string;
  portfolio_sentiment_score: number;
  risk_score: number;
  recommendation: string;
  diversification_status: string;
}

export interface AlertItem {
  id: number;
  stock_symbol: string;
  alert_type: string;
  threshold: number;
  is_active: boolean;
  created_at: string;
}

export interface CopilotChatResponse {
  summary: string;
  sentiment: string;
  confidence: number;
  supporting_news: Array<{ title: string; publisher: string; url: string }>;
  risks: string[];
  related_stocks: string[];
  sources: string[];
}

export interface ChatHistoryItem {
  id: number;
  question: string;
  answer: string;
  sentiment_data?: CopilotChatResponse;
  timestamp: string;
}

export interface AdminAnalytics {
  user_count: number;
  feedback_count: number;
  watchlist_count: number;
  chat_count: number;
}

export interface AdminFeedbackItem {
  id: number;
  message: string;
  rating: number;
  created_at: string;
  user_name: string;
  user_email: string;
  user_photo: string;
}

export const marketApi = {
  getOverview: () => api.get<MarketOverviewData>('/api/market/overview').then(res => res.data),
  getStockDetails: (symbol: string, period = '1mo') => 
    api.get<StockDetailsResponse>(`/api/market/stock/${symbol}?period=${period}`).then(res => res.data),
  search: (query: string) => api.get<{ results: Array<{ symbol: string; name: string; sector: string }> }>(`/api/market/search?query=${query}`).then(res => res.data),
};

export const watchlistApi = {
  get: () => api.get<Array<{ symbol: string; name: string; price: number; change: number; change_percent: number }>>('/api/watchlist').then(res => res.data),
  add: (symbol: string) => api.post('/api/watchlist', { stock_symbol: symbol }).then(res => res.data),
  remove: (symbol: string) => api.delete(`/api/watchlist/${symbol}`).then(res => res.data),
};

export const portfolioApi = {
  get: () => api.get<PortfolioResponse>('/api/portfolio').then(res => res.data),
  add: (symbol: string, quantity: number, avgPrice: number) => 
    api.post('/api/portfolio', { stock_symbol: symbol, quantity, avg_price: avgPrice }).then(res => res.data),
  remove: (symbol: string) => api.delete(`/api/portfolio/${symbol}`).then(res => res.data),
};

export const alertsApi = {
  get: () => api.get<AlertItem[]>('/api/alerts').then(res => res.data),
  create: (symbol: string, type: string, threshold: number) => 
    api.post('/api/alerts', { stock_symbol: symbol, alert_type: type, threshold }).then(res => res.data),
  delete: (id: number) => api.delete(`/api/alerts/${id}`).then(res => res.data),
};

export const copilotApi = {
  chat: (question: string) => api.post<CopilotChatResponse>('/api/copilot/chat', { question }).then(res => res.data),
  getHistory: () => api.get<ChatHistoryItem[]>('/api/copilot/history').then(res => res.data),
};

export const feedbackApi = {
  submit: (message: string, rating: number) => api.post('/api/feedback', { message, rating }).then(res => res.data),
};

export const adminApi = {
  getAnalytics: () => api.get<AdminAnalytics>('/api/admin/analytics').then(res => res.data),
  getFeedback: () => api.get<AdminFeedbackItem[]>('/api/admin/feedback').then(res => res.data),
};

export default api;
