import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Layers,
  PieChart as PieIcon,
  HelpCircle,
  Download
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { portfolioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');

  // Fetch Portfolio details
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: portfolioApi.get,
    enabled: !!user
  });

  const addMutation = useMutation({
    mutationFn: () => portfolioApi.add(symbol.toUpperCase().trim(), parseFloat(quantity), parseFloat(avgPrice)),
    onSuccess: () => {
      setShowAddModal(false);
      setSymbol('');
      setQuantity('');
      setAvgPrice('');
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: (sym: string) => portfolioApi.remove(sym),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol && quantity && avgPrice) {
      addMutation.mutate();
    }
  };

  const handleRemove = (sym: string) => {
    if (window.confirm(`Delete holdings for ${sym}?`)) {
      removeMutation.mutate(sym);
    }
  };

  const handleExport = () => {
    if (!portfolio || !portfolio.holdings.length) return;
    
    let csv = 'Symbol,Name,Quantity,AvgPrice,CurrentPrice,NetValue,ProfitLoss,AllocationPct\n';
    portfolio.holdings.forEach((h: any) => {
      csv += `${h.stock_symbol},${h.name},${h.quantity},${h.avg_price},${h.current_price},${h.current_value},${h.profit_loss},${h.allocation_pct}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `duodo_portfolio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-slate-800/40 w-64 rounded-xl shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-800/30 rounded-2xl shimmer" />
          <div className="h-96 bg-slate-800/30 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  // Predefined harmonious color chart tags
  const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];

  const holdings = portfolio?.holdings || [];
  const allocations = portfolio?.allocations || [];
  const sectorAllocations = portfolio?.sector_allocations || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">Portfolio Studio</h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Track asset pricing, allocation weights, and AI risk analysis.
          </p>
        </div>

        <div className="flex gap-2">
          {holdings.length > 0 && (
            <button
              onClick={handleExport}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-premium flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-accentBlue-600 hover:bg-accentBlue-700 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all shadow-premium-glow flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </div>
      </div>

      {/* 1. Value Indicators row */}
      {portfolio && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Asset Value */}
          <div className="glass-card p-4.5 rounded-2xl border border-slate-800/40 shadow-premium">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">Portfolio Asset Value</span>
            <span className="block text-2xl font-black text-white tracking-tight mt-1">
              ${portfolio.portfolio_value.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </span>
          </div>

          {/* Cost Basis */}
          <div className="glass-card p-4.5 rounded-2xl border border-slate-800/40 shadow-premium">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">Total Cost Basis</span>
            <span className="block text-2xl font-black text-white tracking-tight mt-1">
              ${portfolio.cost_basis.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </span>
          </div>

          {/* Profits & Losses */}
          <div className="glass-card p-4.5 rounded-2xl border border-slate-800/40 shadow-premium">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">Net Profit / Loss</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black tracking-tight ${portfolio.total_profit_loss >= 0 ? 'text-accentEmerald-400' : 'text-red-400'}`}>
                ${portfolio.total_profit_loss.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
              <span className={`text-xs font-bold flex items-center ${portfolio.total_profit_loss >= 0 ? 'text-accentEmerald-400' : 'text-red-400'}`}>
                {portfolio.total_profit_loss >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                {portfolio.total_profit_loss >= 0 ? '+' : ''}{portfolio.total_profit_loss_pct.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* AI Portfolio Sentiment */}
          <div className="glass-card p-4.5 rounded-2xl border border-slate-800/40 shadow-premium">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">AI Sentiment Index</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black tracking-tight ${
                portfolio.portfolio_sentiment === 'Bullish' ? 'text-accentEmerald-400 glow-green' : portfolio.portfolio_sentiment === 'Bearish' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {portfolio.portfolio_sentiment}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Score: {portfolio.portfolio_sentiment_score.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Charts and AI analysis summary */}
      {portfolio && holdings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Allocation Chart */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col h-80">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-200 border-b border-slate-800/40 pb-3">
              <PieIcon className="w-4 h-4 text-accentBlue-400" /> Share Allocation
            </h3>
            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocations}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="symbol"
                  >
                    {allocations.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(val: any) => [`$${parseFloat(val).toFixed(2)}`, 'Allocation']}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sector Concentration Chart */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col h-80">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-slate-200 border-b border-slate-800/40 pb-3">
              <Layers className="w-4 h-4 text-accentBlue-400" /> Sector Weighting
            </h3>
            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorAllocations}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="sector"
                  >
                    {sectorAllocations.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Auditor Stance */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col h-80 justify-between">
            <div className="flex items-center gap-3 border-b border-slate-800/40 pb-3">
              <span className="h-8 w-8 rounded-lg bg-accentBlue-500/10 flex items-center justify-center border border-accentBlue-500/20">
                <Sparkles className="w-4 h-4 text-accentBlue-400 animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm font-bold">AI Portfolio Audit Stance</h3>
                <span className="text-xs text-slate-400">Gemini risk score report</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Risk Factor</span>
                <span className="text-2xl font-black text-white">{portfolio.risk_score}/100</span>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${
                portfolio.risk_score < 40 
                  ? 'bg-accentEmerald-500/10 text-accentEmerald-400 border-accentEmerald-500/20' 
                  : portfolio.risk_score < 70 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {portfolio.risk_score < 40 ? 'Conservative' : portfolio.risk_score < 70 ? 'Moderate' : 'Speculative'}
              </span>
            </div>

            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-[10px] text-slate-400 leading-relaxed mt-2.5 flex-1 flex flex-col justify-center">
              <span className="font-bold text-slate-300 block mb-0.5">Gemini Advisory Stance</span>
              {portfolio.recommendation}
            </div>
          </div>
        </div>
      )}

      {/* 3. Holdings Grid Table */}
      <div className="glass-card rounded-2xl border border-slate-800/40 shadow-premium overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/40 bg-slate-950/40 flex items-center justify-between">
          <h3 className="text-sm font-bold">Share Holdings details</h3>
          <span className="text-xs text-slate-400 font-semibold">{holdings.length} Positions</span>
        </div>

        {holdings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <Layers className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-xs">No assets logged. Click "Add Asset" to start.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850/60 text-slate-500 font-bold bg-slate-900/10 uppercase text-[9px] tracking-wider">
                  <th className="px-5 py-3.5">Asset</th>
                  <th className="px-5 py-3.5">Qty</th>
                  <th className="px-5 py-3.5">Avg Cost</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Net Value</th>
                  <th className="px-5 py-3.5">P/L</th>
                  <th className="px-5 py-3.5">Weight</th>
                  <th className="px-5 py-3.5 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40 font-medium text-slate-300">
                {holdings.map((h, i) => {
                  const gain = h.profit_loss >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-slate-900/15 transition-colors">
                      <td className="px-5 py-4">
                        <div 
                          onClick={() => navigate(`/pulse?s=${h.stock_symbol}`)}
                          className="flex flex-col cursor-pointer group"
                        >
                          <span className="text-slate-100 font-extrabold group-hover:text-accentBlue-400 transition-colors">
                            {h.stock_symbol}
                          </span>
                          <span className="text-[10px] text-slate-500">{h.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{h.quantity}</td>
                      <td className="px-5 py-4">${h.avg_price.toFixed(2)}</td>
                      <td className="px-5 py-4">${h.current_price.toFixed(2)}</td>
                      <td className="px-5 py-4">${h.current_value.toFixed(2)}</td>
                      <td className={`px-5 py-4 ${gain ? 'text-accentEmerald-400' : 'text-red-400'}`}>
                        <div className="flex flex-col">
                          <span>${h.profit_loss.toFixed(2)}</span>
                          <span className="text-[9px] font-semibold">{gain ? '+' : ''}{h.profit_loss_pct.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{h.allocation_pct}%</td>
                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={() => handleRemove(h.stock_symbol)}
                          className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete holding"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Add Holdings Modal --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <form 
            onSubmit={handleAddSubmit}
            className="bg-darkNavy-900 border border-slate-800/80 p-6 rounded-2xl max-w-sm w-full z-10 shadow-premium relative"
          >
            <h3 className="text-base font-extrabold text-white mb-2">Record Asset Purchase</h3>
            <p className="text-[11px] text-slate-400 mb-4">Record asset quantities and average costs to configure allocations.</p>
            
            <div className="space-y-3.5 mb-6 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Stock Symbol</label>
                <input 
                  type="text" 
                  placeholder="e.g. TSLA" 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-slate-200" 
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Quantity (Shares)</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 15" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-slate-200" 
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Average Price ($)</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 175.40" 
                  value={avgPrice} 
                  onChange={(e) => setAvgPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-slate-200" 
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-slate-900 border border-slate-800 py-2.5 rounded-xl text-slate-400 font-bold text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={addMutation.isPending}
                className="flex-1 bg-accentBlue-600 hover:bg-accentBlue-700 text-white py-2.5 rounded-xl font-bold text-xs disabled:opacity-50"
              >
                Log Shares
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
