'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';

interface DashboardLayoutProps {
  children: React.ReactNode; 
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Navbar
        onMobileMenuToggle={() => setMobileOpen((v) => !v)}
        mobileMenuOpen={mobileOpen}
      />

      <div className="flex">
        <Sidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <main
          className="flex-1 min-w-0 min-h-[calc(100vh-4rem)] transition-all duration-300 pb-6"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <ThemeToggleButton />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};