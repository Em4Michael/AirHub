'use client';

import React from 'react';
import { X, Sun, Moon, CloudMoon } from 'lucide-react';
import { useTheme, ColorScheme, BackgroundMode, FontSize } from '@/context/ThemeContext';

interface ThemeCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const colorSchemes: { value: ColorScheme; color: string; label: string }[] = [
  { value: 'purple', color: '#8b5cf6', label: 'Purple' },
  { value: 'yellow', color: '#fbbf24', label: 'Yellow' },
  { value: 'red', color: '#f43f5e', label: 'Red' },
  { value: 'green', color: '#10b981', label: 'Green' },
  { value: 'blue', color: '#3b82f6', label: 'Blue' },
];

const backgroundModes: { value: BackgroundMode; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dim', label: 'Dim', icon: CloudMoon },
  { value: 'dark', label: 'Lights Out', icon: Moon },
];

const fontSizes: { value: FontSize; label: string }[] = [
  { value: 'xs', label: 'Aa' },
  { value: 'sm', label: 'Aa' },
  { value: 'base', label: 'Aa' },
  { value: 'lg', label: 'Aa' },
  { value: 'xl', label: 'Aa' },
];

export const ThemeCustomizationModal: React.FC<ThemeCustomizationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { config, setColorScheme, setBackgroundMode, setFontSize } = useTheme();

  if (!isOpen) return null;

  const currentFontIndex = fontSizes.findIndex(f => f.value === config.fontSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-md transition-all"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative rounded-3xl shadow-2xl max-w-2xl w-full p-8 animate-slide-in-up"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Customize your view
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Manage your font size, color and background
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Font Size */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            Font Size
          </h3>
          <div className="relative px-4">
            <input
              type="range"
              min="0"
              max="4"
              value={currentFontIndex}
              onChange={(e) => setFontSize(fontSizes[parseInt(e.target.value)].value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${(currentFontIndex / 4) * 100}%, var(--border-color) ${(currentFontIndex / 4) * 100}%, var(--border-color) 100%)`
              }}
            />
            <div className="flex justify-between mt-4 px-1">
              {fontSizes.map((size, index) => (
                <span
                  key={size.value}
                  className="font-bold transition-all"
                  style={{ 
                    color: config.fontSize === size.value ? 'var(--accent-color)' : 'var(--text-muted)',
                    fontSize: index === 0 ? '0.75rem' :
                              index === 1 ? '0.875rem' :
                              index === 2 ? '1rem' :
                              index === 3 ? '1.125rem' : '1.25rem'
                  }}
                >
                  {size.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            Color
          </h3>
          <div className="flex justify-center gap-6">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => setColorScheme(scheme.value)}
                className={`w-14 h-14 rounded-full transition-all ${
                  config.colorScheme === scheme.value
                    ? 'scale-110 shadow-lg'
                    : 'hover:scale-105'
                }`}
                style={{ 
                  backgroundColor: scheme.color,
                  boxShadow: config.colorScheme === scheme.value 
                    ? `0 0 0 4px var(--bg-secondary), 0 0 0 6px ${scheme.color}` 
                    : 'none'
                }}
                aria-label={`Select ${scheme.label} theme`}
              />
            ))}
          </div>
        </div>

        {/* Background Mode */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            Background
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {backgroundModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = config.backgroundMode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => setBackgroundMode(mode.value)}
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    isActive ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    borderColor: isActive ? 'var(--accent-color)' : 'var(--border-color)',
                    color: isActive ? 'white' : 'var(--text-primary)'
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Icon className="w-6 h-6" />
                    <span className="font-bold">{mode.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <button 
            onClick={onClose} 
            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent-color);
          cursor: pointer;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent-color);
          cursor: pointer;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};