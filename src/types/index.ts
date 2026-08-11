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
  /**
   * true = admin has added this user to the analyst worker pool.
   * Set by the analyst badge grant/revoke endpoints.
   */
  analystApproved?: boolean;
  /**
   * true = user has been granted the analyst badge and can claim profiles.
   * analystApproved must also be true for full access.
   */
  analystBadge?: boolean;
  createdAt: string;
  updatedAt: string;
  isApproved?: boolean;
  weeklyPayments?: WeeklyPayment[];
  transcriptionBadge?:    boolean;
  transcriptionApproved?: boolean;
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
  defaultWorker?: string | User | null;
  secondWorker?: string | User | null;
  isActive: boolean;

  /**
   * Custom admin cut percentage for this account (0–100).
   * null/undefined = use the platform default (25%).
   */
  adminCutPercentage?: number | null;

  /**
   * When true this account is excluded from admin earnings calculations.
   * Workers still get paid normally.
   */
  isTerminated?: boolean;

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

export interface AnalystBenchmark {
  _id:        string;
  payPerHour: number;
  startDate:  string;
  endDate:    string;
  isActive:   boolean;
  notes?:     string;
  createdBy?: { _id: string; name: string };
  createdAt:  string;
  updatedAt:  string;
}

export interface AnalystProfile {
  _id:               string;
  name:              string;
  description?:      string;
  accountBearerName: string;
  email?:            string;
  state?:            string;
  country?:          string;

  // Optional account-access details
  accountName?:      string;
  loginDetails?:     string;
  loginMethod?:      string;

  workerPool:        Array<{ _id: string; name: string; email?: string; profilePhoto?: string; analystBadge?: boolean }>;
  currentHolder?:    { _id: string; name: string; profilePhoto?: string } | null;
  claimedAt?:        string | null;

  adminCutPercentage?: number | null;
  isTerminated:      boolean;
  isActive:          boolean;

  // Enriched by backend for current user
  isMine?:           boolean;
  inPool?:           boolean;
  isAvailable?:      boolean;
  createdAt:         string;
  updatedAt:         string;

    // Enrichment from getPublicAnalystProfiles (optional)
  today?:           number;
  thisWeek?:        number;
  thisMonth?:       number;
  allTime?:         number;
  workerBreakdown?: AnalystWorkerHours[];
  maxHoursPerDay?:  number;
  caps?:            { daily: number; weekly: number; monthly: number };

}

export interface AnalystSession {
  _id:             string;
  worker:          string | { _id: string; name: string; profilePhoto?: string };
  profile:         string | { _id: string; name: string; accountBearerName: string };
  claimedAt:       string;
  returnedAt?:     string | null;
  startTimeInput?: string;
  endTimeInput?:   string;
  hoursLogged:     number;
  adminHours?:     number | null;
  effectiveHours:  number;
  notes?:          string;
  adminNotes?:     string;
  status:          'active' | 'pending' | 'approved' | 'rejected';
  month:           number;
  year:            number;
  hourlyRate?:     number;
  approvedBy?:     string | { _id: string; name: string };
  approvedAt?:     string;
  rejectedBy?:     string | { _id: string; name: string };
  rejectedAt?:     string;
  rejectionReason?: string;
  createdAt:       string;
  updatedAt:       string;
}

export interface AnalystPayment {
  _id:           string;
  user:          string | { _id: string; name: string; email: string; profilePhoto?: string };
  month:         number;
  year:          number;
  monthStart:    string;
  monthEnd:      string;
  totalHours:    number;
  sessionCount:  number;
  hourlyRate:    number;
  totalEarnings: number;
  status:        'pending' | 'approved' | 'paid' | 'denied';
  paid:          boolean;
  paidDate?:     string;
  paidBy?:       string | { _id: string; name: string };
  approvedBy?:   string | { _id: string; name: string };
  approvedAt?:   string;
  deniedBy?:     string | { _id: string; name: string };
  deniedAt?:     string;
  denialReason?: string;
  adminNotes?:   string;
  createdAt:     string;
  updatedAt:     string;
}

export interface AnalystDashboard {
  currentMonth:    { month: number; year: number };
  totalHours:      number;
  pendingHours:    number;
  earnings:        number;
  pendingEarnings: number;
  hourlyRate:      number;
  sessionCount:    number;
  approvedCount:   number;
  pendingCount:    number;
  weeklyBreakdown: Array<{ week: string; hours: number; earnings: number }>;
  lifetimeHours:   number;
  lifetimeEarnings: number;
  payment?:        AnalystPayment | null;
heldProfile?:    { _id: string; name: string; accountBearerName: string; claimedAt: string } | null;
 activeSession?:  AnalystSession | null;
 maxHoursPerDay: number;
}

export interface AnalystEarner {
  rank:          number;
  userId:        string;
  name:          string;
  hours:         number;
  earnings:      number;
  sessions:      number;
  isCurrentUser: boolean;
}

/**
 * Row shape returned by GET /analyst/admin/users — used by the admin
 * "Analyst Badges" management page.
 */
export interface AnalystUserRow {
  _id: string;
  name: string;
  email: string;
  profilePhoto?: string | null;
  analystApproved?: boolean;
  analystBadge?: boolean;
  isApproved?: boolean;
  createdAt: string;
}

export interface AnalystSettings {
  _id?:           string;
  maxHoursPerDay: number;
  updatedBy?:     string | { _id: string; name: string };
  updatedAt?:     string;
}

/** One worker's hours on a single account, split by period. */
export interface AccountWorkerHours {
  id:      string;
  name:    string;
  today:   number;
  week:    number;
  month:   number;
  allTime: number;
}

export interface AccountStats {
  profile:        AnalystProfile;
  maxHoursPerDay: number;
  today:          number;
  thisWeek:       number;
  thisMonth:      number;
  allTime:        number;
  caps:           { daily: number; weekly: number; monthly: number };
  workerBreakdown: AccountWorkerHours[];
  chartData:      Array<{ date: string; hours: number }>;
  sessionCount:   number;
}

export interface AccountListRow {
  _id:               string;
  name:              string;
  accountBearerName: string;
  email?:            string;
  state?:            string;
  country?:          string;
  isActive:          boolean;
  isTerminated:      boolean;
  currentHolder?:    { _id: string; name: string } | null;
  createdAt:         string;
}

export interface ProductionEntity {
  id:      string;
  name:    string;
  bearer?: string;
  today:   number;
  week:    number;
  month:   number;
  allTime: number;
}

export interface AnalystProduction {
  totals:       { today: number; week: number; month: number; allTime: number };
  earnings:     { today: number; week: number; month: number; allTime: number };
  adminCut:     { rate: number; today: number; week: number; month: number; allTime: number };
  caps:         { daily: number; weekly: number; monthly: number };
  hourlyRate:   number;
  accountCount: number;
  activeClaims: number;
  sessionCount: number;
  topAccounts:  ProductionEntity[];
  topWorkers:   ProductionEntity[];
  trend:        Array<{ date: string; hours: number }>;
  maxHoursPerDay: number;
}

export interface AnalystWorkerHours {
  id:      string;
  name:    string;
  today:   number;
  week:    number;
  month:   number;
  allTime: number;
}
