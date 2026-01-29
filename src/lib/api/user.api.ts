import { apiClient } from './client';
import { ApiResponse, BankDetails, Entry, Profile, DashboardData, PaginatedResponse, User } from '@/types';

export const userApi = {
  updateBankDetails: async (data: BankDetails): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/user/bank', data);
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

  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await apiClient.get('/user/dashboard');
    return response.data;
  },

  getWeeklySummary: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/user/weekly-summary');
    return response.data;
  },

  /**
   * Upload profile photo using FormData (proper file upload)
   * @param file - Image file to upload
   * @returns Promise with the uploaded user data including profilePhoto
   */
  uploadProfilePhoto: async (file: File): Promise<ApiResponse<User>> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('photo', file);

    // Send to backend using multipart/form-data
    const response = await apiClient.post('/user/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Delete profile photo
   * @returns Promise with updated user data
   */
  deleteProfilePhoto: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.delete('/user/photo');
    return response.data;
  },
};