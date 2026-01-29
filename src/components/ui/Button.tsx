import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string; // Custom loading text
  children: React.ReactNode;
  fullWidth?: boolean; // For auth pages
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  children,
  className,
  disabled,
  style,
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl',
    secondary: 'shadow-sm hover:shadow-md',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md',
    outline: 'border-2 bg-transparent shadow-sm hover:shadow-md',
    ghost: 'bg-transparent hover:shadow-sm',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {}; // Uses gradient from variants
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-tertiary, #f3f4f6)',
          color: 'var(--text-primary, #111827)',
        };
      case 'outline':
        return {
          borderColor: 'var(--accent-color, #3b82f6)',
          color: 'var(--accent-color, #3b82f6)',
        };
      case 'ghost':
        return {
          color: 'var(--text-secondary, #6b7280)',
        };
      default:
        return {};
    }
  };

  return (
    <button
      className={cn(
        baseStyles, 
        variants[variant], 
        sizes[size], 
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      style={{ ...getVariantStyles(), ...style }}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        children
      )}
    </button>
  );
};