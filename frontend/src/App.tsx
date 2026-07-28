import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/common/Layout';
import { Toaster } from 'react-hot-toast';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { CopilotPage } from './pages/CopilotPage';
import { MarketPulsePage } from './pages/MarketPulsePage';
import { TrendingPage } from './pages/TrendingPage';
import { NewsPage } from './pages/NewsPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AlertsPage } from './pages/AlertsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPanelPage } from './pages/AdminPanelPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

// Guard wrapper for Protected Routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-darkNavy-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-accentBlue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { token } = useAuth();
  
  // Setup global Axios interceptors once token is available
  React.useEffect(() => {
    import('./services/api').then(({ setupInterceptors }) => {
      setupInterceptors(() => token);
    });
  }, [token]);

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Core App Panel */}
      <Route 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/copilot" element={<CopilotPage />} />
        <Route path="/pulse" element={<MarketPulsePage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
      </Route>

      {/* Fallback Catch-All Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 border',
              style: {
                background: 'var(--tw-bg-opacity, #0F172A)',
                color: '#F8FAFC',
              }
            }} 
          />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
