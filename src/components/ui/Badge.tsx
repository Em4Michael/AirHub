import React from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary', 
  className 
}) => {
  return (
    <span 
      className={cn(
        'badge inline-flex items-center gap-1',
        `badge-${variant}`,
        className
      )}
    >
      {children}
    </span>
  );
};