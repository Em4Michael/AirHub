'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Navbar - fixed at top */}
      <Navbar />

      {/* Main content area */}
      <div className="flex">
        {/* Sidebar - fixed on the left (hidden on mobile) */}
        <Sidebar />

        {/* Main content - with left margin for sidebar and bottom padding for mobile nav */}
        <main 
          className="flex-1 min-h-[calc(100vh-4rem)] transition-colors duration-300 lg:ml-0 pb-24 lg:pb-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Floating theme customization button */}
            <ThemeToggleButton />

            {/* Page content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};