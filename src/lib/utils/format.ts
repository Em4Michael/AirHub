import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Parse a date value safely, always reading the UTC calendar date.
 *
 * The core problem: MongoDB stores dates as UTC midnight e.g.
 * "2026-02-17T00:00:00.000Z". When date-fns parseISO() or new Date() parses
 * this, it creates a local-time Date. In Nigeria (UTC+1) that becomes
 * Feb 16 at 11:00 PM local — so the formatter shows Feb 16 instead of Feb 17.
 *
 * Fix: if the value is a string, slice the first 10 chars ("YYYY-MM-DD") and
 * append "T00:00:00" WITHOUT a Z, then parse. date-fns treats a datetime
 * string without a timezone designator as local time, so we get local midnight
 * for that exact calendar date — no shift occurs.
 */
const parseDateSafe = (date: string | Date): Date => {
  if (typeof date === 'string') {
    // Take only the date portion and interpret it as local midnight.
    const datePart = date.slice(0, 10); // "YYYY-MM-DD"
    return parseISO(`${datePart}T00:00:00`); // local midnight — no UTC shift
  }
  return date;
};

// Format date for display
export const formatDate = (
  date: string | Date | null | undefined,
  formatStr = 'MMM d, yyyy'
): string => {
  if (!date) return '-';
  try {
    const parsed = parseDateSafe(date as string | Date);
    return format(parsed, formatStr);
  } catch {
    return '-';
  }
};

// Format date for input fields
export const formatDateForInput = (
  date: string | Date | null | undefined
): string => {
  if (!date) return '';
  try {
    const parsed = parseDateSafe(date as string | Date);
    return format(parsed, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

// Format currency (NGN)
export const formatCurrency = (
  amount: number | null | undefined,
  currency = 'NGN'
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₦0';

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format number with commas
export const formatNumber = (
  num: number | null | undefined,
  decimals = 0
): string => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Format percentage
export const formatPercentage = (
  value: number | null | undefined,
  decimals = 1
): string => {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
};

// Alias for formatPercentage
export const formatPercent = formatPercentage;

// Format hours/time
export const formatTime = (hours: number | null | undefined): string => {
  if (hours === null || hours === undefined || isNaN(hours)) return '0.00h';
  return `${hours.toFixed(2)}h`;
};

// Alias for formatTime
export const formatHours = formatTime;

// Get performance tier based on percentage
export const getPerformanceTier = (
  percentage: number
): { tier: string; color: string } => {
  if (percentage >= 80) return { tier: 'Excellent', color: 'success' };
  if (percentage >= 70) return { tier: 'Good', color: 'info' };
  if (percentage >= 60) return { tier: 'Average', color: 'warning' };
  if (percentage >= 50) return { tier: 'Minimum', color: 'accent' };
  return { tier: 'Below', color: 'error' };
};

// Get status badge variant
export const getStatusVariant = (status: string | undefined): string => {
  const variants: Record<string, string> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
    active: 'success',
    inactive: 'error',
    revoked: 'error',
  };
  return variants[status?.toLowerCase() || ''] || 'default';
};

// Get role display name
export const getRoleDisplay = (role: string): string => {
  const roles: Record<string, string> = {
    user: 'Worker',
    admin: 'Admin',
    superadmin: 'Super Admin',
  };
  return roles[role] || role;
};

// Get week number from date
export const getWeekNumber = (
  date: string | Date
): { week: number; year: number } => {
  const d = parseDateSafe(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7
  );
  return { week: weekNumber, year: d.getFullYear() };
};

// Get week date range
export const getWeekRange = (
  date: string | Date
): { start: string; end: string } => {
  const d = parseDateSafe(date);
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return {
    start: format(start, 'MMM d'),
    end: format(end, 'MMM d, yyyy'),
  };
};

// Truncate string
export const truncate = (str: string, length = 30): string => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate avatar initials
export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Parse API error
export const parseError = (error: any): string => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.errors) {
    return error.response.data.errors.map((e: any) => e.msg).join(', ');
  }
  if (error.message) return error.message;
  return 'An unexpected error occurred';
};

// Storage helpers
export const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error('Failed to save to localStorage');
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.error('Failed to remove from localStorage');
    }
  },
};

// Sort array by key
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// Group array by key
export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce(
    (groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
};

// Calculate average
export const average = <T>(array: T[], key: keyof T): number => {
  if (!array.length) return 0;
  const sum = array.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
  return sum / array.length;
};