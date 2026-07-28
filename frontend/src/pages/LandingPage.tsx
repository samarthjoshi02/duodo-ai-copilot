import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  BrainCircuit, 
  Gauge, 
  TrendingUp, 
  ShieldAlert, 
  Globe2, 
  MessageSquareText, 
  CheckCircle,
  HelpCircle,
  Plus,
  Minus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const startJourney = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const tickerStocks = [
    { symbol: 'AAPL', price: 182.50, change: 1.25, up: true },
    { symbol: 'TSLA', price: 175.40, change: 8.50, up: true },
    { symbol: 'MSFT', price: 415.60, change: -2.40, up: false },
    { symbol: 'NVDA', price: 875.12, change: 15.30, up: true },
    { symbol: 'AMZN', price: 178.15, change: 0.45, up: true },
    { symbol: 'GOOGL', price: 151.60, change: -0.80, up: false },
    { symbol: 'META', price: 505.30, change: 4.10, up: true },
    { symbol: 'NFLX', price: 610.50, change: -12.10, up: false }
  ];

  const features = [
    {
      title: 'AI Copilot Chat',
      desc: 'Engage with our AI using natural language to answer complex financial queries and analyze sector sentiment.',
      icon: BrainCircuit,
      color: 'from-blue-500/20 to-indigo-500/20'
    },
    {
      title: 'Market Mood Meter',
      desc: 'Real-time aggregated Fear & Greed index extracted from major financial publishers and social forums.',
      icon: Gauge,
      color: 'from-emerald-500/20 to-teal-500/20'
    },
    {
      title: 'Trending Sentiment',
      desc: 'Spot assets experiencing momentum spikes or social volume expansion before the breakout occurs.',
      icon: TrendingUp,
      color: 'from-violet-500/20 to-fuchsia-500/20'
    },
    {
      title: 'Risk Guard & Alerts',
      desc: 'Set custom alerts to get notified when asset sentiment crosses risk parameters or specific thresholds.',
      icon: ShieldAlert,
      color: 'from-red-500/20 to-orange-500/20'
    },
    {
      title: 'News Intelligence',
      desc: 'Instantly summarize lengthy news reports and identify implicit bullish or bearish undertones.',
      icon: Globe2,
      color: 'from-sky-500/20 to-cyan-500/20'
    },
    {
      title: 'Explainable AI Insights',
      desc: 'Every AI output features detailed confidence percentages, supporting news links, and risk factors.',
      icon: MessageSquareText,
      color: 'from-amber-500/20 to-yellow-500/20'
    }
  ];

  const faqs = [
    {
      q: "How does DUODO analyze market sentiment?",
      a: "DUODO aggregates headlines, financial disclosures, and social board conversations in real time. It feeds this unstructured text through the Gemini AI API to determine sentiment tags (Bullish, Bearish, Neutral) and output exact confidence scores."
    },
    {
      q: "Can I connect my real stock broker?",
      a: "Currently, DUODO operates as a sentiment co-pilot and tracking portfolio dashboard. You can add holdings manually to view allocations, risks, and portfolio sentiment ratings."
    },
    {
      q: "Is there a mobile app?",
      a: "DUODO is a fully optimized progressive web app (PWA) that is responsive across smartphones, tablets, and desktops."
    },
    {
      q: "Does DUODO offer financial advice?",
      a: "No. DUODO is an analytical platform designed to organize sentiment data and news metadata using AI. All summaries represent technical estimations and should not be used as direct investment advice."
    }
  ];

  return (
    <div className="min-h-screen bg-darkNavy-950 text-slate-100 flex flex-col">
      {/* 1. Scrolling Stock Ticker */}
      <div className="bg-slate-950 border-b border-slate-900 py-2.5 ticker-wrap select-none">
        <div className="ticker-content flex items-center gap-12">
          {[...tickerStocks, ...tickerStocks].map((stock, i) => (
            <div key={i} className="inline-flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-400">{stock.symbol}</span>
              <span className="text-slate-200">${stock.price.toFixed(2)}</span>
              <span className={stock.up ? 'text-accentEmerald-400' : 'text-red-400'}>
                {stock.up ? '+' : ''}{stock.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Header */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between border-b border-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-accentBlue-600 to-accentEmerald-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-wider">DUODO</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={startJourney}
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <button 
            onClick={startJourney}
            className="bg-accentBlue-600 hover:bg-accentBlue-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all shadow-premium-glow flex items-center gap-1.5"
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative max-w-7xl mx-auto w-full px-6 pt-16 pb-20 flex flex-col lg:flex-row items-center gap-12 flex-1">
        {/* Decorative Background Blur */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accentBlue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-accentEmerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Hero Left Content */}
        <div className="flex-1 text-center lg:text-left z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 bg-accentBlue-500/10 border border-accentBlue-500/30 text-accentBlue-400 px-3 py-1 rounded-full text-xs font-semibold mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Market Intelligence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-6"
          >
            Decode Market Emotions.<br />
            <span className="bg-gradient-to-r from-accentBlue-400 to-accentEmerald-400 bg-clip-text text-transparent">
              Invest Smarter.
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg max-w-xl mb-8 leading-relaxed mx-auto lg:mx-0"
          >
            DUODO transforms financial news, filings, and community conversations into real-time market intelligence using state-of-the-art Artificial Intelligence.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <button
              onClick={startJourney}
              className="w-full sm:w-auto bg-gradient-to-r from-accentBlue-600 to-accentBlue-700 hover:from-accentBlue-500 hover:to-accentBlue-600 text-white font-bold px-7 py-4 rounded-xl transition-all shadow-premium-glow flex items-center justify-center gap-2 group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={startJourney}
              className="w-full sm:w-auto bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-slate-200 font-bold px-7 py-4 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              Try AI Copilot
            </button>
          </motion.div>
        </div>

        {/* Hero Right: Chart Animation */}
        <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card w-full p-6 rounded-2xl border border-slate-800/60 shadow-premium"
          >
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-accentBlue-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-accentBlue-400">AI</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold">NVDA Sentiment Stance</h4>
                  <span className="text-[10px] text-slate-500">AGGREGATED FROM 24 SOURCES</span>
                </div>
              </div>
              <span className="text-xs font-bold bg-accentEmerald-500/10 text-accentEmerald-400 px-2 py-0.5 rounded border border-accentEmerald-500/20">
                BULLISH (92%)
              </span>
            </div>

            {/* SVG Animated Chart */}
            <div className="h-44 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="4" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="4" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="4" />
                
                {/* Area under curve */}
                <path 
                  d="M 0 100 Q 100 80 200 40 T 400 20 L 400 150 L 0 150 Z" 
                  fill="url(#chartGlow)"
                />
                
                {/* Trend line */}
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  d="M 0 100 Q 100 80 200 40 T 400 20" 
                  fill="none" 
                  stroke="#3B82F6" 
                  strokeWidth="3.5" 
                />

                {/* Hot point */}
                <circle cx="200" cy="40" r="5" fill="#10B981" />
                <circle cx="200" cy="40" r="10" fill="none" stroke="#10B981" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: '200px 40px' }} />
              </svg>
              
              {/* Floating metrics */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] px-2 py-1 rounded shadow-premium flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accentEmerald-400" />
                <span>AI Detected Trend Breakout: +14.2%</span>
              </div>
            </div>

            {/* Microstats footer */}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-800/40 pt-4 text-center mt-2">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">News Volume</span>
                <span className="text-sm font-semibold text-slate-200">+88% Weekly</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Risk Index</span>
                <span className="text-sm font-semibold text-accentEmerald-400">Low (12.4)</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Signals</span>
                <span className="text-sm font-semibold text-accentBlue-400">Strong Buy</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Feature section */}
      <section className="bg-slate-950/60 border-y border-slate-900/60 py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold mb-4">Enterprise Grade Sentiment Tools</h2>
            <p className="text-slate-400 text-sm">
              We leverage premium AI tools to structure billions of financial variables into clickable, explainable sentiment gauges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <div 
                key={idx}
                className="glass-card hover:border-slate-700/80 p-6 rounded-2xl border border-slate-800/50 shadow-premium transition-all duration-200 group"
              >
                <div className={`h-11 w-11 rounded-lg bg-gradient-to-br ${feat.color} flex items-center justify-center border border-white/5 mb-4 group-hover:scale-105 transition-transform`}>
                  <feat.icon className="h-5 w-5 text-slate-200" />
                </div>
                <h3 className="text-base font-bold mb-2 text-slate-200 group-hover:text-accentBlue-400 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 w-full text-center">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-4xl lg:text-5xl font-black text-accentBlue-400 mb-1">94.8%</h3>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">AI Classification Accuracy</span>
          </div>
          <div>
            <h3 className="text-4xl lg:text-5xl font-black text-accentEmerald-400 mb-1">&lt; 1.2s</h3>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Aggregator Query Speed</span>
          </div>
          <div>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-100 mb-1">10,000+</h3>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Active Financial Tickers</span>
          </div>
          <div>
            <h3 className="text-4xl lg:text-5xl font-black text-accentBlue-400 mb-1">2.4M</h3>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Processed News Daily</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-950/40 border-t border-slate-900/60 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-center mb-10 flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-accentBlue-400" /> Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-slate-200 hover:bg-slate-900/50 transition-colors"
                >
                  <span className="text-sm">{faq.q}</span>
                  {openFaq === idx ? <Minus className="w-4 h-4 text-accentBlue-400" /> : <Plus className="w-4 h-4 text-slate-500" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-900/40 pt-2 bg-slate-950/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketing Footer */}
      <footer className="bg-slate-950 border-t border-slate-900/80 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Tag */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-gradient-to-tr from-accentBlue-600 to-accentEmerald-500 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-wider">DUODO</span>
            </div>
            <p className="text-slate-500">Decode Market Emotions. Invest Smarter.</p>
            <p className="text-slate-500 mt-2">Bengaluru, Karnataka, India</p>
          </div>
          {/* Links */}
          <div>
            <h5 className="font-bold text-slate-300 mb-3 uppercase tracking-wider text-[10px]">Quick Links</h5>
            <ul className="space-y-2">
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors">Home Dashboard</button></li>
              <li><button onClick={() => navigate('/copilot')} className="hover:text-white transition-colors">AI Copilot</button></li>
              <li><button onClick={() => navigate('/pulse')} className="hover:text-white transition-colors">Market Pulse</button></li>
              <li><button onClick={() => navigate('/settings')} className="hover:text-white transition-colors">User Settings</button></li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h5 className="font-bold text-slate-300 mb-3 uppercase tracking-wider text-[10px]">Support & Contact</h5>
            <ul className="space-y-1.5">
              <li>Support: <a href="mailto:support@duodo.ai" className="text-slate-300 hover:text-white">support@duodo.ai</a></li>
              <li>Business: <a href="mailto:hello@duodo.ai" className="text-slate-300 hover:text-white">hello@duodo.ai</a></li>
              <li>Phone: +91-9876543210</li>
            </ul>
          </div>
          {/* Social */}
          <div>
            <h5 className="font-bold text-slate-300 mb-3 uppercase tracking-wider text-[10px]">Corporate</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li className="text-[10px] text-slate-600 mt-2">© 2026 DUODO. All Rights Reserved.</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
