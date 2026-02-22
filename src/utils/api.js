import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('airhub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('airhub_token');
      localStorage.removeItem('airhub_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

// User API
export const userAPI = {
  updateBank: (data) => api.put('/dashboard/user/bank', data),
  getProfiles: () => api.get('/dashboard/user/profiles'),
  createEntry: (data) => api.post('/dashboard/user/entry', data),
  updateEntry: (id, data) => api.put(`/dashboard/user/entry/${id}`, data),
  getEntries: (params) => api.get('/dashboard/user/entries', { params }),
  getDashboard: () => api.get('/dashboard/user/dashboard'),
  getWeeklySummary: () => api.get('/dashboard/user/weekly-summary'),
};

// Admin API
export const adminAPI = {
  getPendingUsers: () => api.get('/dashboard/admin/pending-users'),
  approveUser: (id) => api.put(`/dashboard/admin/approve/${id}`),
  rejectUser: (id) => api.put(`/dashboard/admin/reject/${id}`),
  getUsers: (params) => api.get('/dashboard/admin/users', { params }),
  getUserById: (id) => api.get(`/dashboard/admin/users/${id}`),
  createProfile: (data) => api.post('/dashboard/admin/profile', data),
  getProfiles: (params) => api.get('/dashboard/admin/profiles', { params }),
  getProfileById: (id) => api.get(`/dashboard/admin/profile/${id}`),
  updateProfile: (id, data) => api.put(`/dashboard/admin/profile/${id}`, data),
  getRankedProfiles: () => api.get('/dashboard/admin/ranked-profiles'),
  getEntries: (params) => api.get('/dashboard/admin/entries', { params }),
  vetEntry: (data) => api.put('/dashboard/admin/vet-entry', data),
  reassignWorker: (data) => api.put('/dashboard/admin/reassign', data),
  getWorkerStats: () => api.get('/dashboard/admin/worker-stats'),
};

// Superadmin API
export const superadminAPI = {
  promoteUser: (id) => api.put(`/dashboard/superadmin/promote/${id}`),
  demoteUser: (id) => api.put(`/dashboard/superadmin/demote/${id}`),
  revokeAccess: (id) => api.put(`/dashboard/superadmin/revoke/${id}`),
  restoreAccess: (id) => api.put(`/dashboard/superadmin/restore/${id}`),
  deleteUser: (id) => api.delete(`/dashboard/superadmin/delete/${id}`),
  approveAll: () => api.put('/dashboard/superadmin/approve-all'),
  createBenchmark: (data) => api.post('/dashboard/superadmin/benchmark', data),
  getBenchmarks: () => api.get('/dashboard/superadmin/benchmarks'),
  getCurrentBenchmark: () => api.get('/dashboard/superadmin/benchmark/current'),
  updateBenchmark: (id, data) => api.put(`/dashboard/superadmin/benchmark/${id}`, data),
  addBonus: (id, data) => api.put(`/dashboard/superadmin/bonus/${id}`, data),
  resetBonus: (id) => api.put(`/dashboard/superadmin/bonus/${id}/reset`),
  getStats: () => api.get('/dashboard/superadmin/stats'),
};

export default api;
