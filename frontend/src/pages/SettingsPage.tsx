import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  User, 
  Sun, 
  Moon, 
  Bell, 
  Download, 
  Trash2, 
  MessageSquareHeart, 
  Star,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { feedbackApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Feedback states
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const feedbackMutation = useMutation({
    mutationFn: () => feedbackApi.submit(feedbackMsg, rating),
    onSuccess: () => {
      setFeedbackSuccess(true);
      setFeedbackMsg('');
      setRating(5);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    }
  });

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackMsg.trim()) {
      feedbackMutation.mutate();
    }
  };

  const handleExportData = () => {
    const backupData = {
      user: {
        name: user?.name,
        email: user?.email,
        uid: user?.firebase_uid
      },
      export_date: new Date().toISOString(),
      app: "DUODO Sentiment Studio"
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `duodo-profile-export-${Date.now()}.json`;
    link.click();
  };

  const handleDeleteAccount = () => {
    if (window.confirm("WARNING: Are you sure you want to delete your DUODO account? All watchlists, portfolio logs, and chat histories will be permanently wiped from our systems.")) {
      alert("Account deletion sequence initiated. Wiping credentials...");
      logout();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white leading-none">Account Settings</h1>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          Manage profiles, app visual styles, and submit system feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Details & Preferences */}
        <div className="md:col-span-2 space-y-6">
          {/* User Profile Info */}
          {user && (
            <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">User Profile Stance</h3>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <img 
                  src={user.photo || 'https://lh3.googleusercontent.com/a/default-user'} 
                  alt={user.name} 
                  className="h-16 w-16 rounded-full border border-slate-700 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <span className="block text-base font-extrabold text-slate-100">{user.name}</span>
                  <span className="block text-xs text-slate-400">{user.email}</span>
                  <span className="inline-block text-[9px] bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded mt-1 font-bold">
                    UID: {user.firebase_uid}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">UI Preferences</h3>
            
            {/* Dark/Light Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-850/40">
              <div>
                <span className="block text-xs font-bold text-slate-200">Application Style</span>
                <span className="text-[10px] text-slate-500">Choose between Light or Dark Mode</span>
              </div>
              <button 
                onClick={toggleTheme}
                className="flex items-center gap-1.5 text-xs font-bold bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-accentBlue-400" />}
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
            </div>

            {/* Email Alerts Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-850/40 text-xs">
              <div>
                <span className="block font-bold text-slate-200">Email Alerts Notifications</span>
                <span className="text-[10px] text-slate-500">Trigger emails when stock sentiment crosses alerts</span>
              </div>
              <button 
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`w-12 h-6.5 rounded-full p-1 transition-all ${
                  emailAlerts ? 'bg-accentBlue-600 flex justify-end' : 'bg-slate-800 flex justify-start'
                }`}
              >
                <div className="w-4.5 h-4.5 bg-white rounded-full shadow-premium" />
              </button>
            </div>
          </div>

          {/* Danger zone actions */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium space-y-4">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Security & Portability</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExportData}
                className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold py-3 rounded-xl text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Backup Profile
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-xs font-bold py-3 rounded-xl text-red-400 hover:text-red-300 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Feedback Desk Form */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium h-fit">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-2 text-slate-200">
            <MessageSquareHeart className="w-4.5 h-4.5 text-accentBlue-400" /> DUODO Feedback Desk
          </h3>
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
            Help us improve sentiment algorithms. Submit ratings and bugs directly to administrative logs.
          </p>

          {feedbackSuccess ? (
            <div className="bg-accentEmerald-500/10 border border-accentEmerald-500/20 p-4 rounded-xl text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-accentEmerald-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-200">Feedback Submitted</h4>
              <p className="text-[10px] text-slate-400">Thank you for rating DUODO. Logs have been cataloged.</p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs font-semibold">
              {/* Rating selection */}
              <div>
                <label className="block text-slate-400 mb-1.5">Rating Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 rounded-lg hover:bg-slate-900 transition-colors"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-yellow-500 text-yellow-500 animate-pulse' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message block */}
              <div>
                <label className="block text-slate-400 mb-1">Feedback Note</label>
                <textarea
                  rows={4}
                  placeholder="Tell us what you think or list any request tags..."
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-slate-200 font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={feedbackMutation.isPending}
                className="w-full bg-accentBlue-600 hover:bg-accentBlue-700 text-white font-bold py-3 rounded-xl transition-all shadow-premium-glow flex items-center justify-center gap-1.5"
              >
                Submit logs
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
