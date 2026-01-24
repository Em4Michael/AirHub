import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

// Format date for display
export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return '-';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return format(parsed, formatStr);
  } catch {
    return '-';
  }
};

// Format date for input fields
export const formatDateForInput = (date) => {
  if (!date) return '';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return format(parsed, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

// Format currency
export const formatCurrency = (amount, currency = 'NGN') => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format number with commas
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Format percentage
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(decimals)}%`;
};

// Format hours
export const formatHours = (hours) => {
  if (hours === null || hours === undefined) return '-';
  return `${hours.toFixed(2)} hrs`;
};

// Get performance tier based on percentage
export const getPerformanceTier = (percentage) => {
  if (percentage >= 80) return { tier: 'Excellent', color: 'success' };
  if (percentage >= 70) return { tier: 'Good', color: 'info' };
  if (percentage >= 60) return { tier: 'Average', color: 'warning' };
  if (percentage >= 50) return { tier: 'Minimum', color: 'accent' };
  return { tier: 'Below', color: 'error' };
};

// Get status badge variant
export const getStatusVariant = (status) => {
  const variants = {
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
    active: 'success',
    inactive: 'error',
    revoked: 'error',
  };
  return variants[status?.toLowerCase()] || 'default';
};

// Get role display name
export const getRoleDisplay = (role) => {
  const roles = {
    user: 'Worker',
    admin: 'Admin',
    superadmin: 'Super Admin',
  };
  return roles[role] || role;
};

// Get week number from date
export const getWeekNumber = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return { week: weekNumber, year: d.getFullYear() };
};

// Get week date range
export const getWeekRange = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return {
    start: format(start, 'MMM d'),
    end: format(end, 'MMM d, yyyy'),
  };
};

// Truncate string
export const truncate = (str, length = 30) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate avatar initials
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Validate email
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Parse API error
export const parseError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors) {
    return error.response.data.errors.map(e => e.msg).join(', ');
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Storage helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error('Failed to save to localStorage');
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.error('Failed to remove from localStorage');
    }
  },
};

// Sort array by key
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// Group array by key
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

// Calculate average
export const average = (array, key) => {
  if (!array.length) return 0;
  const sum = array.reduce((acc, item) => acc + (item[key] || 0), 0);
  return sum / array.length;
};
