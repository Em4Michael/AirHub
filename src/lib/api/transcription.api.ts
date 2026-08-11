/**
 * transcription.api.ts
 *
 * Frontend API client for the Transcription Analyst role.
 * Mirrors the shape of analyst.api.ts so the pattern is familiar.
 * Mount your axios instance the same way you do for analyst — just
 * replace the base path from /analyst to /transcription.
 */
import { apiClient } from './client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptionBenchmark {
  _id:            string;
  minutesPerTask: number;
  ratePerHour:    number;
  weekStart:      string;
  weekEnd:        string;
  isActive:       boolean;
  notes?:         string;
  createdAt:      string;
}

export interface TranscriptionSettings {
  _id:            string;
  maxTasksPerDay: number;
}

export interface TranscriptionProfile {
  _id:               string;
  name:              string;
  description?:      string;
  accountBearerName: string;
  email?:            string;
  state?:            string;
  country?:          string;
  accountName?:      string;
  loginDetails?:     string;
  loginMethod?:      string;
  workerPool:        any[];
  currentHolder?:    any;
  claimedAt?:        string;
  isActive:          boolean;
  isTerminated:      boolean;
  isAvailable:       boolean;
  isMine?:           boolean;
  inPool?:           boolean;
  // Enriched by getPublicTranscriptionProfiles
  today?:            number;
  thisWeek?:         number;
  thisMonth?:        number;
  allTime?:          number;
  workerBreakdown?:  WorkerTaskSlice[];
  pendingTasks?:     number;
  maxTasksPerDay?:   number;
  caps?:             { daily: number; weekly: number; monthly: number };
}

export interface WorkerTaskSlice {
  id:      string;
  name:    string;
  today:   number;
  week:    number;
  month:   number;
  allTime: number;
}

export interface TranscriptionSession {
  _id:            string;
  worker:         any;
  profile:        any;
  claimedAt:      string;
  returnedAt?:    string;
  sessionDate?:   string;
  tasksLogged:    number;
  adminTasks?:    number;
  effectiveTasks: number;
  notes?:         string;
  adminNotes?:    string;
  status:         'active' | 'pending' | 'approved' | 'rejected';
  week:           number;
  year:           number;
  minutesPerTask: number;
  ratePerHour:    number;
}

export interface TranscriptionPayment {
  _id:           string;
  user:          any;
  week:          number;
  year:          number;
  weekStart:     string;
  weekEnd:       string;
  totalTasks:    number;
  sessionCount:  number;
  minutesPerTask:number;
  ratePerHour:   number;
  totalEarnings: number;
  status:        'pending' | 'approved' | 'paid' | 'denied';
  paid:          boolean;
  paidDate?:     string;
}

export interface TranscriptionDashboard {
  currentWeek:     { week: number; year: number; weekStart: string; weekEnd: string };
  totalTasks:      number;
  pendingTasks:    number;
  earnings:        number;
  pendingEarnings: number;
  minutesPerTask:  number;
  ratePerHour:     number;
  sessionCount:    number;
  approvedCount:   number;
  pendingCount:    number;
  dailyBreakdown:  { day: string; tasks: number; earnings: number }[];
  lifetimeTasks:   number;
  lifetimeEarnings:number;
  payment?:        TranscriptionPayment;
  heldProfile?:    any;
  activeSession?:  TranscriptionSession;
  maxTasksPerDay:  number;
}

export interface TranscriptionEarner {
  rank:          number;
  userId:        string;
  name:          string;
  tasks:         number;
  earnings:      number;
  sessions:      number;
  isCurrentUser: boolean;
}

export interface TranscriptionProduction {
  totals:         { today: number; week: number; month: number; allTime: number };
  earnings:       { today: number; week: number; month: number; allTime: number };
  adminCut:       { rate: number; today: number; week: number; month: number; allTime: number };
  minutesPerTask: number;
  ratePerHour:    number;
  maxTasksPerDay: number;
  accountCount:   number;
  activeClaims:   number;
  sessionCount:   number;
  topAccounts:    any[];
  topWorkers:     any[];
  trend:          { date: string; tasks: number }[];
}

// ── API helpers ───────────────────────────────────────────────────────────────

type ApiResponse<T = any> = {
  success:    boolean;
  data?:      T;
  message?:   string;
  pagination?: { page: number; pages: number; total: number; count?: number };
};

const get  = async <T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
  const res = await apiClient.get(url, { params });
  return res.data;
};
const post = async <T>(url: string, body?: any): Promise<ApiResponse<T>> => {
  const res = await apiClient.post(url, body);
  return res.data;
};
const put  = async <T>(url: string, body?: any): Promise<ApiResponse<T>> => {
  const res = await apiClient.put(url, body);
  return res.data;
};
const del  = async <T>(url: string): Promise<ApiResponse<T>> => {
  const res = await apiClient.delete(url);
  return res.data;
};

// ── Exported API object ───────────────────────────────────────────────────────

export const transcriptionApi = {
  // Settings
  getSettings:    () => get<TranscriptionSettings>('/transcription/admin/settings'),
  updateSettings: (data: { maxTasksPerDay: number }) =>
    put<TranscriptionSettings>('/transcription/admin/settings', data),

  // Benchmarks
  getBenchmarks:    () => get<TranscriptionBenchmark[]>('/transcription/benchmarks'),
  createBenchmark:  (data: { minutesPerTask: number; ratePerHour: number; weekStartDate: string; notes?: string }) =>
    post<TranscriptionBenchmark>('/transcription/benchmarks', data),
  updateBenchmark:  (id: string, data: Partial<TranscriptionBenchmark>) =>
    put<TranscriptionBenchmark>(`/transcription/benchmarks/${id}`, data),

  // Profiles (public enriched view)
  getProfiles: () => get<TranscriptionProfile[]>('/transcription/profiles'),

  // Profiles (admin CRUD)
  adminGetProfiles:    () => get<TranscriptionProfile[]>('/transcription/admin/profiles'),
  createProfile:       (data: Partial<TranscriptionProfile>) =>
    post<TranscriptionProfile>('/transcription/admin/profiles', data),
  updateProfile:       (id: string, data: Partial<TranscriptionProfile>) =>
    put<TranscriptionProfile>(`/transcription/admin/profiles/${id}`, data),
  deleteProfile:       (id: string) => del(`/transcription/admin/profiles/${id}`),
  addWorkerToPool:     (profileId: string, userId: string) =>
    post(`/transcription/admin/profiles/${profileId}/pool`, { userId }),
  removeWorkerFromPool:(profileId: string, userId: string) =>
    del(`/transcription/admin/profiles/${profileId}/pool/${userId}`),
  forceReturnProfile:  (profileId: string, reason?: string) =>
    post(`/transcription/admin/profiles/${profileId}/force-return`, { reason }),

  // Claim / Return
  claimProfile:  (profileId: string) =>
    post(`/transcription/profiles/${profileId}/claim`),
  returnProfile: (sessionId: string, data: { tasks: number; notes?: string }) =>
    post(`/transcription/sessions/${sessionId}/return`, data),

  // Sessions (user)
  getMySessions: (params?: { page?: number; limit?: number; week?: number; year?: number }) =>
    get<TranscriptionSession[]>('/transcription/my-sessions', params),

  // Sessions (admin)
  adminGetSessions: (params?: {
    status?: string; week?: number; year?: number; page?: number; limit?: number;
  }) => get<TranscriptionSession[]>('/transcription/admin/sessions', params),
  approveSession: (id: string, data?: { adminTasks?: number; adminNotes?: string }) =>
    put<TranscriptionSession>(`/transcription/admin/sessions/${id}/approve`, data),
  rejectSession:  (id: string, data?: { reason?: string; adminNotes?: string }) =>
    put<TranscriptionSession>(`/transcription/admin/sessions/${id}/reject`, data),

  // Payments (user)
  getMyPayments: () => get<TranscriptionPayment[]>('/transcription/my-payments'),

  // Payments (admin)
  adminGetPayments: (params?: { week?: number; year?: number; status?: string }) =>
    get<TranscriptionPayment[]>('/transcription/admin/payments', params),
  markPaymentPaid: (data: { userId: string; week: number; year: number }) =>
    post('/transcription/admin/payments/mark-paid', data),
  approvePayment:  (id: string) =>
    put(`/transcription/admin/payments/${id}/approve`),

  // Accounts (admin)
  getAccounts: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    get('/transcription/admin/accounts', params),
  getAccountStats: (id: string) =>
    get(`/transcription/admin/accounts/${id}/stats`),
  getProduction: () =>
    get<TranscriptionProduction>('/transcription/admin/production'),

  // Shared
  getDashboard:  () => get<TranscriptionDashboard>('/transcription/dashboard'),
  getTopEarners: (params?: { week?: number; year?: number }) =>
    get<{ week: number; year: number; earners: TranscriptionEarner[]; minutesPerTask: number; ratePerHour: number; currentUserEntry: TranscriptionEarner | null }>(
      '/transcription/top-earners',
      params
    ),

  // Users (admin badge management)
  getTranscriptionUsers: (params?: { search?: string; badge?: string; limit?: number }) =>
    get('/transcription/admin/users', params),
  grantBadge:  (userId: string) =>
    post(`/transcription/admin/users/${userId}/badge`),
  revokeBadge: (userId: string) =>
    del(`/transcription/admin/users/${userId}/badge`),
};
