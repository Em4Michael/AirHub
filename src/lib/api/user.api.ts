import { apiClient } from './client';
import { ApiResponse, BankDetails, Entry, Profile, PaginatedResponse, User, DashboardApiResponse } from '@/types';

export const userApi = {
  updateBankDetails: async (data: BankDetails): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/user/bank', data);
    return response.data;
  },

  /**
   * FIX (Issue: Failed to update phone number)
   * This method was completely missing from user.api.ts.
   * The profile page calls userApi.updateProfile({ phone }) — without this
   * method the call threw "userApi.updateProfile is not a function".
   * Route: PUT /user/profile  →  userController.updateProfile
   */
  updateProfile: async (data: { name?: string; phone?: string }): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/user/profile', data);
    return response.data;
  },

  getAssignedProfiles: async (): Promise<ApiResponse<Profile[]>> => {
    const response = await apiClient.get('/user/profiles');
    return response.data;
  },

  createEntry: async (data: {
    profileId: string;
    date: string;
    time: number;
    quality: number;
    notes?: string;
  }): Promise<ApiResponse<Entry>> => {
    const response = await apiClient.post('/user/entry', data);
    return response.data;
  },

  updateEntry: async (
    entryId: string,
    data: { time?: number; quality?: number; notes?: string }
  ): Promise<ApiResponse<Entry>> => {
    const response = await apiClient.put(`/user/entry/${entryId}`, data);
    return response.data;
  },

  getMyEntries: async (
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Entry>> => {
    const response = await apiClient.get('/user/entries', {
      params: { page, limit },
    });
    return response.data;
  },

  getDashboard: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<DashboardApiResponse>> => {
    const response = await apiClient.get('/user/dashboard', { params });
    return response.data;
  },

  getWeeklySummary: async (params?: {
    weekStart?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/user/weekly-summary', { params });
    return response.data;
  },

  getMyPayments: async (
    page: number = 1,
    limit: number = 100
  ): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/user/payments', { params: { page, limit } });
    return response.data;
  },

  uploadProfilePhoto: async (file: File): Promise<ApiResponse<{ profilePhoto: string }>> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }
    const formData = new FormData();
    formData.append('photo', file);
    const response = await apiClient.put('/user/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteProfilePhoto: async (): Promise<ApiResponse<{ profilePhoto: null }>> => {
    const response = await apiClient.delete('/user/profile-photo');
    return response.data;
  },
};