'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'danger';
      case 'admin': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <nav 
      className="sticky top-0 z-50 border-b backdrop-blur-lg transition-all duration-300"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 70%, #000) 100%)',
              }}
            >
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span 
              className="text-xl font-bold hidden sm:block transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              AIRhub
            </span>
          </Link>

          {/* Desktop - User info & Logout */}
          {user && (
            <>
              <div className="hidden md:flex items-center space-x-4">
                <div 
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{
                      background: user.profilePhoto 
                        ? 'transparent' 
                        : `linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 80%, #000) 100%)`,
                    }}
                  >
                    {user.profilePhoto ? (
                      <img 
                        src={user.profilePhoto} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p 
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user.name}
                    </p>
                    <Badge 
                      variant={getRoleBadgeVariant(user.role) as any}
                      className="text-xs"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-red-50 group"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <LogOut className="w-5 h-5 group-hover:text-red-500 transition-colors" />
                  <span className="group-hover:text-red-500 transition-colors">Logout</span>
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)' 
                }}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && user && (
          <div 
            className="md:hidden border-t py-4 space-y-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div 
              className="flex items-center space-x-3 p-3 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                style={{
                  background: user.profilePhoto 
                    ? 'transparent' 
                    : `linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 80%, #000) 100%)`,
                }}
              >
                {user.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p 
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user.name}
                </p>
                <Badge variant={getRoleBadgeVariant(user.role) as any} className="text-xs mt-1">
                  {user.role}
                </Badge>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl text-sm font-semibold transition-colors bg-red-50 hover:bg-red-100 text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};