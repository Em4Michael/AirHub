'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Navbar />

      <div className="flex">
        {/* Pass collapsed state down so main content can respond to it */}
        <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />

        <main
          className="flex-1 min-w-0 min-h-[calc(100vh-4rem)] transition-all duration-300 pb-24 lg:pb-6"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          {/*
            No max-w-7xl — let the content fill whatever space the sidebar leaves.
            flex-1 + min-w-0 on <main> means it genuinely shrinks/grows with the sidebar.
          */}
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <ThemeToggleButton />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};