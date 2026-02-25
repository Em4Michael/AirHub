import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, User, Profile, Entry, WeeklyPayment } from '@/types';

export const adminApi = {
  // -------------------------------------------------------------------------
  // User management
  // -------------------------------------------------------------------------

  getPendingUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await apiClient.get('/admin/pending-users');
    return response.data;
  },

  approveUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.put(`/admin/approve/${userId}`);
    return response.data;
  },

  getAllUsers: async (page = 1, limit = 20): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/admin/users', { params: { page, limit } });
    return response.data;
  },

  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  getUserStats: async (userId: string): Promise<ApiResponse<{
    lifetime: { totalHours: number; avgQuality: number; entryCount: number; totalEarnings: number };
    weekly:   { totalHours: number; avgQuality: number; entryCount: number; totalEarnings: number };
    user: {
      id: string; name: string; email: string; phone?: string | null;
      role: string; status: string; isApproved: boolean; weekStartDay: number;
      bankDetails?: import('@/types').BankDetails;
      extraBonus?: number; extraBonusReason?: string;
    };
    currentWeekRange: { weekStart: string; weekEnd: string };
    payments: WeeklyPayment[];
    /** Daily approved entries — populated when the stats endpoint includes them */
    dailyData?: Array<{
      _id?: string;
      date: string;
      time?: number;
      quality?: number;
      effectiveTime?: number;
      effectiveQuality?: number;
      adminApproved?: boolean;
      notes?: string;
      profile?: string;
    }>;
  }>> => {
    const response = await apiClient.get(`/admin/users/${userId}/stats`);
    return response.data;
  },

  getUserEarnings: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/admin/users/${userId}/earnings`);
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Weekly Payment Management
  // -------------------------------------------------------------------------

  getUserWeeklyPayments: async (userId: string): Promise<ApiResponse<WeeklyPayment[]>> => {
    const response = await apiClient.get(`/admin/users/${userId}/weekly-payments`);
    return response.data;
  },

  getWeeklyPayments: async (
    userId?: string, page = 1, limit = 20, status?: string, paymentType?: string
  ): Promise<PaginatedResponse<WeeklyPayment[]>> => {
    const params: Record<string, any> = { page, limit };
    if (userId)      params.userId      = userId;
    if (status)      params.status      = status;
    if (paymentType) params.paymentType = paymentType;
    const response = await apiClient.get('/admin/weekly-payments', { params });
    return response.data;
  },

  approvePayment: async (paymentId: string): Promise<ApiResponse<WeeklyPayment>> => {
    const response = await apiClient.put(`/admin/weekly-payments/${paymentId}/approve`);
    return response.data;
  },

  denyPayment: async (paymentId: string, reason?: string): Promise<ApiResponse<WeeklyPayment>> => {
    const response = await apiClient.put(`/admin/weekly-payments/${paymentId}/deny`, { reason });
    return response.data;
  },

  /**
   * Mark a specific week as paid.
   * Sends userId + weekStart only — server derives weekEnd from weekStartDay.
   */
  markWeekAsPaid: async (data: {
    userId: string;
    weekStart: string;
    extraBonus?: number;
    extraBonusReason?: string;
    notes?: string;
  }): Promise<ApiResponse<WeeklyPayment>> => {
    const response = await apiClient.post('/admin/mark-week-paid', data);
    return response.data;
  },

  /**
   * Mark the pending bonus as paid.
   * Logic (handled server-side):
   *   1. Find the most recent unpaid WeeklyPayment for this user
   *      → if found: add extraBonus to it, then mark it paid
   *   2. If no unpaid week exists (all weeks already paid):
   *      → find the next/current week's payment (or create it)
   *      → add extraBonus, mark paid
   *   3. Clear user.extraBonus to 0 after either path
   *
   * Backend: POST /api/admin/users/:userId/mark-bonus-paid
   */
  markBonusPaid: async (userId: string): Promise<ApiResponse<WeeklyPayment>> => {
    const response = await apiClient.post(`/admin/users/${userId}/mark-bonus-paid`);
    return response.data;
  },

  updateWeeklyPayment: async (
    paymentId: string,
    data: { status?: string; extraBonus?: number; extraBonusReason?: string; notes?: string }
  ): Promise<ApiResponse<WeeklyPayment>> => {
    const response = await apiClient.put(`/admin/weekly-payments/${paymentId}`, data);
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Profile management
  // -------------------------------------------------------------------------

  createProfile: async (data: {
    email: string; password?: string; fullName: string;
    state: string; country: string; accountBearerName: string;
    defaultWorker?: string; secondWorker?: string;
  }): Promise<ApiResponse<Profile>> => {
    const response = await apiClient.post('/admin/profile', data);
    return response.data;
  },

  getAllProfiles: async (page = 1, limit = 20): Promise<PaginatedResponse<Profile>> => {
    const response = await apiClient.get('/admin/profiles', { params: { page, limit } });
    return response.data;
  },

  getProfileById: async (profileId: string): Promise<ApiResponse<{ profile: Profile; entries: Entry[] }>> => {
    const response = await apiClient.get(`/admin/profile/${profileId}`);
    return response.data;
  },

  updateProfile: async (profileId: string, data: Partial<Profile>): Promise<ApiResponse<Profile>> => {
    const response = await apiClient.put(`/admin/profile/${profileId}`, data);
    return response.data;
  },

  deleteProfile: async (profileId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/profile/${profileId}`);
    return response.data;
  },

  getRankedProfiles: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await apiClient.get('/admin/ranked-profiles');
      return response.data;
    } catch {
      return { success: true, data: [], message: 'No ranking data available' };
    }
  },

  // -------------------------------------------------------------------------
  // Entry management
  // -------------------------------------------------------------------------

  getAllEntries: async (page = 1, limit = 500, approved?: boolean): Promise<PaginatedResponse<Entry>> => {
    const params: Record<string, any> = { page, limit };
    if (approved !== undefined) params.approved = approved;
    const response = await apiClient.get('/admin/entries', { params });
    return response.data;
  },

  vetEntry: async (data: {
    entryId: string; adminTime: number; adminQuality: number; adminNotes?: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.post('/admin/vet-entry', data);
    return response.data;
  },

  deleteEntry: async (entryId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/admin/entries/${entryId}`);
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Worker Stats
  // -------------------------------------------------------------------------

  getWorkerStats: async (): Promise<ApiResponse<{
    totalUsers: number; totalProfiles: number; pendingEntries: number;
    pendingUsers: number; activeWorkers: number; totalHoursThisWeek: number;
    avgQualityThisWeek: number; weeklyEarnings: number; lifetimeEarnings: number;
  }>> => {
    try {
      const response = await apiClient.get('/admin/worker-stats');
      return response.data;
    } catch {
      return {
        success: true,
        data: {
          totalUsers: 0, totalProfiles: 0, pendingEntries: 0, pendingUsers: 0,
          activeWorkers: 0, totalHoursThisWeek: 0, avgQualityThisWeek: 0,
          weeklyEarnings: 0, lifetimeEarnings: 0,
        },
        message: 'Unable to fetch stats',
      };
    }
  },

  // -------------------------------------------------------------------------
  // Worker reassignment
  // -------------------------------------------------------------------------

  reassignWorker: async (data: {
    profileId: string; newWorkerId: string; startDate?: string; endDate?: string;
    reason?: string; permanent?: boolean; slot?: 'default' | 'second';
  }): Promise<ApiResponse> => {
    const response = await apiClient.put('/admin/reassign', data);
    return response.data;
  },
};