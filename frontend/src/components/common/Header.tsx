import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Mic, 
  MicOff, 
  Sun, 
  Moon, 
  Bell, 
  Clock, 
  Command, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { marketApi } from '../../services/api';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; name: string; sector: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Time States
  const [time, setTime] = useState(new Date());

  // Hook live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hook Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };
      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setSearchQuery(text);
        handleVoiceCommand(text);
      };
      recognitionRef.current = rec;
    }
  }, []);

  // Keyboard Shortcuts (Ctrl + K to search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Search input typing
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const delayDebounce = setTimeout(() => {
        marketApi.search(searchQuery)
          .then(data => {
            setSuggestions(data.results);
            setShowSuggestions(true);
          })
          .catch(err => console.error(err));
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleVoiceCommand = (command: string) => {
    // Speak response
    speakResponse(`Searching for ${command}`);
    // Extract ticker patterns
    const words = command.toUpperCase().split(' ');
    const commonTickers = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'NFLX'];
    const foundTicker = words.find(w => commonTickers.includes(w)) || words[words.length - 1];
    
    setTimeout(() => {
      navigate(`/pulse?s=${foundTicker}`);
    }, 1500);
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoice = () => {
    if (!voiceSupported) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pulse?s=${searchQuery.trim().toUpperCase()}`);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (symbol: string) => {
    setSearchQuery(symbol);
    navigate(`/pulse?s=${symbol}`);
    setShowSuggestions(false);
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 bg-darkNavy-950/80 backdrop-blur-md border-b border-slate-800/50">
      {/* Left section: mobile hamburger & page info */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-slate-400 hover:text-white p-2 hover:bg-slate-900/50 rounded-xl transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800/40">
          <Clock className="w-3.5 h-3.5 text-accentBlue-400" />
          <span>EST MARKET IS OPEN: {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* Center section: Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md mx-4 md:mx-12">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accentBlue-400 transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search stocks, sectors, or news... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 text-slate-200 pl-10 pr-16 py-2 rounded-xl text-sm border border-slate-800/60 focus:outline-none focus:border-accentBlue-500 focus:bg-slate-900/90 transition-all shadow-inner"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500/10 text-red-400 pulse-glow-red' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title={isListening ? 'Stop Listening' : 'Voice Input'}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-800">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        </div>

        {/* Search Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionRef}
            className="absolute top-full left-0 right-0 mt-2 bg-darkNavy-900/95 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-premium z-50"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/40 border-b border-slate-800/40 flex items-center justify-between">
              <span>Matching Symbols</span>
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-accentBlue-400" /> AI Suggestions</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => selectSuggestion(item.symbol)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accentBlue-600/10 border-b border-slate-800/20 text-left transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-accentBlue-400 transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-xs text-slate-400 truncate max-w-[220px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 border border-slate-700/40">
                    {item.sector}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Right section: theme, alerts, and profile */}
      <div className="flex items-center gap-2.5">


        {/* Notifications Mock Button */}
        <button
          className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-xl border border-slate-800/40 transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accentEmerald-500 rounded-full pulse-glow-green" />
        </button>

        {/* User Card info (Desktop) */}
        {user && (
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800/60">
            <img 
              src={user.photo || 'https://lh3.googleusercontent.com/a/default-user'} 
              alt={user.name} 
              className="h-8 w-8 rounded-full border border-slate-700 object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-semibold text-slate-300 truncate max-w-[100px]">
              {user.name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
