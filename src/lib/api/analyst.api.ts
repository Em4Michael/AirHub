import { apiClient } from '@/lib/api/client';
import {
  ApiResponse,
  AnalystBenchmark,
  AnalystProfile,
  AnalystSession,
  AnalystPayment,
  AnalystDashboard,
  AnalystEarner,
  AnalystSettings,
  AccountStats,
  AccountListRow,
  AnalystProduction,
} from '@/types';

// ── Shared (user + admin) ─────────────────────────────────────────────────────

export const analystApi = {
  // Dashboard
  getDashboard: async (): Promise<ApiResponse<AnalystDashboard>> => {
    const r = await apiClient.get('/analyst/dashboard');
    return r.data;
  },

  // Profiles
  getProfiles: async (): Promise<ApiResponse<AnalystProfile[]>> => {
    const r = await apiClient.get('/analyst/profiles');
    return r.data;
  },

  claimProfile: async (profileId: string): Promise<ApiResponse<any>> => {
    const r = await apiClient.post(`/analyst/profiles/${profileId}/claim`);
    return r.data;
  },

  /**
   * Return a claimed profile. The worker now enters hours worked directly
   * (a single positive number) instead of clock-in/clock-out times.
   */
  returnProfile: async (
    sessionId: string,
    data: { hours: number; notes?: string }
  ): Promise<ApiResponse<AnalystSession>> => {
    const r = await apiClient.post(`/analyst/sessions/${sessionId}/return`, data);
    return r.data;
  },

  // My sessions
  getMySessions: async (params?: {
    month?: number;
    year?:  number;
    page?:  number;
    limit?: number;
  }): Promise<ApiResponse<AnalystSession[]>> => {
    const r = await apiClient.get('/analyst/my-sessions', { params });
    return r.data;
  },

  // My payments
  getMyPayments: async (): Promise<ApiResponse<AnalystPayment[]>> => {
    const r = await apiClient.get('/analyst/my-payments');
    return r.data;
  },

  // Top earners
  getTopEarners: async (params?: {
    month?: number;
    year?:  number;
  }): Promise<ApiResponse<{ earners: AnalystEarner[]; month: number; year: number; hourlyRate: number; currentUserEntry: AnalystEarner | null }>> => {
    const r = await apiClient.get('/analyst/top-earners', { params });
    return r.data;
  },

  // ── Admin ───────────────────────────────────────────────────────────────────

  // Global settings (read: admin, write: superadmin — enforced server-side)
  getSettings: async (): Promise<ApiResponse<AnalystSettings>> => {
    const r = await apiClient.get('/analyst/admin/settings');
    return r.data;
  },
  updateSettings: async (data: { maxHoursPerDay: number }): Promise<ApiResponse<AnalystSettings>> => {
    const r = await apiClient.put('/analyst/admin/settings', data);
    return r.data;
  },

  // Benchmarks
  createBenchmark: async (data: Partial<AnalystBenchmark>): Promise<ApiResponse<AnalystBenchmark>> => {
    const r = await apiClient.post('/analyst/benchmarks', data);
    return r.data;
  },
  getBenchmarks: async (): Promise<ApiResponse<AnalystBenchmark[]>> => {
    const r = await apiClient.get('/analyst/benchmarks');
    return r.data;
  },
  updateBenchmark: async (id: string, data: Partial<AnalystBenchmark>): Promise<ApiResponse<AnalystBenchmark>> => {
    const r = await apiClient.put(`/analyst/benchmarks/${id}`, data);
    return r.data;
  },

  // Admin profiles
  adminGetProfiles: async (): Promise<ApiResponse<AnalystProfile[]>> => {
    const r = await apiClient.get('/analyst/admin/profiles');
    return r.data;
  },
  createProfile: async (data: Partial<AnalystProfile>): Promise<ApiResponse<AnalystProfile>> => {
    const r = await apiClient.post('/analyst/admin/profiles', data);
    return r.data;
  },
  updateProfile: async (id: string, data: Partial<AnalystProfile>): Promise<ApiResponse<AnalystProfile>> => {
    const r = await apiClient.put(`/analyst/admin/profiles/${id}`, data);
    return r.data;
  },
  deleteProfile: async (id: string): Promise<ApiResponse<void>> => {
    const r = await apiClient.delete(`/analyst/admin/profiles/${id}`);
    return r.data;
  },
  addWorkerToPool: async (profileId: string, userId: string): Promise<ApiResponse<AnalystProfile>> => {
    const r = await apiClient.post(`/analyst/admin/profiles/${profileId}/pool`, { userId });
    return r.data;
  },
  removeWorkerFromPool: async (profileId: string, userId: string): Promise<ApiResponse<AnalystProfile>> => {
    const r = await apiClient.delete(`/analyst/admin/profiles/${profileId}/pool/${userId}`);
    return r.data;
  },

  /** Superadmin only: force-return a claimed account on a worker's behalf. */
  forceReturnProfile: async (profileId: string, reason?: string): Promise<ApiResponse<any>> => {
    const r = await apiClient.post(`/analyst/admin/profiles/${profileId}/force-return`, { reason });
    return r.data;
  },

  // Accounts list + per-account stats + global production
  getAccounts: async (params?: {
    page?: number; limit?: number; search?: string; status?: 'available' | 'claimed';
  }): Promise<ApiResponse<AccountListRow[]>> => {
    const r = await apiClient.get('/analyst/admin/accounts', { params });
    return r.data;
  },
  getAccountStats: async (id: string): Promise<ApiResponse<AccountStats>> => {
    const r = await apiClient.get(`/analyst/admin/accounts/${id}/stats`);
    return r.data;
  },
  getProduction: async (): Promise<ApiResponse<AnalystProduction>> => {
    const r = await apiClient.get('/analyst/admin/production');
    return r.data;
  },

  // User badges — now supports search + badge filter
  getAnalystUsers: async (params?: {
    page?: number; limit?: number; search?: string; badge?: 'badged' | 'nobadge';
  }): Promise<ApiResponse<any[]>> => {
    const r = await apiClient.get('/analyst/admin/users', { params });
    return r.data;
  },
  grantBadge: async (userId: string): Promise<ApiResponse<any>> => {
    const r = await apiClient.post(`/analyst/admin/users/${userId}/badge`);
    return r.data;
  },
  revokeBadge: async (userId: string): Promise<ApiResponse<any>> => {
    const r = await apiClient.delete(`/analyst/admin/users/${userId}/badge`);
    return r.data;
  },

  // Sessions (admin)
  adminGetSessions: async (params?: {
    status?: string; userId?: string; profileId?: string;
    month?: number;  year?: number;   page?: number; limit?: number;
  }): Promise<ApiResponse<AnalystSession[]>> => {
    const r = await apiClient.get('/analyst/admin/sessions', { params });
    return r.data;
  },
  approveSession: async (id: string, data?: { adminHours?: number; adminNotes?: string }): Promise<ApiResponse<AnalystSession>> => {
    const r = await apiClient.put(`/analyst/admin/sessions/${id}/approve`, data ?? {});
    return r.data;
  },
  rejectSession: async (id: string, data: { reason?: string; adminNotes?: string }): Promise<ApiResponse<AnalystSession>> => {
    const r = await apiClient.put(`/analyst/admin/sessions/${id}/reject`, data);
    return r.data;
  },

  // Payments (admin)
  adminGetPayments: async (params?: {
    userId?: string; month?: number; year?: number; status?: string;
  }): Promise<ApiResponse<AnalystPayment[]>> => {
    const r = await apiClient.get('/analyst/admin/payments', { params });
    return r.data;
  },
  markPaymentPaid: async (data: { userId: string; month: number; year: number }): Promise<ApiResponse<AnalystPayment>> => {
    const r = await apiClient.post('/analyst/admin/payments/mark-paid', data);
    return r.data;
  },
  approvePayment: async (id: string): Promise<ApiResponse<AnalystPayment>> => {
    const r = await apiClient.put(`/analyst/admin/payments/${id}/approve`);
    return r.data;
  },
};