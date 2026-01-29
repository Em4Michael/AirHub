'use client';

import React, { forwardRef, useState } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
  // New auth-specific props
  showPasswordToggle?: boolean; // Explicit control for password toggle
  onClearError?: () => void; // Callback when user starts typing
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    className = '', 
    type,
    inputSize = 'md',
    showPasswordToggle = true, // Default to true for password fields
    onClearError,
    onChange,
    required,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const sizeClasses = {
      sm: 'py-2 text-sm',
      md: 'py-3',
      lg: 'py-4 text-lg',
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Call onClearError if provided (for auth pages)
      if (onClearError) {
        onClearError();
      }
      // Call original onChange
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label 
            className="block text-sm font-semibold mb-2 transition-colors text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div 
              className="absolute left-0 pl-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 text-gray-400"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              w-full rounded-xl border transition-all duration-200
              focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-gray-400 text-gray-900 dark:text-white
              ${sizeClasses[inputSize]}
              ${leftIcon ? 'pl-12' : 'pl-4'} 
              ${(rightIcon || (isPassword && showPasswordToggle)) ? 'pr-12' : 'pr-4'} 
              ${error 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-gray-50 dark:bg-gray-800' 
                : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 bg-gray-50 dark:bg-gray-800'
              }
              ${className}
            `}
            onChange={handleChange}
            required={required}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 pr-4 top-1/2 -translate-y-1/2 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
          {rightIcon && !(isPassword && showPasswordToggle) && (
            <div 
              className="absolute right-0 pr-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 text-gray-400"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';