'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ 
  children, 
  className,
  onClick,
  style,
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div 
      className={cn('px-6 py-4 border-b', className)}
      style={{ borderColor: 'var(--border-color)' }}
    >
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  return (
    <h3 
      className={cn('text-lg font-semibold', className)}
      style={{ color: 'var(--text-primary)' }}
    >
      {children}
    </h3>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div 
      className={cn('px-6 py-4 border-t', className)}
      style={{ borderColor: 'var(--border-color)' }}
    >
      {children}
    </div>
  );
};