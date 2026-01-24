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

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  bankDetails?: BankDetails;
  extraBonus?: number;
  extraBonusReason?: string;
  createdAt: string;
  updatedAt: string;
  isApproved?: boolean;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  routingNumber?: string;
}

export interface Profile {
  _id: string;
  email: string;
  fullName: string;
  state: string;
  country: string;
  accountBearerName: string;
  defaultWorker: string | User;
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
  adminApproved: boolean;
  adminApprovedBy?: string | User;
  adminApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Benchmark {
  _id: string;
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
  isActive?: boolean;
  createdAt: string;
}

export interface DashboardApiResponse {
  summary: {
    totalEntries: number;
    totalTime: number;
    avgQuality: number;
    overallPerformance?: number;
  };
  earnings: {
    finalEarnings: number;
    multiplier: number;
    tier: string;
  };
  weeklyData: Array<{
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
    notes?: string;
  }>;
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
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}