'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ColorScheme = 'purple' | 'yellow' | 'red' | 'green' | 'blue';
export type BackgroundMode = 'light' | 'dim' | 'dark';
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

interface ThemeConfig {
  colorScheme: ColorScheme;
  backgroundMode: BackgroundMode;
  fontSize: FontSize;
}

interface ThemeContextType {
  config: ThemeConfig;
  mounted: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  setBackgroundMode: (mode: BackgroundMode) => void;
  setFontSize: (size: FontSize) => void;
  resetTheme: () => void;
}

const defaultConfig: ThemeConfig = {
  colorScheme: 'purple',
  backgroundMode: 'light',
  fontSize: 'base',
};

const ThemeContext = createContext<ThemeContextType>({
  config: defaultConfig,
  mounted: false,
  setColorScheme: () => {},
  setBackgroundMode: () => {},
  setFontSize: () => {},
  resetTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ThemeConfig>(defaultConfig);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('airhub-theme');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setConfig(parsed);
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    }
  }, []);

  // Save theme to localStorage and apply to document
  useEffect(() => {
    if (!mounted) return;
    
    localStorage.setItem('airhub-theme', JSON.stringify(config));
    
    // Apply theme classes to document
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dim', 'dark');
    root.classList.remove('theme-purple', 'theme-yellow', 'theme-red', 'theme-green', 'theme-blue');
    root.classList.remove('font-xs', 'font-sm', 'font-base', 'font-lg', 'font-xl');
    
    // Add current theme classes
    root.classList.add(config.backgroundMode);
    root.classList.add(`theme-${config.colorScheme}`);
    root.classList.add(`font-${config.fontSize}`);
  }, [config, mounted]);

  const setColorScheme = (scheme: ColorScheme) => {
    setConfig(prev => ({ ...prev, colorScheme: scheme }));
  };

  const setBackgroundMode = (mode: BackgroundMode) => {
    setConfig(prev => ({ ...prev, backgroundMode: mode }));
  };

  const setFontSize = (size: FontSize) => {
    setConfig(prev => ({ ...prev, fontSize: size }));
  };

  const resetTheme = () => {
    setConfig(defaultConfig);
  };

  return (
    <ThemeContext.Provider
      value={{
        config,
        mounted,
        setColorScheme,
        setBackgroundMode,
        setFontSize,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};