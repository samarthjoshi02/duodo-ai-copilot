import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Smile, 
  Frown, 
  Layers, 
  HelpCircle,
  Newspaper,
  Sparkles
} from 'lucide-react';

import { marketApi } from '../services/api';

export const TrendingPage: React.FC = () => {
  const navigate = useNavigate();

  // Query general overview data
  const { data: overview, isLoading } = useQuery({
    queryKey: ['marketOverview'],
    queryFn: marketApi.getOverview
  });

  const trendingTopics = [
    { topic: 'Fed Policy Softening', volume: '184.2K mentions', delta: '+12%' },
    { topic: 'Blackwell Yield solidifying', volume: '95.6K mentions', delta: '+44%' },
    { topic: 'EU Digital Markets Act', volume: '72.4K mentions', delta: '+18%' },
    { topic: 'Crude Stockpile Cuts', volume: '48.9K mentions', delta: '-4%' },
  ];

  const trendingSectors = [
    { name: 'Technology', momentum: 'Strong Bullish', change: '+1.88%', fill: 'bg-accentEmerald-500/10 text-accentEmerald-400 border-accentEmerald-500/20' },
    { name: 'Communication Services', momentum: 'Bullish', change: '+1.45%', fill: 'bg-accentEmerald-500/10 text-accentEmerald-400 border-accentEmerald-500/20' },
    { name: 'Financials', momentum: 'Neutral Stance', change: '+0.42%', fill: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    { name: 'Healthcare', momentum: 'Consolidating', change: '-0.12%', fill: 'bg-slate-800 text-slate-400 border-slate-700/40' },
    { name: 'Energy', momentum: 'Bearish Stance', change: '-0.95%', fill: 'bg-red-500/10 text-red-400 border-red-500/20' },
  ];

  if (isLoading || !overview) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-slate-800/40 w-64 rounded-xl shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-800/30 rounded-2xl shimmer border border-slate-900" />
          <div className="h-80 bg-slate-800/30 rounded-2xl shimmer border border-slate-900" />
        </div>
      </div>
    );
  }

  // Simulate Positive & Negative Sentiment sorting for news items
  const positiveNews = overview.market_news.slice(0, 3);
  const negativeNews = overview.market_news.slice(3, 6);

  // If there are less than 6 news, we double-list or use mocks
  const mockNegatives = negativeNews.length > 0 ? negativeNews : [
    {
      title: "Global Supply Bottlenecks Threaten Advanced Node Chip Shipments",
      publisher: "Reuters",
      summary: "Foundry constraints and raw mineral shortages could limit assembly run rates for high-performance servers in the fourth quarter.",
      url: "#",
      published_at: new Date().toISOString()
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white leading-none">Trending Pulse</h1>
        <p className="text-xs text-slate-400 mt-1.5">
          Real-time analysis of what is driving current market sentiment.
        </p>
      </div>

      {/* 1. Trending Stocks & Sectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Stocks */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-200">
            <Flame className="w-4 h-4 text-orange-400" /> Hot Ticker Sentiment
          </h3>
          <div className="space-y-3">
            {overview.trending.map((stock, i) => {
              const isUp = stock.change_percent >= 0;
              // Simulate sentiment tags
              const sentimentLabel = isUp ? 'Bullish' : 'Bearish';
              return (
                <div 
                  key={stock.symbol}
                  onClick={() => navigate(`/pulse?s=${stock.symbol}`)}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-900/40 transition-colors border border-slate-850 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-900">
                      {i + 1}
                    </span>
                    <div>
                      <span className="block text-xs font-extrabold text-slate-200 group-hover:text-accentBlue-400 transition-colors">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] text-slate-500">{stock.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="block text-xs font-bold text-slate-200">${stock.price.toFixed(2)}</span>
                      <span className={`text-[10px] font-semibold ${isUp ? 'text-accentEmerald-400' : 'text-red-400'}`}>
                        {isUp ? '+' : ''}{stock.change_percent.toFixed(2)}%
                      </span>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2.5 py-1.5 rounded border ${
                      isUp 
                        ? 'bg-accentEmerald-500/10 text-accentEmerald-400 border-accentEmerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {sentimentLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sector Momentum */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-200">
            <Layers className="w-4 h-4 text-accentBlue-400" /> Sector Momentum
          </h3>
          <div className="space-y-3.5">
            {trendingSectors.map((sec) => (
              <div key={sec.name} className="flex items-center justify-between p-2.5 border-b border-slate-850/40 last:border-0">
                <div>
                  <span className="block text-xs font-bold text-slate-200">{sec.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 inline-block">{sec.change} price rate</span>
                </div>
                <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded border ${sec.fill}`}>
                  {sec.momentum}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Trending Topics Grid */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-200">
          <Sparkles className="w-4 h-4 text-accentBlue-400" /> Spiking Media Topics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingTopics.map((topic, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-200">{topic.topic}</span>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/20 text-[10px] text-slate-400">
                <span>{topic.volume}</span>
                <span className={topic.delta.startsWith('+') ? 'text-accentEmerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {topic.delta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. News sentiment split (Bullish vs Bearish) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest Positive Sentiment */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-accentEmerald-400">
            <Smile className="w-4.5 h-4.5" /> Highest Positive Sentiment News
          </h3>
          <div className="space-y-3">
            {positiveNews.map((item, idx) => (
              <div key={idx} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1.5">
                    <span className="font-bold text-slate-400 uppercase">{item.publisher}</span>
                    <span>94% Bullish</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 line-clamp-1 mb-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.summary}</p>
                </div>
                <div className="flex justify-end mt-2">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-accentBlue-400 hover:underline">
                    Read Source
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highest Negative Sentiment */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-red-400">
            <Frown className="w-4.5 h-4.5" /> Highest Negative Sentiment News
          </h3>
          <div className="space-y-3">
            {mockNegatives.map((item, idx) => (
              <div key={idx} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1.5">
                    <span className="font-bold text-slate-400 uppercase">{item.publisher}</span>
                    <span className="text-red-400 font-semibold">82% Bearish</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 line-clamp-1 mb-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.summary}</p>
                </div>
                <div className="flex justify-end mt-2">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-accentBlue-400 hover:underline">
                    Read Source
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
