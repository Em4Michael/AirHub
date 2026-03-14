'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  mobileMenuOpen:     boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle, mobileMenuOpen }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'danger';
      case 'admin':      return 'warning';
      default:           return 'primary';
    }
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-lg transition-all duration-300"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)',
        borderColor:     'var(--border-color)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-3">

          {/* Left: hamburger (mobile only) + logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            {user && (
              <button
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2 rounded-lg transition-colors flex-shrink-0"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color:           'var(--text-primary)',
                }}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
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
          </div>

          {/* Right: user info always visible + logout */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User pill — always visible on all screen sizes */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border:          '1px solid var(--border-color)',
                }}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
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
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Name + role — name hidden on very small screens, role badge always shown */}
                <div className="text-left hidden xs:block">
                  <p
                    className="text-xs sm:text-sm font-semibold leading-tight max-w-[100px] sm:max-w-[160px] truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {user.name}
                  </p>
                </div>
                <Badge
                  variant={getRoleBadgeVariant(user.role) as any}
                  className="text-[10px] hidden sm:inline-flex"
                >
                  {user.role}
                </Badge>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-red-50 group flex-shrink-0"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4 group-hover:text-red-500 transition-colors" />
                <span className="hidden sm:inline group-hover:text-red-500 transition-colors">
                  Logout
                </span>
              </button> 
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};