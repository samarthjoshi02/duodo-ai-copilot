import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart3, TrendingUp, Cpu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Real-time News Sentiment Analysis",
      description: "Analyze thousands of news headers and social conversations in a blink to extract exact market vibes.",
      icon: BarChart3
    },
    {
      title: "Conversational Market Copilot",
      description: "Ask why Tesla is surging, compare balance sheets, or request alerts using simple natural language.",
      icon: Cpu
    },
    {
      title: "Risk Hedging & Portfolio Scoring",
      description: "Upload holdings to dynamically analyze risk scores and calculate sector concentration ratings.",
      icon: TrendingUp
    }
  ];

  // Rotate marketing carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (e) {
      console.error("Login failure:", e);
    }
  };

  return (
    <div className="min-h-screen bg-darkNavy-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Left Column: Visual Carousel Panel */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-darkNavy-900 to-darkNavy-950 border-r border-slate-900 relative overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-accentBlue-500/10 rounded-full blur-[80px]" />

        {/* Brand */}
        <div className="flex items-center gap-2 z-10">
          <div className="h-8 w-8 rounded bg-gradient-to-tr from-accentBlue-600 to-accentEmerald-500 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-bold tracking-wider text-white">DUODO</span>
        </div>

        {/* Carousel Content */}
        <div className="my-auto max-w-sm z-10 select-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {React.createElement(slides[activeSlide].icon, {
                className: "h-10 w-10 text-accentBlue-400 mb-2"
              })}
              <h2 className="text-2xl font-black leading-tight text-white">
                {slides[activeSlide].title}
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                {slides[activeSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex gap-2.5 mt-8">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === i ? 'w-6 bg-accentBlue-500' : 'w-2.5 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <span className="text-[10px] text-slate-600 z-10">
          DUODO © 2026. Made with Google Gemini AI.
        </span>
      </div>

      {/* Right Column: Sign In Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-accentEmerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-sm flex flex-col text-center">
          <div className="md:hidden flex justify-center mb-6">
            <div className="h-10 w-10 rounded bg-gradient-to-tr from-accentBlue-600 to-accentEmerald-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2">Welcome to DUODO</h2>
          <p className="text-xs text-slate-400 mb-8 max-w-xs mx-auto">
            Analyze market sentiment, track portfolio analytics, and query our conversational co-pilot.
          </p>

          {/* Sign In Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/60 text-slate-200 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-3 group relative shadow-premium disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-500 border-t-accentBlue-400 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    style={{ fill: '#4285F4' }}
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    style={{ fill: '#34A853' }}
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    style={{ fill: '#FBBC05' }}
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    style={{ fill: '#EA4335' }}
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
          
          <span className="text-[10px] text-slate-500 mt-6 block">
            We support persistent sessions. No mock credentials.
          </span>
        </div>
      </div>
    </div>
  );
};
