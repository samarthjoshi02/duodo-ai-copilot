import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  TrendingUp, 
  SearchCode, 
  Sparkles, 
  LineChart, 
  FolderHeart, 
  BellRing, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut, 
  X,
  Compass
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Copilot', path: '/copilot', icon: MessageSquareCode, badge: 'New' },
    { name: 'Market Pulse', path: '/pulse', icon: SearchCode },
    { name: 'Trending', path: '/trending', icon: TrendingUp },
    { name: 'Watchlist', path: '/watchlist', icon: FolderHeart },
    { name: 'Portfolio', path: '/portfolio', icon: LineChart },
    { name: 'Alerts', path: '/alerts', icon: BellRing },
    { name: 'Chat History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminItem = { name: 'Admin Panel', path: '/admin', icon: Compass };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-darkNavy-950/85 backdrop-blur-md border-r border-slate-800/60 p-4">
      {/* Brand Header */}
      <div className="flex items-center justify-between py-4 border-b border-slate-800/40 mb-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-accentBlue-600 to-accentEmerald-500 flex items-center justify-center shadow-premium-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-200 to-accentBlue-400 bg-clip-text text-transparent">
            DUODO
          </span>
        </div>
        <button 
          onClick={onClose} 
          className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className={({ isActive }) => 
              `flex items-center justify-between px-3.5 py-3.5 rounded-xl text-sm font-medium transition-all group duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-accentBlue-700/30 to-accentBlue-500/10 border-l-4 border-accentBlue-500 text-white shadow-premium' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`
            }
          >
            <div className="flex items-center gap-3.5">
              <item.icon className="h-5 w-5 group-hover:scale-105 transition-transform" />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="bg-accentEmerald-500/10 text-accentEmerald-400 border border-accentEmerald-500/20 text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wider uppercase">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Admin Section (Displayed for all demo logins) */}
        <div className="pt-4 mt-4 border-t border-slate-800/40">
          <NavLink
            to={adminItem.path}
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className={({ isActive }) => 
              `flex items-center px-3.5 py-3.5 rounded-xl text-sm font-medium transition-all group duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-accentEmerald-700/30 to-accentEmerald-500/10 border-l-4 border-accentEmerald-500 text-white shadow-premium' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`
            }
          >
            <adminItem.icon className="h-5 w-5 mr-3.5 group-hover:scale-105 transition-transform" />
            <span>{adminItem.name}</span>
          </NavLink>
        </div>
      </nav>

      {/* Profile Card & Logout */}
      {user && (
        <div className="border-t border-slate-800/40 pt-4 mt-auto">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900/40 transition-colors mb-2">
            <div className="flex items-center gap-3">
              <img 
                src={user.photo || 'https://lh3.googleusercontent.com/a/default-user'} 
                alt={user.name} 
                className="h-10 w-10 rounded-full border border-slate-700 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col min-w-0 max-w-[120px]">
                <span className="text-sm font-semibold text-slate-200 truncate">{user.name}</span>
                <span className="text-xs text-slate-400 truncate">{user.email}</span>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-slate-400 hover:text-red-400 p-2 hover:bg-slate-900/60 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          
          {/* Version / Copyright Info */}
          <div className="text-center text-[10px] text-slate-500 mt-2">
            v1.2.0 • © 2026 DUODO
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay and sliding panel) */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop filter overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Sliding Sidebar Panel */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-64 max-w-xs h-full z-10 flex-shrink-0"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
