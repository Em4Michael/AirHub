import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Your Vercel deployed API URL - update this to your actual deployment URL
// Format should be: https://your-project-name.vercel.app/api
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://air-hub-server.vercel.app/api';

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
      // Server responded with error
      const { status, data } = error.response as { status: number; data: { message?: string } };

      // Don't redirect on auth endpoints
      const isAuthEndpoint = error.config?.url?.includes('/auth/');

      if (status === 401 && !isAuthEndpoint) {
        // Unauthorized - clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('airhub-token');
          if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth/login';
          }
        }
      }

      // Return the error message from the server
      return Promise.reject(error);
    }

    if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Something else went wrong
    return Promise.reject(new Error('An unexpected error occurred'));
  }
);

export default apiClient;