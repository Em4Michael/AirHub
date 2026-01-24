'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl animate-blob"
          style={{ backgroundColor: '#ef4444' }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl animate-blob animation-delay-2000"
          style={{ backgroundColor: '#f59e0b' }}
        />
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Error Icon */}
        <div className="mb-8 relative inline-block">
          <div 
            className="w-32 h-32 rounded-full flex items-center justify-center relative"
            style={{ 
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            }}
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-500" />
            <AlertCircle className="w-16 h-16 text-white relative z-10 animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Something Went Wrong
          </h1>
          <p className="text-lg max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            We're sorry, but an unexpected error occurred. Don't worry, our team has been notified.
          </p>
          
          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <div 
              className="mt-6 p-4 rounded-xl text-left max-w-lg mx-auto overflow-auto"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}
            >
              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {error.message}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={reset}
            className="w-full sm:w-auto"
            style={{
              background: 'linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 80%, #000) 100%)',
            }}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          <Link href="/">
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            If this problem persists, please contact support with error code:{' '}
            {error.digest && (
              <code className="px-2 py-1 rounded font-mono text-xs" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {error.digest}
              </code>
            )}
          </p>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}