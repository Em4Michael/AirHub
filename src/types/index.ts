export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REVOKED = 'revoked',
}

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  DENIED = 'denied',
}

export interface WeeklyPayment {
  _id: string;
  user: string | User;
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  year: number;
  weekStartDay: number;
  totalHours: number;
  avgQuality: number;
  entryCount: number;
  /**
   * hourlyRate stored on the record — use this (not env var) to display
   * accurate earnings. Reflects benchmark.payPerHour at time of creation.
   */
  hourlyRate: number;
  baseEarnings: number;
  performanceMultiplier: number;
  bonusEarnings: number;
  extraBonus?: number;
  extraBonusReason?: string;
  totalEarnings: number;
  /**
   * paymentType:
   * 'regular' = weekly work-based payment
   * 'bonus'   = standalone bonus payment (created by superadmin)
   */
  paymentType: 'regular' | 'bonus';
  status: 'pending' | 'approved' | 'paid' | 'denied';
  paid: boolean;
  paidDate?: string;
  paidBy?: string | User;
  approvedBy?: string | User;
  approvedAt?: string;
  deniedBy?: string | User;
  deniedAt?: string;
  denialReason?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  id: string;
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  year: number;
  hours: number;
  quality: number;
  earnings: number;
  hourlyRate: number;
  paid: boolean;
  paidDate?: string;
  status: string;
  paymentType: 'regular' | 'bonus';
  extraBonus?: number;
  extraBonusReason?: string;
  notes?: string;
}

export interface UserStatsResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    isApproved: boolean;
    weekStartDay: number;
    createdAt: string;
    profilePhoto?: string | null;
    bankDetails?: {
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
    };
  };
  currentWeekRange?: {
    weekStart: string;
    weekEnd: string;
  };
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
  payments: PaymentSummary[];
}

export interface User {
  _id: string;
  email: string;
  name: string;
  /** Phone number — optional, added for contact/payment purposes */
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  profilePhoto?: string | null;
  bankDetails?: BankDetails;
  extraBonus?: number;
  extraBonusReason?: string;
  weekStartDay?: number;
  createdAt: string;
  updatedAt: string;
  isApproved?: boolean;
  weeklyPayments?: WeeklyPayment[];
}

/**
 * Routing number intentionally removed per business requirements.
 */
export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Profile {
  _id: string;
  email: string;
  fullName: string;
  state: string;
  country: string;
  accountBearerName: string;
  defaultWorker: string | User;
  secondWorker?: string | User | null;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  _id: string;
  worker: string | User;
  profile: string | Profile;
  date: string;
  time: number;
  quality: number;
  notes?: string;
  adminTime?: number;
  adminQuality?: number;
  adminNotes?: string;
  effectiveTime?: number;
  effectiveQuality?: number;
  adminApproved: boolean;
  approvedBy?: string | User;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Benchmark {
  _id: string;
  timeBenchmark: number;
  qualityBenchmark: number;
  startDate: string;
  endDate: string;
  /** Pay per hour for this benchmark period. Null = use HOURLY_RATE env var */
  payPerHour?: number | null;
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
  isActive?: boolean;
  createdAt: string;
}

export interface DashboardApiResponse {
  summary: {
    totalEntries: number;
    totalTime: number;
    avgQuality: number;
    avgTime: number;
    overallPerformance?: number;
    assignedProfiles: number;
  };
  performance?: {
    timePercentage: number;
    qualityPercentage: number;
    overallPercentage: number;
  } | null;
  earnings?: {
    baseEarnings: number;
    multiplier: number;
    tier: string;
    bonus: number;
    finalEarnings: number;
    extraBonus?: number;
    hourlyRate?: number;
  } | null;
  benchmark?: {
    timeBenchmark: number;
    qualityBenchmark: number;
    thresholds: Benchmark['thresholds'];
    startDate: string;
    endDate: string;
    payPerHour?: number | null;
  } | null;
  weeklyData: Array<{
    weekStart: string;
    totalTime: number;
    avgTime: number;
    avgQuality: number;
    entries: number;
  }>;
  dailyData: Array<{
    _id?: string;
    date: string;
    time: number;
    quality: number;
    effectiveTime?: number;
    effectiveQuality?: number;
    adminApproved?: boolean;
    profile?: string;
    notes?: string;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface DashboardData {
  totalTime: number;
  totalEntries: number;
  averageQuality: number;
  weeklyPerformance: number;
  earnings: number;
  performanceLevel: string;
  bonusMultiplier: number;
  recentEntries: Entry[];
  chartData: ChartDataPoint[];
  weeklyData?: WeeklyData;
}

export interface WeeklyData {
  hours: number;
  quality: number;
  earnings: number;
  performance: number;
}

export interface WeeklySummary {
  hours: number;
  quality: number;
  earnings: number;
  performance: number;
}

export interface ChartDataPoint {
  date: string;
  time: number;
  quality: number;
  overall: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    count: number;
  };
}