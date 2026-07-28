import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Download, 
  Trash2, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileCode,
  Link,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { copilotApi } from '../services/api';
import type { CopilotChatResponse } from '../services/api';

interface ChatMessage {
  id: string | number;
  question: string;
  answer: string;
  sentiment_data?: CopilotChatResponse;
  timestamp: string;
  isNew?: boolean;
}

export const CopilotPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeVoiceInput, setActiveVoiceInput] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | number | null>(null);
  
  // Voice states
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Load chat history from Supabase
  const { data: dbHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: copilotApi.getHistory,
    refetchInterval: 120000 // every 2 min
  });

  // Sync dbHistory into local message list
  useEffect(() => {
    if (dbHistory) {
      // Reverse history from database to render chronologically
      const formatted = dbHistory.map(h => ({
        id: h.id,
        question: h.question,
        answer: h.answer,
        sentiment_data: h.sentiment_data,
        timestamp: h.timestamp
      })).reverse();
      setMessages(formatted);
    }
  }, [dbHistory]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setActiveVoiceInput(true);
      rec.onend = () => setActiveVoiceInput(false);
      rec.onerror = () => setActiveVoiceInput(false);
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInputVal(transcript);
      };
      recognitionRef.current = rec;
    }
  }, []);

  const chatMutation = useMutation({
    mutationFn: copilotApi.chat,
    onSuccess: (data, variables) => {
      // Append generated response
      const newMsg: ChatMessage = {
        id: Date.now(),
        question: variables,
        answer: data.summary,
        sentiment_data: data,
        timestamp: new Date().toISOString(),
        isNew: true
      };
      setMessages(prev => [...prev, newMsg]);
      setInputVal('');
      // Invalidate history query to sync state
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    }
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || chatMutation.isPending) return;
    chatMutation.mutate(inputVal.trim());
  };

  const handleSuggestedPrompt = (prompt: string) => {
    if (chatMutation.isPending) return;
    setInputVal(prompt);
    chatMutation.mutate(prompt);
  };

  const toggleMic = () => {
    if (!voiceSupported) return;
    if (activeVoiceInput) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (id: string | number, text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
      setSpeakingMsgId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    
    let doc = `DUODO AI COPILOT CHAT REPORT\n`;
    doc += `Generated for: ${user?.name} (${user?.email})\n`;
    doc += `Date: ${new Date().toLocaleDateString()}\n`;
    doc += `==========================================\n\n`;

    messages.forEach((m, idx) => {
      doc += `[Query ${idx + 1}] Q: ${m.question}\n`;
      doc += `Answer Summary: ${m.answer}\n`;
      if (m.sentiment_data) {
        doc += `Sentiment Stance: ${m.sentiment_data.sentiment} (${m.sentiment_data.confidence}% confidence)\n`;
        doc += `Potential Risks:\n` + m.sentiment_data.risks.map(r => `  - ${r}`).join('\n') + `\n`;
        doc += `Related tickers: ${m.sentiment_data.related_stocks.join(', ')}\n`;
      }
      doc += `------------------------------------------\n\n`;
    });

    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `duodo-copilot-report-${Date.now()}.txt`;
    link.click();
  };

  const suggestedPrompts = [
    "Why is Tesla bullish?",
    "Summarize today's banking sector.",
    "What stocks have positive momentum?",
    "Compare Apple vs Microsoft."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/40 border-b border-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6.5 w-6.5 rounded bg-accentBlue-500/10 flex items-center justify-center border border-accentBlue-500/20">
            <Sparkles className="w-3.5 h-3.5 text-accentBlue-400" />
          </div>
          <span className="text-xs font-extrabold text-slate-200">DUODO AI Copilot Studio</span>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-[10px] font-bold bg-slate-900 border border-slate-800 hover:border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300 transition-all hover:text-white"
            title="Download PDF/TXT Report"
          >
            <Download className="w-3.5 h-3.5" /> Export Conversation
          </button>
        )}
      </div>

      {/* 2. Messages Board */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {loadingHistory && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
            <div className="w-6 h-6 border-2 border-slate-700 border-t-accentBlue-400 rounded-full animate-spin" />
            <span className="text-xs">Loading copilot history...</span>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Welcoming Screen */
          <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center h-full select-none py-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-accentBlue-600 to-accentEmerald-500 flex items-center justify-center shadow-premium-glow mb-6 animate-pulse">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
              I'm your DUODO Financial Copilot
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-sm">
              Ask questions about tickers, request sentiment summarization, or query sector risk parameters.
            </p>

            {/* Suggestions list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-10">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedPrompt(p)}
                  className="bg-slate-900/60 border border-slate-800/60 hover:border-accentBlue-500/40 hover:bg-slate-900 p-4 rounded-xl text-left text-xs font-semibold text-slate-300 transition-all hover:text-white flex items-center justify-between group"
                >
                  <span>{p}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="max-w-3xl mx-auto space-y-6 pb-6">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-4">
                {/* User Query Block */}
                <div className="flex justify-end">
                  <div className="bg-accentBlue-600 text-white px-5 py-3.5 rounded-2xl rounded-br-sm max-w-[85%] shadow-sm">
                    <p className="text-sm font-medium leading-relaxed">{msg.question}</p>
                    <span className="block text-[9px] text-accentBlue-200 text-right mt-1.5">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* AI Copilot Answer Block */}
                <div className="flex gap-4 items-end">
                  <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-tr from-accentBlue-600 to-accentEmerald-500 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-premium">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="flex-1 max-w-[85%]">
                    <div className="bg-slate-800/80 text-slate-200 dark:bg-slate-800/80 dark:text-slate-200 px-5 py-3.5 rounded-2xl rounded-bl-sm border border-slate-700/50 shadow-sm relative">
                      {/* Summary text */}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.answer}
                      </p>

                      {/* Audio & Extra Actions */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => speakText(msg.id, msg.answer)}
                          className={`p-1.5 rounded hover:bg-slate-700/60 transition-colors ${
                            speakingMsgId === msg.id ? 'text-accentEmerald-400 bg-accentEmerald-500/10' : 'text-slate-400'
                          }`}
                          title="Voice Reader"
                        >
                          {speakingMsgId === msg.id ? <Volume2 className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* AI Sentiment Meta Badges (Collapsible or subtle) */}
                    {msg.sentiment_data && (
                      <div className="mt-2 ml-1">
                        <details className="group/details">
                          <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300 font-medium select-none flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 group-open/details:bg-accentBlue-500/20 group-open/details:text-accentBlue-400 transition-colors">+</span>
                            View Market Analysis Data
                          </summary>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pl-2 pr-4 text-xs border-l-2 border-slate-800">
                            {/* Sentiment Meter */}
                            <div className="bg-slate-900/40 border border-slate-800/30 p-2.5 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="block text-[9px] text-slate-500 uppercase font-bold">Aggregate Sentiment</span>
                                <span className={`text-xs font-bold leading-none mt-1 inline-block ${
                                  msg.sentiment_data.sentiment === 'Bullish' 
                                    ? 'text-accentEmerald-400' 
                                    : msg.sentiment_data.sentiment === 'Bearish' 
                                    ? 'text-red-400' 
                                    : 'text-yellow-400'
                                }`}>
                                  {msg.sentiment_data.sentiment} ({msg.sentiment_data.confidence}%)
                                </span>
                              </div>
                            </div>

                            {/* Related Stocks */}
                            <div className="bg-slate-900/40 border border-slate-800/30 p-2.5 rounded-xl">
                              <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Related Stocks</span>
                              <div className="flex flex-wrap gap-1">
                                {msg.sentiment_data.related_stocks.map(sym => (
                                  <a
                                    key={sym}
                                    href={`/pulse?s=${sym}`}
                                    className="bg-slate-800 border border-slate-700/60 text-[9px] font-bold px-1.5 py-0.5 rounded text-slate-300 hover:text-accentBlue-400 transition-colors"
                                  >
                                    {sym}
                                  </a>
                                ))}
                              </div>
                            </div>

                            {/* Risks Analysis */}
                            <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/30 p-2.5 rounded-xl">
                              <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1">
                                <AlertTriangle className="w-3 h-3 text-yellow-500" /> Key Risk Indicators
                              </span>
                              <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[10px]">
                                {msg.sentiment_data.risks.map((risk, i) => (
                                  <li key={i}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Response Generating skeleton loader */}
            {chatMutation.isPending && (
              <div className="flex gap-4 items-start">
                <div className="h-8.5 w-8.5 rounded-lg bg-gradient-to-tr from-accentBlue-600 to-accentEmerald-500 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-premium">
                  <Sparkles className="h-4.5 w-4.5 text-white animate-spin" />
                </div>
                
                <div className="flex-1 glass-card p-5 rounded-2xl border border-slate-800/40 shadow-premium space-y-3.5">
                  <div className="h-4 bg-slate-800/50 rounded-md w-full shimmer" />
                  <div className="h-4 bg-slate-800/50 rounded-md w-[90%] shimmer" />
                  <div className="h-4 bg-slate-800/50 rounded-md w-[60%] shimmer" />
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800/20 pt-4 mt-2">
                    <div className="h-10 bg-slate-800/30 rounded-xl shimmer" />
                    <div className="h-10 bg-slate-800/30 rounded-xl shimmer" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. Input Board Toolbar */}
      <div className="p-4 bg-slate-950/40 border-t border-slate-900 flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center">
          <input
            type="text"
            placeholder={activeVoiceInput ? 'Listening verbally...' : 'Query market sentiment... (e.g. Compare AAPL vs MSFT)'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={chatMutation.isPending}
            className="w-full bg-slate-900/60 text-slate-100 pl-4 pr-24 py-3.5 rounded-2xl text-xs border border-slate-800 focus:outline-none focus:border-accentBlue-500 focus:bg-slate-900 focus:ring-1 focus:ring-accentBlue-500/25 transition-all shadow-inner disabled:opacity-60"
          />
          <div className="absolute right-2.5 flex items-center gap-1.5">
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={chatMutation.isPending}
                className={`p-2 rounded-xl transition-colors ${
                  activeVoiceInput 
                    ? 'bg-red-500/10 text-red-400 pulse-glow-red' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Voice Input"
              >
                {activeVoiceInput ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <button
              type="submit"
              disabled={!inputVal.trim() || chatMutation.isPending}
              className="bg-accentBlue-600 hover:bg-accentBlue-700 text-white p-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
