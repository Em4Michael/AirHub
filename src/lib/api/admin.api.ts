import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, User, Profile, Entry, WeeklyPayment } from '@/types';

export const adminApi = {
  // User management
  getPendingUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await apiClient.get('/admin/pending-users');
    return response.data;
  },

  approveUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.put(`/admin/approve/${userId}`);
    return response.data;
  },

  rejectUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.put(`/admin/reject/${userId}`);
    return response.data;
  },

  getAllUsers: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/admin/users', {
      params: { page, limit }
    });
    return response.data;
  },

  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  getUserStats: async (userId: string): Promise<ApiResponse<{
    lifetime: {
      totalHours: number;
      avgQuality: number;
      entryCount: number;
      totalEarnings: number;
    };
    weekly: {
      totalHours: number;
      avgQuality: number;
      entryCount: number;
      totalEarnings: number;
    };
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      isApproved: boolean;
    };
  }>> => {
    const response = await apiClient.get(`/admin/users/${userId}/stats`);
    return response.data;
  },

  // Weekly Payment Management
 // Weekly Payment Management
  getUserWeeklyPayments: async (userId: string): Promise<ApiResponse<WeeklyPayment[]>> => {
  const response = await apiClient.get(`/payments/users/${userId}/weekly-payments`);
  return response.data;
},

getWeeklyPayments: async (
  userId?: string,
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<PaginatedResponse<WeeklyPayment[]>> => {
  const params: any = { page, limit };
  if (userId) params.userId = userId;
  if (status) params.status = status;
  const response = await apiClient.get('/payments/weekly-payments', { params });
  return response.data;
},

markWeekAsPaid: async (data: {
  userId: string;
  weekStart: string;
  weekEnd: string;
  extraBonus?: number;
  extraBonusReason?: string;
  notes?: string;
}): Promise<ApiResponse<WeeklyPayment>> => {
  const response = await apiClient.post('/payments/mark-week-paid', data);
  return response.data;
},

updateWeeklyPayment: async (
  paymentId: string,
  data: {
    status?: string;
    extraBonus?: number;
    extraBonusReason?: string;
    notes?: string;
  }
): Promise<ApiResponse<WeeklyPayment>> => {
  const response = await apiClient.put(`/payments/weekly-payments/${paymentId}`, data);
  return response.data;
},

  // Profile management
  createProfile: async (data: {
    email: string;
    password?: string;
    fullName: string;
    state: string;
    country: string;
    accountBearerName: string;
    defaultWorker?: string;
  }): Promise<ApiResponse<Profile>> => {
    const response = await apiClient.post('/admin/profile', data);
    return response.data;
  },

  getAllProfiles: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<Profile>> => {
    const response = await apiClient.get('/admin/profiles', {
      params: { page, limit }
    });
    return response.data;
  },

  getProfileById: async (profileId: string): Promise<ApiResponse<{
    profile: Profile;
    entries: Entry[];
  }>> => {
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
    } catch (error) {
      return {
        success: true,
        data: [],
        message: 'No ranking data available'
      };
    }
  },

  // Entry management
  getAllEntries: async (
    page: number = 1, 
    limit: number = 50, 
    approved?: boolean
  ): Promise<PaginatedResponse<Entry>> => {
    const params: any = { page, limit };
    if (approved !== undefined) {
      params.approved = approved;
    }
    const response = await apiClient.get('/admin/entries', { params });
    return response.data;
  },

  vetEntry: async (data: {
    entryId: string;
    adminTime: number;
    adminQuality: number;
    adminNotes?: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient.put('/admin/vet-entry', data);
    return response.data;
  },

  // Worker Stats
    getWorkerStats: async (): Promise<ApiResponse<{
    totalUsers: number;
    totalProfiles: number;
    pendingEntries: number;
    pendingUsers: number;
    activeWorkers: number;
    totalHoursThisWeek: number;
    avgQualityThisWeek: number;
    weeklyEarnings: number;
    lifetimeEarnings: number;
  }>> => {
    try {
      const response = await apiClient.get('/admin/worker-stats');
      return response.data;
    } catch (error) {
      return {
        success: true,
        data: {
          totalUsers: 0,
          totalProfiles: 0,
          pendingEntries: 0,
          pendingUsers: 0,
          activeWorkers: 0,
          totalHoursThisWeek: 0,
          avgQualityThisWeek: 0,
          weeklyEarnings: 0,
          lifetimeEarnings: 0,
        },
        message: 'Unable to fetch stats'
      };
    }
  },

  // Worker reassignment
  reassignWorker: async (data: {
    profileId: string;
    newWorkerId: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
    permanent?: boolean;
  }): Promise<ApiResponse> => {
    const response = await apiClient.put('/admin/reassign', data);
    return response.data;
  },
};