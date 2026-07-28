import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Compass, Users, MessageSquareHeart, FolderHeart, Activity, Star } from 'lucide-react';
import { adminApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();

  // Query stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getAnalytics,
    enabled: !!user
  });

  // Query feedback records
  const { data: feedbacks, isLoading: feedbackLoading } = useQuery({
    queryKey: ['adminFeedbacks'],
    queryFn: adminApi.getFeedback,
    enabled: !!user
  });

  if (statsLoading || feedbackLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-slate-800/40 w-64 rounded-xl shimmer" />
        <div className="grid grid-cols-4 gap-4">
          <div className="h-20 bg-slate-800/30 rounded-xl shimmer" />
          <div className="h-20 bg-slate-800/30 rounded-xl shimmer" />
          <div className="h-20 bg-slate-800/30 rounded-xl shimmer" />
          <div className="h-20 bg-slate-800/30 rounded-xl shimmer" />
        </div>
      </div>
    );
  }

  const counters = [
    { name: 'Active User Profiles', value: stats?.user_count || 0, icon: Users, color: 'text-accentBlue-400' },
    { name: 'Aggregated Feedback Logs', value: stats?.feedback_count || 0, icon: MessageSquareHeart, color: 'text-accentEmerald-400' },
    { name: 'Watchlist Items Count', value: stats?.watchlist_count || 0, icon: FolderHeart, color: 'text-violet-400' },
    { name: 'Copilot Chat Operations', value: stats?.chat_count || 0, icon: Activity, color: 'text-orange-400' }
  ];

  const feedbackList = feedbacks || [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white leading-none">Admin Telemetry Console</h1>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          Monitor system metrics, watch lists volume, and user feedback logs.
        </p>
      </div>

      {/* 1. Telemetry Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {counters.map((c, idx) => (
          <div key={idx} className="glass-card p-4.5 rounded-2xl border border-slate-800/40 shadow-premium flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">{c.name}</span>
              <span className="block text-2xl font-black text-white tracking-tight mt-1">{c.value}</span>
            </div>
            <c.icon className={`h-8 w-8 ${c.color} opacity-80`} />
          </div>
        ))}
      </div>

      {/* 2. Feedback desk logs Table */}
      <div className="glass-card rounded-2xl border border-slate-800/40 shadow-premium overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/40 bg-slate-950/40">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <MessageSquareHeart className="w-4 h-4 text-accentEmerald-400" /> Cataloged User Reviews
          </h3>
        </div>

        {feedbackList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-semibold">
            No feedback entries logged in the database yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850/60 text-slate-500 font-bold bg-slate-900/10 uppercase text-[9px] tracking-wider">
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Message</th>
                  <th className="px-5 py-3.5 text-center">Score</th>
                  <th className="px-5 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40 font-medium text-slate-300">
                {feedbackList.map((fb) => (
                  <tr key={fb.id} className="hover:bg-slate-900/15 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={fb.user_photo || 'https://lh3.googleusercontent.com/a/default-user'} 
                          alt={fb.user_name} 
                          className="h-8.5 w-8.5 rounded-full border border-slate-800 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col">
                          <span className="text-slate-200 font-extrabold">{fb.user_name}</span>
                          <span className="text-[10px] text-slate-500">{fb.user_email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-medium leading-relaxed max-w-sm">
                      {fb.message}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < fb.rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-700'}`} 
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-500 font-bold text-[10px]">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
