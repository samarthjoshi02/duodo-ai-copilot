import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-darkNavy-950 text-slate-100">
      {/* Sidebar drawer container */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main panel container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Navigation header panel */}
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        {/* Dynamic page content container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-gradient-to-b from-slate-950/60 to-darkNavy-950/80">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
