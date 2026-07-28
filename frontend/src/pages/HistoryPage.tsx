import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Sparkles, AlertTriangle, ChevronDown, ChevronUp, MessageSquare, Download } from 'lucide-react';
import { copilotApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Query chat history
  const { data: history, isLoading } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: copilotApi.getHistory,
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-slate-800/40 w-64 rounded-xl shimmer" />
        <div className="space-y-4">
          <div className="h-20 bg-slate-800/30 rounded-2xl shimmer" />
          <div className="h-20 bg-slate-800/30 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  const historyItems = history || [];

  const handleExport = () => {
    if (historyItems.length === 0) return;
    
    let csv = 'Timestamp,Question,Answer,Sentiment,Confidence\n';
    historyItems.forEach((h: any) => {
      const q = `"${h.question.replace(/"/g, '""')}"`;
      const a = `"${h.answer.replace(/"/g, '""')}"`;
      const s = h.sentiment_data ? h.sentiment_data.sentiment : '';
      const c = h.sentiment_data ? h.sentiment_data.confidence : '';
      csv += `${new Date(h.timestamp).toISOString()},${q},${a},${s},${c}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `duodo_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">Copilot History</h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Review previous AI analytical reports and search threads.
          </p>
        </div>
        {historyItems.length > 0 && (
          <button
            onClick={handleExport}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-premium flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {historyItems.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 rounded-2xl border border-slate-800/40 flex flex-col items-center justify-center">
          <History className="w-12 h-12 mb-3 opacity-40 text-accentBlue-400" />
          <h3 className="text-sm font-bold text-slate-300">No Query Logs</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Your previous conversation threads with the AI Copilot will be logged here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div 
                key={item.id}
                className="glass-card rounded-2xl border border-slate-800/40 shadow-premium overflow-hidden transition-all duration-200"
              >
                {/* Header click bar */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-900/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-slate-200 leading-snug truncate max-w-[220px] sm:max-w-[400px]">
                        {item.question}
                      </span>
                      <span className="text-[9px] text-slate-500 mt-0.5 inline-block">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {/* Expanded Answer Body */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-850 pt-4 space-y-4 text-xs">
                    <div>
                      <p className="text-slate-300 leading-relaxed font-medium bg-slate-950/20 p-3 rounded-xl border border-slate-900/40">
                        {item.answer}
                      </p>
                    </div>

                    {item.sentiment_data && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Sentiment details */}
                        <div className="bg-slate-900/40 border border-slate-850 p-3.5 rounded-xl">
                          <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Sentiment stance</span>
                          <span className={`text-xs font-bold ${
                            item.sentiment_data.sentiment === 'Bullish' ? 'text-accentEmerald-400' : item.sentiment_data.sentiment === 'Bearish' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {item.sentiment_data.sentiment} ({item.sentiment_data.confidence}%)
                          </span>
                        </div>

                        {/* Related Stocks */}
                        <div className="bg-slate-900/40 border border-slate-850 p-3.5 rounded-xl">
                          <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1.5">Related Stocks</span>
                          <div className="flex flex-wrap gap-1">
                            {item.sentiment_data.related_stocks.map(sym => (
                              <span 
                                key={sym} 
                                className="bg-slate-800 border border-slate-700/60 text-[9px] font-bold px-1.5 py-0.5 rounded text-slate-300"
                              >
                                {sym}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Risks */}
                        <div className="sm:col-span-2 bg-red-950/10 border border-red-500/10 p-3.5 rounded-xl">
                          <span className="text-[9px] text-red-400 uppercase font-bold flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Key Risk Factors
                          </span>
                          <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[10px] leading-relaxed">
                            {item.sentiment_data.risks.map((risk, i) => (
                              <li key={i}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
