'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { BackgroundMode } from '@/context/ThemeContext';

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { config, setBackgroundMode, mounted } = useTheme();

  const themes: { name: BackgroundMode; label: string; icon: React.ReactNode }[] = [
    {
      name: 'light',
      label: 'Light',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'dim',
      label: 'Dim',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      name: 'dark',
      label: 'Dark',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
  ];

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`theme-switcher ${className}`}>
        {themes.map((t) => (
          <div key={t.name} className="theme-switcher-btn">
            {t.icon}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`theme-switcher ${className}`}>
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => setBackgroundMode(t.name)}
          className={`theme-switcher-btn ${config.backgroundMode === t.name ? 'active' : ''}`}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}