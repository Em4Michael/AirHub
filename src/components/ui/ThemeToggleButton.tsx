'use client';

import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { ThemeCustomizationModal } from '@/components/ui/ThemeCustomizationModal';

export const ThemeToggleButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-9 right-6 w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-40 flex items-center justify-center group animate-pulse-glow"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white'
        }}
        aria-label="Customize theme"
      >
        <Palette className="w-7 h-7 transition-transform group-hover:rotate-12" />
        
        <span 
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ backgroundColor: '#8b5cf6' }}
        />
      </button>

      <ThemeCustomizationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};