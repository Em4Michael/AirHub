'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard, Users, FileText, UserPlus, TrendingUp,
  DollarSign, Settings, Award, BarChart3, Briefcase, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  // User routes
  {
    name: 'Dashboard',
    href: '/dashboard/user',
    icon: LayoutDashboard,
    roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  {
    name: 'Profiles',
    href: '/dashboard/user/profiles',
    icon: Briefcase,
    roles: [UserRole.USER],
  },
  {
    name: 'Entries',
    href: '/dashboard/user/entries',
    icon: FileText,
    roles: [UserRole.USER],
  },
  {
    name: 'Bank Details',
    href: '/dashboard/user/bank',
    icon: DollarSign,
    roles: [UserRole.USER],
  },

  // Admin routes
  {
    name: 'Admin Dashboard',
    href: '/dashboard/admin',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  {
    name: 'Users',
    href: '/dashboard/admin/users',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  {
    name: 'Profiles',
    href: '/dashboard/admin/profiles',
    icon: Briefcase,
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  {
    name: 'Entries',
    href: '/dashboard/admin/entries',
    icon: FileText,
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  {
    name: 'Pending Users',
    href: '/dashboard/admin/pending',
    icon: UserPlus,
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  {
    name: 'Rankings',
    href: '/dashboard/admin/rankings',
    icon: TrendingUp,
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },

  // Superadmin routes
  {
    name: 'Superadmin',
    href: '/dashboard/superadmin',
    icon: Settings,
    roles: [UserRole.SUPERADMIN],
  },
  {
    name: 'Benchmarks',
    href: '/dashboard/superadmin/benchmarks',
    icon: Award,
    roles: [UserRole.SUPERADMIN],
  },
  {
    name: 'Bonuses',
    href: '/dashboard/superadmin/bonuses',
    icon: DollarSign,
    roles: [UserRole.SUPERADMIN],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavigation = navigation.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          'hidden lg:block border-r min-h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300',
          collapsed ? 'w-20' : 'w-64'
        )}
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-10"
          style={{
            backgroundColor: 'var(--accent-color)',
          }}
        >
          <ChevronLeft 
            className={cn(
              'w-4 h-4 text-white transition-transform duration-300',
              collapsed && 'rotate-180'
            )}
          />
        </button>

        <nav className="px-3 py-6 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden',
                  isActive
                    ? 'font-semibold shadow-md'
                    : 'hover:shadow-sm'
                )}
                style={{
                  backgroundColor: isActive 
                    ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)'
                    : 'transparent',
                  color: isActive 
                    ? 'var(--accent-color)'
                    : 'var(--text-secondary)',
                }}
                title={collapsed ? item.name : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  />
                )}

                {/* Icon */}
                <div className={cn(
                  'flex items-center justify-center transition-all duration-200',
                  collapsed ? 'w-full' : 'w-5'
                )}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                </div>

                {/* Label */}
                {!collapsed && (
                  <span className="truncate transition-all duration-200">
                    {item.name}
                  </span>
                )}

                {/* Hover effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-color) 5%, transparent)',
                  }}
                />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)',
          borderColor: 'var(--border-color)',
        }}
      >
        <nav className="flex justify-around items-center px-2 py-3">
          {filteredNavigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-0"
                style={{
                  color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
                }}
              >
                <div 
                  className={cn(
                    'p-2 rounded-lg transition-all duration-200',
                    isActive && 'shadow-md'
                  )}
                  style={{
                    backgroundColor: isActive 
                      ? 'color-mix(in srgb, var(--accent-color) 15%, transparent)'
                      : 'transparent',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium truncate max-w-[60px]">
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};