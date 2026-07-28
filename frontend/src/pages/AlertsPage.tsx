import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, Trash2, Plus, AlertCircle, HelpCircle, Activity, Sparkles } from 'lucide-react';
import { alertsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [symbol, setSymbol] = useState('');
  const [alertType, setAlertType] = useState('sentiment_above');
  const [threshold, setThreshold] = useState('80');

  // Query alerts list
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.get,
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: () => alertsApi.create(symbol.toUpperCase().trim ? symbol.toUpperCase().trim() : symbol.toUpperCase(), alertType, parseFloat(threshold)),
    onSuccess: () => {
      setSymbol('');
      setThreshold('80');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => alertsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol && threshold) {
      createMutation.mutate();
    }
  };

  const getAlertLabel = (type: string, th: number) => {
    if (type === 'sentiment_above') return `AI Sentiment exceeds ${th}%`;
    if (type === 'sentiment_below') return `AI Sentiment falls below ${th}%`;
    return `AI Sentiment changes by ${th}%`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-slate-800/40 w-64 rounded-xl shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 bg-slate-800/30 rounded-2xl shimmer" />
          <div className="h-40 bg-slate-800/30 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  const alertItems = alerts || [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white leading-none">Market Alerts</h1>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          Configure real-time notifications on sentiment volatility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Alert panel */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium h-fit">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-accentBlue-400" /> Create Sentiment Alert
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-400 mb-1">Stock Symbol</label>
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
              <label className="block text-slate-400 mb-1">Trigger Condition</label>
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
              <label className="block text-slate-400 mb-1">Threshold (%)</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-slate-200"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-accentBlue-600 hover:bg-accentBlue-700 text-white font-bold py-3 rounded-xl transition-all shadow-premium-glow flex items-center justify-center gap-1.5 mt-2"
            >
              <BellRing className="w-4 h-4" /> Create Alert
            </button>
          </form>
        </div>

        {/* Alerts List */}
        <div className="md:col-span-2 glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 border-b border-slate-850/40 pb-3">
              <BellRing className="w-4 h-4 text-accentBlue-400" /> Active Alert Triggers ({alertItems.length})
            </h3>
            
            {alertItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
                <AlertCircle className="w-10 h-10 mb-2 opacity-40 text-slate-600" />
                <span className="text-xs">No active alerts configured. Create one on the left.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {alertItems.map((alert) => (
                  <div 
                    key={alert.id}
                    className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-white bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-900">
                        {alert.stock_symbol}
                      </span>
                      <div>
                        <span className="block text-xs font-semibold text-slate-200">
                          {getAlertLabel(alert.alert_type, alert.threshold)}
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5 inline-block">
                          Set: {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteMutation.mutate(alert.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-slate-900/60 rounded-lg transition-colors"
                      title="Delete Alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
