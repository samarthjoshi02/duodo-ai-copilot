import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  Newspaper, 
  Flame, 
  Gauge, 
  Activity 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { useAuth } from '../contexts/AuthContext';
import { marketApi } from '../services/api';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('1mo');

  // Query Overview
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['marketOverview'],
    queryFn: marketApi.getOverview,
    refetchInterval: 30000 // Refresh every 30s
  });

  // Query SPY Details for Main Dashboard Chart
  const { data: spyDetails, isLoading: chartLoading } = useQuery({
    queryKey: ['spyDetails', selectedPeriod],
    queryFn: () => marketApi.getStockDetails('SPY', selectedPeriod)
  });

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMoodLabel = (val: number) => {
    if (val < 30) return { text: 'Extreme Fear', color: 'text-red-400' };
    if (val < 45) return { text: 'Fear', color: 'text-orange-400' };
    if (val < 55) return { text: 'Neutral', color: 'text-yellow-400' };
    if (val < 70) return { text: 'Greed', color: 'text-accentEmerald-400' };
    return { text: 'Extreme Greed', color: 'text-emerald-500 glow-green' };
  };

  const sectors = [
    { name: 'Technology', change: 1.45, up: true },
    { name: 'Financials', change: 0.62, up: true },
    { name: 'Healthcare', change: -0.22, up: false },
    { name: 'Energy', change: -0.85, up: false },
    { name: 'Consumer Cyclical', change: 1.10, up: true },
    { name: 'Communication Services', change: 1.88, up: true }
  ];

  const quotes = [
    "The stock market is a device for transferring money from the impatient to the patient.",
    "An investment in knowledge pays the best interest.",
    "The four most dangerous words in investing are: 'This time it's different.'",
    "In investing, what is comfortable is rarely profitable.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Every once in a while, the market does something so stupid it takes your breath away."
  ];
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  if (overviewLoading) {
    return (
      <div className="p-6 space-y-6 shimmer-container">
        {/* Header Skeleton */}
        <div className="h-10 w-64 bg-slate-800/40 rounded-xl shimmer" />
        
        {/* Metrics Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/30 rounded-2xl shimmer border border-slate-900" />
          ))}
        </div>

        {/* Charts & Mood Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-800/30 rounded-2xl shimmer border border-slate-900" />
          <div className="h-80 bg-slate-800/30 rounded-2xl shimmer border border-slate-900" />
        </div>
      </div>
    );
  }

  if (overviewError || !overview) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-6 text-center">
        <Activity className="w-12 h-12 text-red-400 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold mb-2">Market Sync Lost</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Unable to pull data from market APIs. Verify backend service connection.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-accentBlue-600 hover:bg-accentBlue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const chartData = spyDetails?.history || [];
  const spyCurrent = spyDetails?.info || { symbol: 'SPY', price: 546.30, change: 1.45, change_percent: 0.25 };
  const mood = getMoodLabel(overview.mood_value);

  // Fallback for AI Summary if backend is loading or mock
  const aiMarketSummary = 
    spyDetails?.sentiment?.explanation || 
    "Market indexes show consolidative patterns as tech shares rotate into defensive slots. High capital expenditures by hyperscalers sustain bullish trends in AI hardware supply chains, but upcoming core PCE inflation reads dictate near-term yield indexes.";

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 1. Header Greeting & AI Overview */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            {getGreeting()}, {user?.name.split(' ')[0] || 'Investor'}
          </h1>
          <p className="text-[11px] text-slate-400 mt-2 font-medium italic border-l-2 border-accentBlue-500/50 pl-2">
            "{quote}"
          </p>
        </div>

        {/* AI Overview Box */}
        <div className="w-full lg:max-w-xl bg-gradient-to-r from-accentBlue-950/40 to-slate-900/60 border border-accentBlue-800/30 p-4 rounded-2xl flex gap-3 shadow-premium items-start">
          <div className="h-8 w-8 rounded-lg bg-accentBlue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-accentBlue-500/20">
            <Sparkles className="w-4 h-4 text-accentBlue-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] uppercase font-bold text-accentBlue-400 tracking-wider flex items-center gap-1.5">
              DUODO AI Sentiment Summary
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              {aiMarketSummary}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Index Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview.indices.map((ind) => {
          const isUp = ind.change >= 0;
          return (
            <div 
              key={ind.symbol} 
              onClick={() => navigate(`/pulse?s=${ind.symbol === 'SPY' ? 'SPY' : ind.symbol === 'QQQ' ? 'QQQ' : ind.symbol}`)}
              className="glass-card hover:border-slate-700/60 p-4.5 rounded-2xl border border-slate-800/40 shadow-premium transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{ind.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isUp 
                    ? 'bg-accentEmerald-500/10 text-accentEmerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {ind.symbol}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-white tracking-tight">${ind.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <span className={`text-xs font-semibold flex items-center ${isUp ? 'text-accentEmerald-400' : 'text-red-400'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {isUp ? '+' : ''}{ind.change_percent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Chart & Fear/Greed Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Price Chart */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col h-96">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-accentBlue-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-accentBlue-400" />
              </span>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  S&P 500 Index Chart <span className="text-xs text-slate-500 font-normal">({spyCurrent.symbol})</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold mt-0.5">
                  ${spyCurrent.price.toFixed(2)} 
                  <span className={`ml-2 ${spyCurrent.change >= 0 ? 'text-accentEmerald-400' : 'text-red-400'}`}>
                    {spyCurrent.change >= 0 ? '+' : ''}{spyCurrent.change_percent.toFixed(2)}%
                  </span>
                </span>
              </div>
            </div>
            {/* Period Selector */}
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
              {['5d', '1mo', '3mo'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1.5 rounded-md transition-colors uppercase ${
                    selectedPeriod === p ? 'bg-accentBlue-600 text-white shadow-premium' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 w-full min-h-0">
            {chartLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-slate-600 border-t-accentBlue-400 rounded-full animate-spin" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
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
                    stroke="#2563EB" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
                No historical charting data loaded.
              </div>
            )}
          </div>
        </div>

        {/* Market Mood Meter */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col h-96">
          <div className="flex items-center gap-3 border-b border-slate-800/40 pb-4 mb-4">
            <span className="h-8 w-8 rounded-lg bg-accentEmerald-500/10 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-accentEmerald-400" />
            </span>
            <div>
              <h3 className="text-sm font-bold">Market Mood Meter</h3>
              <span className="text-xs text-slate-400 mt-0.5">Aggregated market sentiment</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* SVG Meter Gauge */}
            <div className="w-48 h-24 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                {/* Arc Background */}
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke="#1E293B" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                />
                {/* Colored segments markers */}
                <path 
                  d="M 10 50 A 40 40 0 0 1 40 22" 
                  fill="none" 
                  stroke="#EF4444" 
                  strokeWidth="8" 
                />
                <path 
                  d="M 40 22 A 40 40 0 0 1 60 22" 
                  fill="none" 
                  stroke="#EAB308" 
                  strokeWidth="8" 
                />
                <path 
                  d="M 60 22 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="8" 
                />
                
                {/* Dial Hand */}
                {/* Hand rotation is between 0 and 180 degrees */}
                {/* 50 -> 90deg, 0 -> 0deg, 100 -> 180deg */}
                <g transform={`rotate(${(overview.mood_value / 100) * 180}, 50, 50)`}>
                  <line 
                    x1="50" 
                    y1="50" 
                    x2="15" 
                    y2="50" 
                    stroke="#3B82F6" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                  <circle cx="50" cy="50" r="3" fill="#3B82F6" />
                </g>
              </svg>
            </div>
            
            {/* Label Display */}
            <div className="text-center mt-4">
              <h4 className="text-3xl font-extrabold text-white tracking-tight">{overview.mood_value}</h4>
              <span className={`text-xs font-bold uppercase tracking-wider ${mood.color}`}>
                {mood.text}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-xl text-center text-xs text-slate-400">
            Social Boards, blogs and indices lean bullish. News publishers indicate protective cash holdings.
          </div>
        </div>
      </div>

      {/* 4. Gainers, Losers, and Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Gainers */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-accentEmerald-400">
            <TrendingUp className="w-4 h-4" /> Top Gainers
          </h3>
          <div className="space-y-3">
            {overview.top_gainers.map((stock) => (
              <div 
                key={stock.symbol} 
                onClick={() => navigate(`/pulse?s=${stock.symbol}`)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-900/40 transition-colors border border-slate-800/20 cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-extrabold text-slate-200">{stock.symbol}</span>
                  <span className="text-[10px] text-slate-500">{stock.name}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-200">${stock.price.toFixed(2)}</span>
                  <span className="text-[10px] font-semibold text-accentEmerald-400">+{stock.change_percent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-red-400">
            <TrendingDown className="w-4 h-4" /> Top Losers
          </h3>
          <div className="space-y-3">
            {overview.top_losers.map((stock) => (
              <div 
                key={stock.symbol} 
                onClick={() => navigate(`/pulse?s=${stock.symbol}`)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-900/40 transition-colors border border-slate-800/20 cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-extrabold text-slate-200">{stock.symbol}</span>
                  <span className="text-[10px] text-slate-500">{stock.name}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-200">${stock.price.toFixed(2)}</span>
                  <span className="text-[10px] font-semibold text-red-400">{stock.change_percent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Heatmap / Overview */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-200">
            <Flame className="w-4 h-4 text-orange-400" /> Sector Analysis
          </h3>
          <div className="grid grid-cols-2 gap-3 flex-1 mb-2">
            {sectors.map((sec) => (
              <div key={sec.name} className="bg-slate-900/40 border border-slate-800/40 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 truncate">{sec.name}</span>
                <span className={`text-xs font-bold mt-2 ${sec.up ? 'text-accentEmerald-400' : 'text-red-400'}`}>
                  {sec.up ? '+' : ''}{sec.change.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Latest Market News */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800/40">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-accentBlue-400" /> Latest Market Intelligence
          </h3>
          <button 
            onClick={() => navigate('/pulse')}
            className="text-[10px] font-bold text-accentBlue-400 hover:text-accentBlue-500 flex items-center"
          >
            Explore News <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.market_news.map((item, idx) => (
            <div 
              key={idx} 
              className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{item.publisher}</span>
                  <span className="text-[9px] text-slate-500">{new Date(item.published_at).toLocaleDateString()}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug mb-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-900/40">
                <span className="text-[9px] bg-accentBlue-500/10 text-accentBlue-400 px-2 py-0.5 rounded font-bold uppercase">
                  News Index
                </span>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-accentBlue-400 hover:underline"
                >
                  Read Source
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
