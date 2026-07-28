import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderHeart, Search, Trash2, ArrowRight, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { watchlistApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const WatchlistPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Query Watchlist symbols and values
  const { data: list, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.get,
    enabled: !!user
  });

  const removeMutation = useMutation({
    mutationFn: (sym: string) => watchlistApi.remove(sym),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  const handleAddQuick = (sym: string) => {
    watchlistApi.add(sym).then(() => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-slate-800/40 w-64 rounded-xl shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-28 bg-slate-800/30 rounded-2xl shimmer" />
          <div className="h-28 bg-slate-800/30 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  const watchlistItems = list || [];
  const filteredItems = watchlistItems.filter(item => 
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const suggestedStocks = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">Favorite Watchlist</h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Monitor real-time prices for your bookmarked assets.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 pl-9 pr-4 py-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-accentBlue-500 w-full"
          />
        </div>
      </div>

      {/* Grid items */}
      {watchlistItems.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 rounded-2xl border border-slate-800/40 flex flex-col items-center justify-center max-w-lg mx-auto">
          <FolderHeart className="w-12 h-12 mb-3 opacity-40 text-accentBlue-400" />
          <h3 className="text-sm font-bold text-slate-300">Watchlist is Empty</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed mb-6">
            Search and add symbols to start tracking them. Or choose from these popular assets:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedStocks.map(s => (
              <button
                key={s}
                onClick={() => handleAddQuick(s)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center p-12 text-slate-500">No matching search items.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isUp = item.change >= 0;
            return (
              <div 
                key={item.symbol}
                className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col justify-between hover:border-slate-700/60 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div 
                    onClick={() => navigate(`/pulse?s=${item.symbol}`)}
                    className="flex flex-col cursor-pointer group"
                  >
                    <span className="text-sm font-extrabold text-slate-100 group-hover:text-accentBlue-400 transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(item.symbol)}
                    className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-slate-900/60 rounded-lg transition-colors"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-6 pt-4 border-t border-slate-800/20">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white tracking-tight">${item.price.toFixed(2)}</span>
                    <span className={`text-[10px] font-semibold flex items-center mt-0.5 ${isUp ? 'text-accentEmerald-400' : 'text-red-400'}`}>
                      {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                      {isUp ? '+' : ''}{item.change_percent.toFixed(2)}%
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate(`/pulse?s=${item.symbol}`)}
                    className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold px-3.5 py-2 rounded-xl text-slate-300 hover:text-white transition-all"
                  >
                    Analysis <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
