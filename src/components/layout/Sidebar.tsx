'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard, Users, FileText, UserPlus,
  DollarSign, Award, BarChart3, Briefcase, ChevronLeft,
  Shield, Star, Trophy, X,
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
  // Worker routes
  { name: 'Dashboard',   href: '/dashboard/user',               icon: LayoutDashboard, roles: [UserRole.USER] },
  { name: 'My Profiles', href: '/dashboard/user/profiles',      icon: Briefcase,       roles: [UserRole.USER] },
  { name: 'My Entries',  href: '/dashboard/user/entries',       icon: FileText,        roles: [UserRole.USER] },
  { name: 'Bank Details',href: '/dashboard/user/bank',          icon: DollarSign,      roles: [UserRole.USER] },
  { name: 'Top Earners', href: '/dashboard/user/topEarners',   icon: Trophy,          roles: [UserRole.USER] },

  // Admin routes
  { name: 'Dashboard',   href: '/dashboard/admin',              icon: BarChart3, roles: [UserRole.ADMIN] },
  { name: 'Users',       href: '/dashboard/admin/users',        icon: Users,     roles: [UserRole.ADMIN] },
  { name: 'Profiles',    href: '/dashboard/admin/profiles',     icon: Briefcase, roles: [UserRole.ADMIN] },
  { name: 'Entries',     href: '/dashboard/admin/entries',      icon: FileText,  roles: [UserRole.ADMIN] },
  { name: 'Pending',     href: '/dashboard/admin/pending',      icon: UserPlus,  roles: [UserRole.ADMIN] },
  { name: 'Rankings',    href: '/dashboard/admin/rankings',     icon: Trophy,    roles: [UserRole.ADMIN] },
  { name: 'Top Earners', href: '/dashboard/admin/topEarners',  icon: Trophy,    roles: [UserRole.ADMIN] },

  // Superadmin routes
  { name: 'Overview',    href: '/dashboard/superadmin',                icon: BarChart3, roles: [UserRole.SUPERADMIN] },
  { name: 'Users',       href: '/dashboard/superadmin/users',          icon: Users,     roles: [UserRole.SUPERADMIN] },
  { name: 'Profiles',    href: '/dashboard/admin/profiles',            icon: Briefcase, roles: [UserRole.SUPERADMIN] },
  { name: 'Entries',     href: '/dashboard/admin/entries',             icon: FileText,  roles: [UserRole.SUPERADMIN] },
  { name: 'Pending',     href: '/dashboard/admin/pending',             icon: UserPlus,  roles: [UserRole.SUPERADMIN] },
  { name: 'Rankings',    href: '/dashboard/admin/rankings',            icon: Trophy,    roles: [UserRole.SUPERADMIN] },
  { name: 'Top Earners', href: '/dashboard/superadmin/top-earners',    icon: Trophy,    roles: [UserRole.SUPERADMIN] },
  { name: 'Benchmarks',  href: '/dashboard/superadmin/benchmarks',     icon: Award,     roles: [UserRole.SUPERADMIN] },
  { name: 'Bonuses',     href: '/dashboard/superadmin/bonuses',        icon: Star,      roles: [UserRole.SUPERADMIN] },
];

const SUPERADMIN_SECTIONS = [
  { label: 'Overview',   hrefs: ['/dashboard/superadmin'] },
  {
    label: 'Management',
    hrefs: [
      '/dashboard/superadmin/users',
      '/dashboard/admin/profiles',
      '/dashboard/admin/entries',
      '/dashboard/admin/pending',
      '/dashboard/admin/rankings',
      '/dashboard/superadmin/topEarners',
    ],
  },
  {
    label: 'System',
    hrefs: ['/dashboard/superadmin/benchmarks', '/dashboard/superadmin/bonuses'],
  },
];

interface SidebarProps {
  collapsed:          boolean;
  onCollapsedChange:  (value: boolean) => void;
  mobileOpen:         boolean;
  onMobileClose:      () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}) => {
  const pathname = usePathname();
  const { user }  = useAuth();

  const isSuperadmin = user?.role === UserRole.SUPERADMIN;

  const filteredNavigation = navigation.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const groupedNav = isSuperadmin
    ? SUPERADMIN_SECTIONS.map((section) => ({
        ...section,
        items: filteredNavigation.filter((item) => section.hrefs.includes(item.href)),
      }))
    : null;

  const accentActive = isSuperadmin ? '#dc2626'               : 'var(--accent-color)';
  const accentBg     = isSuperadmin ? 'rgba(239,68,68,0.1)'  : 'color-mix(in srgb, var(--accent-color) 12%, transparent)';
  const accentHover  = isSuperadmin ? 'rgba(239,68,68,0.05)' : 'color-mix(in srgb, var(--accent-color) 5%, transparent)';

  const renderNavItem = (item: NavItem, onClick?: () => void) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={cn(
          'group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden',
          isActive ? 'font-semibold shadow-md' : 'hover:shadow-sm'
        )}
        style={{
          backgroundColor: isActive ? accentBg    : 'transparent',
          color:           isActive ? accentActive : 'var(--text-secondary)',
        }}
        title={collapsed ? item.name : undefined}
      >
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
            style={{ backgroundColor: accentActive }}
          />
        )}
        <div
          className={cn(
            'flex items-center justify-center transition-all duration-200',
            collapsed ? 'w-full' : 'w-5'
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
        </div>
        {!collapsed && (
          <span className="truncate transition-all duration-200">{item.name}</span>
        )}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{ backgroundColor: accentHover }}
        />
      </Link>
    );
  };

  // ── Shared nav content (used in both desktop sidebar and mobile drawer) ──────
  const NavContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="px-3 py-4 space-y-1 overflow-y-auto flex-1">
      {isSuperadmin && groupedNav ? (
        groupedNav.map((section) =>
          section.items.length === 0 ? null : (
            <div key={section.label} className="mb-4">
              <p
                className="px-4 mb-1 text-xs font-bold uppercase tracking-wider"
                style={{ color: 'rgba(220,38,38,0.5)' }}
              >
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => renderNavItem(item, onItemClick))}
              </div>
            </div>
          )
        )
      ) : (
        filteredNavigation.map((item) => renderNavItem(item, onItemClick))
      )}
    </nav>
  );

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r min-h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0 transition-all duration-300 overflow-hidden',
          collapsed ? 'w-20' : 'w-64'
        )}
        style={{
          backgroundColor: isSuperadmin
            ? 'color-mix(in srgb, #7f1d1d 4%, var(--bg-primary))'
            : 'var(--bg-primary)',
          borderColor: isSuperadmin ? 'rgba(239,68,68,0.15)' : 'var(--border-color)',
        }}
      >
        {isSuperadmin && !collapsed && (
          <div className="mx-3 mt-4 mb-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 flex-shrink-0">
            <Shield className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Superadmin</p>
              <p className="text-xs text-red-500 truncate">{user?.name}</p>
            </div>
          </div>
        )}
        {isSuperadmin && collapsed && (
          <div className="mx-2 mt-4 mb-2 flex justify-center flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-10"
          style={{ backgroundColor: accentActive }}
        >
          <ChevronLeft
            className={cn(
              'w-4 h-4 text-white transition-transform duration-300',
              collapsed && 'rotate-180'
            )}
          />
        </button>

        <NavContent />
      </aside>

      {/* ── Mobile Drawer Overlay ────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from the left */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          width:           '72vw',
          maxWidth:        '300px',
          backgroundColor: isSuperadmin
            ? 'color-mix(in srgb, #7f1d1d 6%, var(--bg-primary))'
            : 'var(--bg-primary)',
          borderRight: `1px solid ${isSuperadmin ? 'rgba(239,68,68,0.2)' : 'var(--border-color)'}`,
          boxShadow: '8px 0 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0"
          style={{ borderColor: isSuperadmin ? 'rgba(239,68,68,0.15)' : 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 70%, #000) 100%)',
              }}
            >
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              AIRhub
            </span>
          </div>

          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Superadmin badge in drawer */}
        {isSuperadmin && (
          <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 flex-shrink-0">
            <Shield className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Superadmin</p>
              <p className="text-xs text-red-500 truncate">{user?.name}</p>
            </div>
          </div>
        )}

        {/* Nav items — close drawer when a link is tapped */}
        <NavContent onItemClick={onMobileClose} />
      </div>
    </>
  );
};