'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-blob"
          style={{ backgroundColor: 'var(--accent-color)' }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-blob animation-delay-2000"
          style={{ backgroundColor: '#10b981' }}
        />
        <div 
          className="absolute bottom-1/4 left-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl animate-blob animation-delay-4000"
          style={{ backgroundColor: '#3b82f6' }}
        />
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* 404 Illustration */}
        <div className="mb-8 relative">
          <div 
            className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4 relative"
            style={{ 
              background: `linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 70%, #000) 100%)`,
            }}
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: 'var(--accent-color)' }} />
            <Search className="w-16 h-16 text-white relative z-10" />
          </div>
          
          <h1 className="text-9xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent animate-gradient">
            404
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Oops! Page Not Found
          </h2>
          <p className="text-lg max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            The page you're looking for doesn't exist or has been moved to a different location.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button className="btn-primary w-full sm:w-auto">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="btn-outline w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            You might find these helpful:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link 
              href="/dashboard/user" 
              className="text-sm px-4 py-2 rounded-lg transition-all hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-color)'
              }}
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/user/entries" 
              className="text-sm px-4 py-2 rounded-lg transition-all hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              My Entries
            </Link>
            <Link 
              href="/dashboard/user/profiles" 
              className="text-sm px-4 py-2 rounded-lg transition-all hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              Profiles
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}