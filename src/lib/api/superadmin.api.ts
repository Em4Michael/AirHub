import { apiClient } from './client';
import { ApiResponse, User, Benchmark } from '@/types';

export const superadminApi = {
  promoteToAdmin: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/superadmin/promote/${userId}`);
    return response.data;
  },

  demoteToUser: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/superadmin/demote/${userId}`);
    return response.data;
  },

  revokeAccess: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/superadmin/revoke/${userId}`);
    return response.data;
  },

  restoreAccess: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/superadmin/restore/${userId}`);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/superadmin/delete/${userId}`);
    return response.data;
  },

  approveAllPending: async (): Promise<ApiResponse> => {
    const response = await apiClient.put('/superadmin/approve-all');
    return response.data;
  },

  createBenchmark: async (data: {
    timeBenchmark: number;
    qualityBenchmark: number;
    startDate: string;
    endDate: string;
    thresholds: {
      excellent: number;
      good: number;
      average: number;
      minimum: number;
    };
    bonusRates: {
      excellent: number;
      good: number;
      average: number;
      minimum: number;
      below: number;
    };
    notes?: string;
  }): Promise<ApiResponse<Benchmark>> => {
    const response = await apiClient.post('/superadmin/benchmark', data);
    return response.data;
  },

  getAllBenchmarks: async (): Promise<ApiResponse<Benchmark[]>> => {
    const response = await apiClient.get('/superadmin/benchmarks');
    return response.data;
  },

  getCurrentBenchmark: async (): Promise<ApiResponse<Benchmark>> => {
    const response = await apiClient.get('/superadmin/benchmark/current');
    return response.data;
  },

  addExtraBonus: async (
    userId: string,
    data: { amount: number; reason: string }
  ): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/superadmin/bonus/${userId}`, data);
    return response.data;
  },

  resetExtraBonus: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/superadmin/bonus/${userId}/reset`);
    return response.data;
  },

  getSystemStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/superadmin/stats');
    return response.data;
  },
};