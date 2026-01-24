import { UserRole } from '@/types';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  
  // User routes
  USER_DASHBOARD: '/dashboard/user',
  USER_PROFILES: '/dashboard/user/profiles',
  USER_ENTRIES: '/dashboard/user/entries',
  USER_NEW_ENTRY: '/dashboard/user/entries/new',
  USER_BANK: '/dashboard/user/bank',
  USER_SETTINGS: '/dashboard/user/settings',
  
  // Admin routes
  ADMIN_DASHBOARD: '/dashboard/admin',
  ADMIN_USERS: '/dashboard/admin/users',
  ADMIN_USER_DETAIL: (id: string) => `/dashboard/admin/users/${id}`,
  ADMIN_PROFILES: '/dashboard/admin/profiles',
  ADMIN_NEW_PROFILE: '/dashboard/admin/profiles/new',
  ADMIN_PROFILE_DETAIL: (id: string) => `/dashboard/admin/profiles/${id}`,
  ADMIN_ENTRIES: '/dashboard/admin/entries',
  ADMIN_PENDING: '/dashboard/admin/pending',
  ADMIN_RANKINGS: '/dashboard/admin/rankings',
  ADMIN_REASSIGN: '/dashboard/admin/reassign',
  
  // Superadmin routes
  SUPERADMIN_DASHBOARD: '/dashboard/superadmin',
  SUPERADMIN_USERS: '/dashboard/superadmin/users',
  SUPERADMIN_BENCHMARKS: '/dashboard/superadmin/benchmarks',
  SUPERADMIN_NEW_BENCHMARK: '/dashboard/superadmin/benchmarks/new',
  SUPERADMIN_BONUSES: '/dashboard/superadmin/bonuses',
  SUPERADMIN_SYSTEM: '/dashboard/superadmin/system',
};

export const ROLE_ROUTES = {
  [UserRole.USER]: ROUTES.USER_DASHBOARD,
  [UserRole.ADMIN]: ROUTES.ADMIN_DASHBOARD,
  [UserRole.SUPERADMIN]: ROUTES.SUPERADMIN_DASHBOARD,
};