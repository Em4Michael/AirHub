'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  BarChart2,
  Award,
  Building2,
  UserCheck,
  TrendingUp,
  DollarSign,
  Shield,
  Star,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Briefcase,
  UserCog,
  BarChart,
  Activity,
} from 'lucide-react';

interface NavItem {
  label:          string;
  href?:          string;
  icon:           React.ReactNode;
  roles?:         UserRole[];
  badge?:         string;
  children?:      NavItem[];
  requireAnalyst?: boolean;
  adminOnly?:     boolean;
}

interface SidebarProps {
  collapsed:         boolean;
  onCollapsedChange: (v: boolean) => void;
  mobileOpen:        boolean;
  onMobileClose:     () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}) => {
  const { user, logout } = useAuth();
  const pathname          = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isAdmin    = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;
  const hasAnalyst = !!(user as any)?.analystBadge || isAdmin;

  // ── Auto-open group whose child is active ───────────────────────────────────
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const active = item.children.some((c) => c.href && pathname.startsWith(c.href));
        if (active) setOpenGroups((prev) => ({ ...prev, [item.label]: true }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const isActive = (href?: string) => {
    if (!href) return false;
    if (
      href === '/dashboard/user' ||
      href === '/dashboard/admin' ||
      href === '/dashboard/superadmin' ||
      href === '/dashboard/analyst'
    ) return pathname === href;
    return pathname.startsWith(href);
  };

  // ── Nav definition ─────────────────────────────────────────────────────────

  const NAV_ITEMS: NavItem[] = [
    // Worker
    { label: 'My Dashboard', href: '/dashboard/user',          icon: <LayoutDashboard className="w-5 h-5" />, roles: [UserRole.USER] },
    { label: 'My Profiles',  href: '/dashboard/user/profiles', icon: <Building2       className="w-5 h-5" />, roles: [UserRole.USER] },
    { label: 'My Entries',   href: '/dashboard/user/entries',  icon: <FileText        className="w-5 h-5" />, roles: [UserRole.USER] },
    { label: 'Earnings',     href: '/dashboard/user/bank',     icon: <DollarSign      className="w-5 h-5" />, roles: [UserRole.USER] },
    { label: 'Settings',     href: '/dashboard/user/settings', icon: <Settings        className="w-5 h-5" />, roles: [UserRole.USER] },

    // Admin
    { label: 'Admin Dashboard', href: '/dashboard/admin',                icon: <LayoutDashboard className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
    {
      label: 'Users',
      href:  user?.role === UserRole.SUPERADMIN
               ? '/dashboard/superadmin/users'
               : '/dashboard/admin/users',
      icon:  <Users className="w-5 h-5" />,
      roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
    },
    { label: 'Profiles',        href: '/dashboard/admin/profiles',       icon: <Building2       className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
    { label: 'Entries',         href: '/dashboard/admin/entries',        icon: <FileText        className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
    //{ label: 'Accounts',        href: '/dashboard/admin/accounts',       icon: <Briefcase       className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
    { label: 'Pending',         href: '/dashboard/admin/pending',        icon: <UserCheck       className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
    { label: 'Rankings',        href: '/dashboard/admin/rankings',       icon: <Award           className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
    { label: 'Top Earners',     href: '/dashboard/admin/top-earners',    icon: <TrendingUp      className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
    { label: 'Reassign',        href: '/dashboard/admin/reassign',       icon: <UserCog         className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SUPERADMIN] },

    // Superadmin
    { label: 'Super Dashboard', href: '/dashboard/superadmin',             icon: <Shield   className="w-5 h-5" />, roles: [UserRole.SUPERADMIN] },
    { label: 'Benchmarks',      href: '/dashboard/superadmin/benchmarks', icon: <BarChart className="w-5 h-5" />, roles: [UserRole.SUPERADMIN] },
    { label: 'Bonuses',         href: '/dashboard/superadmin/bonuses',    icon: <Star     className="w-5 h-5" />, roles: [UserRole.SUPERADMIN] },
    { label: 'System',          href: '/dashboard/superadmin/system',     icon: <Activity className="w-5 h-5" />, roles: [UserRole.SUPERADMIN] },

    // ── Online Data Analyst (users with badge + admins) ──────────────────────
    {
      label:          'Online Data Analyst',
      icon:           <BarChart2 className="w-5 h-5" />,
      requireAnalyst: true,
      children: [
        { label: 'Dashboard',      href: '/dashboard/analyst',             icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Profiles',       href: '/dashboard/analyst/profiles',    icon: <Building2       className="w-4 h-4" /> },
        { label: 'Top Earners',    href: '/dashboard/analyst/top-earners', icon: <Award           className="w-4 h-4" /> },
        { label: 'Administration', href: '/dashboard/analyst/admin',            icon: <Shield    className="w-4 h-4" />, adminOnly: true },
        { label: 'Accounts',       href: '/dashboard/analyst/admin/accounts',   icon: <Briefcase className="w-4 h-4" />, adminOnly: true },
        { label: 'Production',     href: '/dashboard/analyst/admin/production', icon: <BarChart2 className="w-4 h-4" />, adminOnly: true },
      ],
    },
  ];

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requireAnalyst) return hasAnalyst;
    if (item.roles && user)  return item.roles.includes(user.role);
    return true;
  });

  // ── Render a single nav item ────────────────────────────────────────────────

  const renderItem = (item: NavItem, depth = 0) => {
    if (item.adminOnly && !isAdmin) return null;

    const hasChildren   = !!(item.children?.length);
    const isOpen        = !!openGroups[item.label];
    const active        = isActive(item.href);
    const paddingLeft   = depth > 0 ? 'pl-9' : '';

    // ── Group with children ──────────────────────────────────────────────────
    if (hasChildren) {
      const anyChildActive = item.children!.some(
        (c) => c.href && pathname.startsWith(c.href)
      );
      return (
        <div key={item.label}>
          <button
            onClick={() => {
              if (!collapsed) toggleGroup(item.label);
              else { onCollapsedChange(false); toggleGroup(item.label); }
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: anyChildActive
                ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)'
                : 'transparent',
              color: anyChildActive ? 'var(--accent-color)' : 'var(--text-secondary)',
            }}
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {isOpen
                  ? <ChevronDown  className="w-4 h-4 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
              </>
            )}
          </button>

          {!collapsed && isOpen && (
            <div className="mt-0.5 space-y-0.5">
              {item.children!.map((child) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // ── Leaf link ────────────────────────────────────────────────────────────
    if (!item.href) return null;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onMobileClose}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${paddingLeft}`}
        style={{
          backgroundColor: active ? 'var(--accent-color)' : 'transparent',
          color:           active ? '#ffffff'              : 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'color-mix(in srgb, var(--accent-color) 10%, transparent)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }
        }}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-color)' }}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  // ── Build nav with section dividers ────────────────────────────────────────

  const buildNav = () => {
    const elements: React.ReactNode[] = [];

    visibleItems.forEach((item, idx) => {
      // Divider + label before analyst group
      if (item.requireAnalyst && idx > 0) {
        elements.push(
          <div key="div-analyst" className="my-2 mx-1 h-px"
            style={{ backgroundColor: 'var(--border-color)' }} />
        );
        if (!collapsed) {
          elements.push(
            <p key="lbl-analyst"
              className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}>
              Analyst Role
            </p>
          );
        }
      }

      // Divider before superadmin
      if (
        item.roles?.includes(UserRole.SUPERADMIN) &&
        !item.roles.includes(UserRole.ADMIN) &&
        idx > 0
      ) {
        const prev = visibleItems[idx - 1];
        const prevIsSuperAdmin =
          prev?.roles?.includes(UserRole.SUPERADMIN) && !prev.roles.includes(UserRole.ADMIN);
        if (!prevIsSuperAdmin) {
          elements.push(
            <div key="div-super" className="my-2 mx-1 h-px"
              style={{ backgroundColor: 'var(--border-color)' }} />
          );
          if (!collapsed) {
            elements.push(
              <p key="lbl-super"
                className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>
                Super Admin
              </p>
            );
          }
        }
      }

      elements.push(renderItem(item));
    });

    return elements;
  };

  // ── Desktop sidebar width ───────────────────────────────────────────────────
  const desktopWidth = collapsed ? '4.5rem' : '16rem';

  return (
    <>
      {/* ── Mobile backdrop — closes sidebar when tapped ──────────────────── */}
      <div
        className={`
          fixed inset-0 z-30 lg:hidden transition-opacity duration-300
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* ── Sidebar panel ────────────────────────────────────────────────── */}
      <aside
        data-sidebar
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)]
          flex flex-col transition-transform duration-300 ease-in-out
          lg:sticky lg:top-16 lg:z-auto lg:translate-x-0
          lg:transition-[width] lg:duration-300
        `}
        style={{
          /* Mobile: always full width drawer, slide in/out */
          width:           'min(16rem, 85vw)',
          transform:       mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          backgroundColor: 'var(--bg-secondary)',
          borderRight:     '1px solid var(--border-color)',

          /* Desktop overrides via inline style + Tailwind lg: classes above */
        } as React.CSSProperties}
      >
        {/* Apply desktop collapsed width via a wrapper trick */}
        <style>{`
          @media (min-width: 1024px) {
            aside[data-sidebar] {
              width: ${desktopWidth} !important;
              transform: translateX(0) !important;
            }
          }
        `}</style>

        {/* Collapse toggle — desktop only */}
        <div
          className="hidden lg:flex items-center justify-end px-3 py-2 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <PanelLeftOpen  className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* User pill */}
        {!collapsed && user && (
          <div
            className="mx-3 mt-3 mb-1 p-3 rounded-2xl flex items-center gap-3 flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-color)' }}
            >
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {user.name}
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {user.role}
                </p>
                {(user as any).analystBadge && (
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  >
                    ANALYST
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed avatar (desktop only) */}
        {collapsed && user && (
          <div className="hidden lg:flex justify-center mt-3 mb-1 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: 'var(--accent-color)' }}
              title={user.name}
            >
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {buildNav()}
        </nav>

        {/* Logout */}
        <div
          className="px-3 py-3 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            onClick={() => { logout(); onMobileClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444420';
              (e.currentTarget as HTMLElement).style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};