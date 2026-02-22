import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Use live server — override with NEXT_PUBLIC_API_URL env var if needed
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://airhub-server.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('airhub-token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response as { status: number };
      const isAuthEndpoint = error.config?.url?.includes('/auth/');

      if (status === 401 && !isAuthEndpoint) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('airhub-token');
          if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth/login';
          }
        }
      }

      return Promise.reject(error);
    }

    if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    return Promise.reject(new Error('An unexpected error occurred'));
  }
);

export default apiClient;