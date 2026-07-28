import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Sparkles, 
  FolderHeart, 
  Plus, 
  BellRing, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Layers,
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

import { marketApi, watchlistApi, portfolioApi, alertsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const MarketPulsePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeSymbol = searchParams.get('s') || 'AAPL';
  const [searchQuery, setSearchQuery] = useState(activeSymbol);
  const [chartPeriod, setChartPeriod] = useState('1mo');
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Dialog states for fast additions
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portQty, setPortQty] = useState('');
  const [portPrice, setPortPrice] = useState('');

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState('sentiment_above');
  const [alertThreshold, setAlertThreshold] = useState('80');

  // Query Stock Details
  const { data: details, isLoading, error } = useQuery({
    queryKey: ['stockDetails', activeSymbol, chartPeriod],
    queryFn: () => marketApi.getStockDetails(activeSymbol, chartPeriod),
    retry: 1
  });

  // Query Watchlist to see if this symbol is active
  const { data: watchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.get,
    enabled: !!user
  });

  useEffect(() => {
    if (watchlist) {
      setIsWatchlisted(watchlist.some(w => w.symbol.toUpperCase() === activeSymbol.toUpperCase() || w.symbol === activeSymbol));
    }
  }, [watchlist, activeSymbol]);

  // Mutations
  const watchlistAdd = useMutation({
    mutationFn: () => watchlistApi.add(activeSymbol),
    onSuccess: () => {
      setIsWatchlisted(true);
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  const watchlistRemove = useMutation({
    mutationFn: () => watchlistApi.remove(activeSymbol),
    onSuccess: () => {
      setIsWatchlisted(false);
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  const portfolioAdd = useMutation({
    mutationFn: () => portfolioApi.add(activeSymbol, parseFloat(portQty), parseFloat(portPrice)),
    onSuccess: () => {
      setShowPortfolioModal(false);
      setPortQty('');
      setPortPrice('');
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    }
  });

  const alertCreate = useMutation({
    mutationFn: () => alertsApi.create(activeSymbol, alertType, parseFloat(alertThreshold)),
    onSuccess: () => {
      setShowAlertModal(false);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ s: searchQuery.trim().toUpperCase() });
    }
  };

  const toggleWatchlist = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isWatchlisted) {
      watchlistRemove.mutate();
    } else {
      watchlistAdd.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-slate-800/40 w-64 rounded-xl shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-800/30 rounded-2xl border border-slate-900 shimmer" />
          <div className="h-96 bg-slate-800/30 rounded-2xl border border-slate-900 shimmer" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-xl font-bold mb-2">Symbol not found</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          DUODO could not load data for symbol "{activeSymbol.toUpperCase()}". Try standard tickers like AAPL, TSLA, NVDA.
        </p>
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-xs">
          <input
            type="text"
            placeholder="Search another symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-lg"
          />
          <button type="submit" className="bg-accentBlue-600 px-4 py-2 rounded-lg text-xs font-bold text-white">Search</button>
        </form>
      </div>
    );
  }

  const { info, history, news, sentiment } = details;
  const isUp = info.change >= 0;

  // Mock social trend details
  const socialVolumeData = [
    { name: 'Mon', Social: 240, News: 80 },
    { name: 'Tue', Social: 320, News: 95 },
    { name: 'Wed', Social: 290, News: 88 },
    { name: 'Thu', Social: 410, News: 110 },
    { name: 'Fri', Social: 560, News: 145 },
  ];

  // Mock word cloud descriptors based on sentiment
  const mockWords = sentiment.sentiment === 'Bullish'
    ? [
        { word: 'Blackwell', weight: 90, type: 'bull' },
        { word: 'AI Demand', weight: 80, type: 'bull' },
        { word: 'Revenue Beat', weight: 75, type: 'bull' },
        { word: 'Scale', weight: 60, type: 'neutral' },
        { word: 'Margin Expansion', weight: 50, type: 'bull' },
        { word: 'Regulation', weight: 40, type: 'bear' }
      ]
    : [
        { word: 'Margin compression', weight: 90, type: 'bear' },
        { word: 'Competition', weight: 80, type: 'bear' },
        { word: 'Supply line', weight: 70, type: 'neutral' },
        { word: 'Valuation', weight: 60, type: 'bear' },
        { word: 'Debt yields', weight: 50, type: 'bear' },
        { word: 'Buyback', weight: 40, type: 'bull' }
      ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 1. Actions Header toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Stock Headline info */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white">{info.symbol}</h1>
            <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-md font-semibold">
              {info.name}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-bold text-white tracking-tight">${info.price.toFixed(2)}</span>
            <span className={`text-xs font-bold flex items-center ${isUp ? 'text-accentEmerald-400' : 'text-red-400'}`}>
              {isUp ? '+' : ''}{info.change.toFixed(2)} ({info.change_percent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Dashboard modifiers shortcuts */}
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          {/* Watchlist toggle */}
          <button
            onClick={toggleWatchlist}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all ${
              isWatchlisted 
                ? 'bg-accentBlue-500/10 text-accentBlue-400 border-accentBlue-500/30 shadow-premium' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700/80 hover:text-white'
            }`}
          >
            <FolderHeart className="w-4 h-4" /> {isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
          </button>
          
          {/* Portfolio toggle */}
          <button
            onClick={() => {
              if (!user) navigate('/login');
              else setShowPortfolioModal(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700/80 px-4 py-2.5 rounded-xl text-slate-300 transition-all hover:text-white"
          >
            <Plus className="w-4 h-4" /> Add Holdings
          </button>

          {/* Alert trigger */}
          <button
            onClick={() => {
              if (!user) navigate('/login');
              else setShowAlertModal(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700/80 px-4 py-2.5 rounded-xl text-slate-300 transition-all hover:text-white"
          >
            <BellRing className="w-4 h-4" /> Set Alert
          </button>
        </div>
      </div>

      {/* 2. Sentiment Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Price Chart */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-4 mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-accentBlue-400" /> Historical Price Chart
            </h3>
            
            {/* Period Selector */}
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
              {['5d', '1mo', '3mo', '1y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1.5 rounded-md transition-colors uppercase ${
                    chartPeriod === p ? 'bg-accentBlue-600 text-white shadow-premium' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorPricePulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isUp ? "#10B981" : "#EF4444"} stopOpacity={0.18}/>
                    <stop offset="95%" stopColor={isUp ? "#10B981" : "#EF4444"} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={9} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={9} 
                  domain={['auto', 'auto']}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderColor: '#334155',
                    borderRadius: '12px'
                  }}
                  labelStyle={{ color: '#94A3B8', fontSize: '10px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Close']}
                />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke={isUp ? "#10B981" : "#EF4444"} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorPricePulse)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Analysis Gauge & breakdown */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col h-[400px] justify-between">
          <div className="flex items-center gap-3 border-b border-slate-800/40 pb-4">
            <span className="h-8 w-8 rounded-lg bg-accentBlue-500/10 flex items-center justify-center border border-accentBlue-500/20">
              <Sparkles className="w-4 h-4 text-accentBlue-400" />
            </span>
            <div>
              <h3 className="text-sm font-bold">AI Sentiment Gauge</h3>
              <span className="text-xs text-slate-400">Aggregated sentiment stance</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-auto p-4">
            <h3 className={`text-4xl font-extrabold tracking-tight ${
              sentiment.sentiment === 'Bullish' ? 'text-accentEmerald-400 glow-green' : sentiment.sentiment === 'Bearish' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {sentiment.sentiment}
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">
              CONFIDENCE RATING: {sentiment.confidence}%
            </span>
            
            {/* Horizontal progress bar breakdown */}
            <div className="w-full space-y-2.5 mt-6 text-[10px]">
              <div>
                <div className="flex justify-between font-bold text-slate-400 mb-1">
                  <span>Bullish Stance</span>
                  <span>{sentiment.sentiment === 'Bullish' ? sentiment.confidence : Math.round((100 - sentiment.confidence) * 0.4)}%</span>
                </div>
                <div className="h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accentEmerald-500 rounded-full" 
                    style={{ width: `${sentiment.sentiment === 'Bullish' ? sentiment.confidence : Math.round((100 - sentiment.confidence) * 0.4)}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-400 mb-1">
                  <span>Bearish Stance</span>
                  <span>{sentiment.sentiment === 'Bearish' ? sentiment.confidence : Math.round((100 - sentiment.confidence) * 0.3)}%</span>
                </div>
                <div className="h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full" 
                    style={{ width: `${sentiment.sentiment === 'Bearish' ? sentiment.confidence : Math.round((100 - sentiment.confidence) * 0.3)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-center text-[10px] text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-300 block mb-0.5">Gemini Stance Summary</span>
            {sentiment.explanation}
          </div>
        </div>
      </div>

      {/* 3. Word Cloud & Social Engagement Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Social Trend Bar Chart */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col h-[320px]">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-200 border-b border-slate-800/40 pb-3">
            <Layers className="w-4 h-4 text-accentBlue-400" /> Sentiment Engagement Volume
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={socialVolumeData}>
                <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderColor: '#334155',
                    borderRadius: '12px'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="Social" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="News" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Word Cloud */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col h-[320px] justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2 text-slate-200 border-b border-slate-800/40 pb-3">
            <Sparkles className="w-4 h-4 text-accentBlue-400" /> AI Keyword Clouds
          </h3>
          <div className="flex-1 flex flex-wrap items-center justify-center gap-3 p-4">
            {mockWords.map((item, idx) => (
              <span 
                key={idx}
                className={`px-3 py-1.5 rounded-xl border font-bold select-none transition-all hover:scale-105 ${
                  item.type === 'bull' 
                    ? 'bg-accentEmerald-500/10 text-accentEmerald-400 border-accentEmerald-500/20 glow-green' 
                    : item.type === 'bear' 
                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : 'bg-slate-800/50 text-slate-300 border-slate-700/40'
                }`}
                style={{ fontSize: `${10 + (item.weight / 100) * 10}px` }}
              >
                {item.word}
              </span>
            ))}
          </div>
          <div className="text-center text-[10px] text-slate-500 italic pb-1">
            Top tags matching AI analytical reports regarding {info.symbol}.
          </div>
        </div>
      </div>

      {/* 4. Symbol Specific News Feed */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-6 pb-2 border-b border-slate-800/40">
          <Calendar className="w-4 h-4 text-accentBlue-400" /> Recent News for {info.symbol}
        </h3>
        <div className="space-y-4">
          {news.map((item, idx) => (
            <div 
              key={idx} 
              className="bg-slate-950/40 border border-slate-900/60 p-4.5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-800 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-[9px] text-slate-500">
                  <span className="font-bold text-slate-400 uppercase">{item.publisher}</span>
                  <span>•</span>
                  <span>{new Date(item.published_at).toLocaleDateString()}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.summary}</p>
              </div>
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold px-4 py-2.5 rounded-xl text-slate-300 hover:text-white transition-all whitespace-nowrap"
              >
                Read Article
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* --- Dialog Modals --- */}
      {/* Portfolio Holdings Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPortfolioModal(false)} />
          <div className="bg-darkNavy-900 border border-slate-800/80 p-6 rounded-2xl max-w-sm w-full z-10 shadow-premium relative">
            <h3 className="text-base font-extrabold text-white mb-2">Log {info.symbol} Transaction</h3>
            <p className="text-[11px] text-slate-400 mb-4">Record purchases to track allocations and portfolio return calculations.</p>
            
            <div className="space-y-3.5 mb-6 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Quantity (Shares)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 10" 
                  value={portQty} 
                  onChange={(e) => setPortQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-slate-200" 
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Purchase Price (per Share)</label>
                <input 
                  type="number" 
                  placeholder={`e.g. ${info.price}`} 
                  value={portPrice} 
                  onChange={(e) => setPortPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-slate-200" 
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowPortfolioModal(false)}
                className="flex-1 bg-slate-900 border border-slate-800 py-2.5 rounded-xl text-slate-400 font-bold text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={() => portfolioAdd.mutate()}
                disabled={!portQty || !portPrice}
                className="flex-1 bg-accentBlue-600 hover:bg-accentBlue-700 text-white py-2.5 rounded-xl font-bold text-xs disabled:opacity-50"
              >
                Log Shares
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment Alerts Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAlertModal(false)} />
          <div className="bg-darkNavy-900 border border-slate-800/80 p-6 rounded-2xl max-w-sm w-full z-10 shadow-premium relative">
            <h3 className="text-base font-extrabold text-white mb-2">Create {info.symbol} Alert</h3>
            <p className="text-[11px] text-slate-400 mb-4">Set conditional boundaries to trigger system notifications.</p>

            <div className="space-y-3.5 mb-6 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Alert Condition</label>
                <select 
                  value={alertType} 
                  onChange={(e) => setAlertType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-slate-200"
                >
                  <option value="sentiment_above">AI Sentiment Exceeds</option>
                  <option value="sentiment_below">AI Sentiment Falls Below</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Threshold (%)</label>
                <input 
                  type="number" 
                  value={alertThreshold} 
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-slate-200" 
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowAlertModal(false)}
                className="flex-1 bg-slate-900 border border-slate-800 py-2.5 rounded-xl text-slate-400 font-bold text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={() => alertCreate.mutate()}
                className="flex-1 bg-accentBlue-600 hover:bg-accentBlue-700 text-white py-2.5 rounded-xl font-bold text-xs"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
