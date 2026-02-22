import { apiClient } from './client';
import { ApiResponse, User, Benchmark, WeeklyPayment } from '@/types';

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
    payPerHour?: number | null;
    notes?: string;
    thresholds?: {
      excellent: number;
      good: number;
      average: number;
      minimum: number;
    };
    bonusRates?: {
      excellent: number;
      good: number;
      average: number;
      minimum: number;
      below: number;
    };
  }): Promise<ApiResponse<Benchmark>> => {
    const response = await apiClient.post('/superadmin/benchmark', data);
    return response.data;
  },

  /**
   * FIX (Issue: Failed to load benchmarks)
   * The benchmark page calls superadminApi.getBenchmarks(1, 50).
   * The original file had this method named getAllBenchmarks (no params) so
   * every call returned a function-not-found error at runtime.
   * Renamed to getBenchmarks and accepts optional page/limit.
   */
  getBenchmarks: async (
    page?: number,
    limit?: number
  ): Promise<ApiResponse<Benchmark[]>> => {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;
    const response = await apiClient.get('/superadmin/benchmarks', { params });
    // Server may return { success, count, data: [] } — ensure .data is always the array
    const result = response.data;
    if (result && Array.isArray(result)) {
      return { success: true, data: result, message: '' };
    }
    return result;
  },

  /** Alias kept for backward compat */
  getAllBenchmarks: async (): Promise<ApiResponse<Benchmark[]>> => {
    const response = await apiClient.get('/superadmin/benchmarks');
    return response.data;
  },

  getCurrentBenchmark: async (): Promise<ApiResponse<Benchmark>> => {
    const response = await apiClient.get('/superadmin/benchmark/current');
    return response.data;
  },

  /** FIX: was missing — benchmark edit modal calls this */
  updateBenchmark: async (
    benchmarkId: string,
    data: {
      timeBenchmark?: number;
      qualityBenchmark?: number;
      startDate?: string;
      endDate?: string;
      payPerHour?: number | null;
      notes?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<Benchmark>> => {
    const response = await apiClient.put(`/superadmin/benchmark/${benchmarkId}`, data);
    return response.data;
  },

  /** FIX: was missing — benchmark delete button calls this */
  deleteBenchmark: async (benchmarkId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/superadmin/benchmark/${benchmarkId}`);
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

  approvePayment: async (paymentId: string): Promise<ApiResponse<WeeklyPayment>> => {
    const response = await apiClient.put(`/superadmin/payments/${paymentId}/approve`);
    return response.data;
  },

  denyPayment: async (
    paymentId: string,
    reason?: string
  ): Promise<ApiResponse<WeeklyPayment>> => {
    const response = await apiClient.put(`/superadmin/payments/${paymentId}/deny`, { reason });
    return response.data;
  },
};