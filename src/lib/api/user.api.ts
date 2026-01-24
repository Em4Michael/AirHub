import { apiClient } from './client';
import { ApiResponse, BankDetails, Entry, Profile, DashboardData, PaginatedResponse, User } from '@/types';

export const userApi = {
updateBankDetails: async (data: BankDetails): Promise<ApiResponse<User>> => {    const response = await apiClient.put('/user/bank', data);
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
    const response = await apiClient.put(`/dashboard/user/entry/${entryId}`, data);
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

  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await apiClient.get('/user/dashboard');
    return response.data;
  },

  getWeeklySummary: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/dashboard/user/weekly-summary');
    return response.data;
  },
};