'use client';

import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { userApi } from '@/lib/api/user.api';
import { DashboardData, Entry } from '@/types';
import { formatCurrency, formatPercentage, formatTime } from '@/lib/utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Award, DollarSign, Calendar, CheckCircle } from 'lucide-react';

export default function UserDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await userApi.getDashboard();
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'No dashboard data received');
      }

      const raw = response.data;

      const safeGet = (obj: any, path: string[], defaultVal: any = 0) => {
        let current = obj;
        for (const key of path) {
          current = current?.[key];
          if (current === undefined) return defaultVal;
        }
        return current;
      };

      // Only use paid data for display
      const dashboardData: DashboardData = {
        totalTime: safeGet(raw, ['summary', 'totalTime'], 0),
        totalEntries: safeGet(raw, ['summary', 'totalEntries'], 0),
        averageQuality: safeGet(raw, ['summary', 'avgQuality'], 0),
        weeklyPerformance: safeGet(raw, ['summary', 'overallPerformance'], 0),

        earnings: safeGet(raw, ['earnings', 'finalEarnings'], 0), // should be paid only
        performanceLevel: safeGet(raw, ['earnings', 'tier'], 'average'),
        bonusMultiplier: safeGet(raw, ['earnings', 'multiplier'], 1.0),

        recentEntries: (safeGet(raw, ['dailyData'], []) as any[])
          .filter((d: any) => d.adminApproved === true) // only approved
          .slice(-10)
          .reverse()
          .map((d: any) => ({
            _id: d._id || `temp-${d.date}`,
            worker: d.worker || 'unknown',
            profile: d.profile || 'unknown',
            date: d.date,
            time: d.effectiveTime ?? d.time ?? 0,
            quality: d.effectiveQuality ?? d.quality ?? 0,
            adminApproved: d.adminApproved ?? false,
            notes: d.notes ?? '',
            createdAt: d.date ?? new Date().toISOString(),
            updatedAt: d.date ?? new Date().toISOString(),
          })) as Entry[],

        chartData: (safeGet(raw, ['dailyData'], []) as any[])
          .filter((d: any) => d.adminApproved === true)
          .map((d: any) => ({
            date: new Date(d.date).toISOString().split('T')[0],
            time: d.effectiveTime ?? d.time ?? 0,
            quality: d.effectiveQuality ?? d.quality ?? 0,
            overall: ((d.effectiveQuality ?? d.quality ?? 0) * 0.7 + (d.effectiveTime ?? d.time ?? 0) * 0.3),
          })),

        weeklyData: (() => {
          const latest = safeGet(raw, ['weeklyData'], []).slice(-1)[0];
          if (!latest) return { hours: 0, quality: 0, earnings: 0, performance: 0 };

          const perf = (latest.avgQuality * 0.7 + (latest.avgTime ?? 0) * 0.3);
          return {
            hours: latest.totalTime ?? latest.avgTime ?? 0,
            quality: latest.avgQuality ?? 0,
            earnings: (latest.totalTime ?? 0) * 2000,
            performance: perf,
          };
        })(),
      };

      setDashboard(dashboardData);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load dashboard');
      setDashboard({
        totalTime: 0,
        totalEntries: 0,
        averageQuality: 0,
        weeklyPerformance: 0,
        earnings: 0,
        performanceLevel: 'average',
        bonusMultiplier: 1.0,
        recentEntries: [],
        chartData: [],
        weeklyData: { hours: 0, quality: 0, earnings: 0, performance: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!dashboard) {
    return (
      <Alert 
        type="info" 
        message="No dashboard data available. Start creating entries!" 
      />
    );
  }

  const performanceBadge = {
    excellent: { variant: 'success' as const, label: 'Excellent ⭐' },
    good: { variant: 'primary' as const, label: 'Good 👍' },
    average: { variant: 'warning' as const, label: 'Average' },
    minimum: { variant: 'warning' as const, label: 'Minimum' },
    below: { variant: 'danger' as const, label: 'Below Target' },
  }[dashboard.performanceLevel] || { variant: 'warning' as const, label: 'Average' };

  // ──── Only show approved & paid entries ────
  const getCurrentWeekEntries = () => {
    if (!dashboard?.recentEntries?.length) return [];

    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return dashboard.recentEntries.filter((entry) => {
      const entryDate = new Date(entry.date.split('T')[0] + 'T00:00:00');
      return entryDate >= startOfWeek && entryDate <= endOfWeek && entry.adminApproved;
    });
  };

  const weekEntries = getCurrentWeekEntries();

  const calculateWeeklyTotals = () => {
    if (weekEntries.length === 0) {
      return {
        totalHours: 0,
        avgQuality: 0,
        overallPerformance: 0,
      };
    }

    const totalHours = weekEntries.reduce((sum, entry) => sum + (entry.time || 0), 0);
    const totalQuality = weekEntries.reduce((sum, entry) => sum + (entry.quality || 0), 0);
    const avgQuality = totalQuality / weekEntries.length;

    const daysWorked = weekEntries.length;
    const expectedHours = daysWorked * 8;
    const timePercentage = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0;
    
    const overallPerformance = (avgQuality * 0.7) + (timePercentage * 0.3);

    return {
      totalHours,
      avgQuality,
      overallPerformance,
    };
  };

  const weeklyTotals = calculateWeeklyTotals();

  interface StatCardProps {
    icon: React.ElementType;
    label: string;
    weeklyValue: string | React.ReactNode;
    lifetimeValue: string;
    subtitle?: string;
    iconColor?: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ 
    icon: Icon, 
    label, 
    weeklyValue, 
    lifetimeValue, 
    subtitle, 
    iconColor 
  }) => (
    <div 
      className="card p-5 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        borderColor: 'var(--border-color)' 
      }}
    >
      <div className="flex items-start justify-between relative mb-3">
        <p 
          className="text-xs font-bold uppercase tracking-wide" 
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative"
          style={{ backgroundColor: iconColor || 'var(--accent-color)' }}
        >
          <Icon className="w-6 h-6 text-white relative z-10" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {weeklyValue}
          </p>
          <span 
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: 'rgba(139, 92, 246, 0.15)', 
              color: 'var(--accent-color)' 
            }}
          >
            This Week (Paid)
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Lifetime: <span className="font-semibold">{lifetimeValue}</span>
        </p>
        {subtitle && (
          <p className="text-xs font-medium pt-1" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-6" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p 
          className="mt-1 flex items-center gap-2" 
          style={{ color: 'var(--text-secondary)' }}
        >
          <Calendar className="w-4 h-4" />
          Week of {new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </p>
      </div>

      {/* Weekly Stats Cards – Only Paid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Paid Hours Worked"
          weeklyValue={formatTime(weeklyTotals.totalHours)}
          lifetimeValue={formatTime(dashboard.totalTime)}
          subtitle={`${weekEntries.length} approved days this week`}
          iconColor="#3b82f6"
        />
        <StatCard
          icon={Award}
          label="Paid Quality Score"
          weeklyValue={formatPercentage(weeklyTotals.avgQuality)}
          lifetimeValue={formatPercentage(dashboard.averageQuality)}
          subtitle="Average across paid entries"
          iconColor="#10b981"
        />
        <StatCard
          icon={TrendingUp}
          label="Paid Overall Performance"
          weeklyValue={
            <span className="flex items-center gap-2">
              {formatPercentage(weeklyTotals.overallPerformance)}
              <span 
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: 
                    weeklyTotals.overallPerformance >= 80 ? '#10b981' :
                    weeklyTotals.overallPerformance >= 70 ? '#3b82f6' :
                    weeklyTotals.overallPerformance >= 60 ? '#f59e0b' : '#ef4444',
                  color: 'white'
                }}
              >
                {weeklyTotals.overallPerformance >= 80 ? 'Excellent' :
                 weeklyTotals.overallPerformance >= 70 ? 'Good' :
                 weeklyTotals.overallPerformance >= 60 ? 'Average' : 'Below'}
              </span>
            </span>
          }
          lifetimeValue={`${dashboard.totalEntries} entries`}
          subtitle="70% Quality + 30% Time (Paid)"
          iconColor="#8b5cf6"
        />
        <StatCard
          icon={DollarSign}
          label="Paid Earnings"
          weeklyValue={formatCurrency(dashboard.weeklyData?.earnings || 0)}
          lifetimeValue={formatCurrency(dashboard.earnings)}
          subtitle={`${dashboard.bonusMultiplier}x multiplier (Paid)`}
          iconColor="#f59e0b"
        />
      </div>

      {/* Performance Breakdown */}
      <div 
        className="card p-6"
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Performance Breakdown
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              How your overall score is calculated (70% Quality + 30% Time)
            </p>
          </div>
          <div 
            className="text-3xl font-bold"
            style={{ 
              color: 
                weeklyTotals.overallPerformance >= 80 ? '#10b981' :
                weeklyTotals.overallPerformance >= 70 ? '#3b82f6' :
                weeklyTotals.overallPerformance >= 60 ? '#f59e0b' : '#ef4444'
            }}
          >
            {formatPercentage(weeklyTotals.overallPerformance)}
          </div>
        </div>

        <div className="space-y-4">
          {/* Quality Component (70%) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Quality Score (70% weight)
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatPercentage(weeklyTotals.avgQuality)}
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div 
                className="absolute h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(weeklyTotals.avgQuality, 100)}%`,
                  backgroundColor: '#10b981'
                }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Contributes {(weeklyTotals.avgQuality * 0.7).toFixed(1)} points to overall
            </p>
          </div>

          {/* Time Component (30%) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Time Achievement (30% weight)
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatTime(weeklyTotals.totalHours)} / {weekEntries.length * 8}h
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div 
                className="absolute h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((weeklyTotals.totalHours / (weekEntries.length * 8)) * 100, 100)}%`,
                  backgroundColor: '#3b82f6'
                }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Contributes {(((weeklyTotals.totalHours / (weekEntries.length * 8 || 1)) * 100) * 0.3).toFixed(1)} points to overall
            </p>
          </div>

          {/* Overall Bar */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Overall Performance
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatPercentage(weeklyTotals.overallPerformance)}
              </span>
            </div>
            <div className="relative h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div 
                className="absolute h-full rounded-full transition-all duration-500 flex items-center justify-center"
                style={{ 
                  width: `${Math.min(weeklyTotals.overallPerformance, 100)}%`,
                  backgroundColor: 
                    weeklyTotals.overallPerformance >= 80 ? '#10b981' :
                    weeklyTotals.overallPerformance >= 70 ? '#3b82f6' :
                    weeklyTotals.overallPerformance >= 60 ? '#f59e0b' : '#ef4444'
                }}
              >
                {weeklyTotals.overallPerformance > 10 && (
                  <span className="text-xs font-bold text-white">
                    {weeklyTotals.overallPerformance.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Performance Tier */}
          <div 
            className="p-4 rounded-lg text-center"
            style={{ 
              backgroundColor: 
                weeklyTotals.overallPerformance >= 80 ? 'rgba(16, 185, 129, 0.1)' :
                weeklyTotals.overallPerformance >= 70 ? 'rgba(59, 130, 246, 0.1)' :
                weeklyTotals.overallPerformance >= 60 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 
                weeklyTotals.overallPerformance >= 80 ? '#10b981' :
                weeklyTotals.overallPerformance >= 70 ? '#3b82f6' :
                weeklyTotals.overallPerformance >= 60 ? '#f59e0b' : '#ef4444'
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Your Performance Tier
            </p>
            <p 
              className="text-2xl font-bold"
              style={{ 
                color: 
                  weeklyTotals.overallPerformance >= 80 ? '#10b981' :
                  weeklyTotals.overallPerformance >= 70 ? '#3b82f6' :
                  weeklyTotals.overallPerformance >= 60 ? '#f59e0b' : '#ef4444'
              }}
            >
              {weeklyTotals.overallPerformance >= 80 ? '⭐ Excellent' :
               weeklyTotals.overallPerformance >= 70 ? '👍 Good' :
               weeklyTotals.overallPerformance >= 60 ? '📊 Average' : '📉 Below Target'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {weeklyTotals.overallPerformance >= 80 ? 'Outstanding work! Keep it up!' :
               weeklyTotals.overallPerformance >= 70 ? 'Great job! You\'re performing well.' :
               weeklyTotals.overallPerformance >= 60 ? 'Good effort. Room for improvement.' : 'Focus on improving quality and consistency.'}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Trends Chart */}
      <div 
        className="card p-6" 
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          This Week's Performance
        </h3>
        {!dashboard.chartData?.length ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            No chart data available yet. Start creating entries to see your performance trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.chartData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-secondary)" 
                style={{ fontSize: '12px' }} 
              />
              <YAxis 
                stroke="var(--text-secondary)" 
                style={{ fontSize: '12px' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.75rem', 
                  color: 'var(--text-primary)' 
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="time" 
                stroke="#3b82f6" 
                name="Hours" 
                strokeWidth={3} 
                dot={{ r: 4 }} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="quality" 
                stroke="#10b981" 
                name="Quality %" 
                strokeWidth={3} 
                dot={{ r: 4 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* This Week's Entries */}
      <div 
        className="card p-6" 
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          This Week's Entries ({weekEntries.length})
        </h3>
        {weekEntries.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No entries this week yet. Start logging your work!
          </p>
        ) : (
          <div className="space-y-3">
            {weekEntries.map((entry) => (
              <div 
                key={entry._id} 
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl hover:shadow-md transition-all duration-200 gap-3"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex-1">
                  <p 
                    className="font-semibold flex items-center gap-2" 
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Calendar className="w-4 h-4" />
                    {new Date(entry.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p 
                    className="text-sm mt-1" 
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {entry.notes || 'No notes'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p 
                      className="text-sm font-medium" 
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {formatTime(entry.time)} • {formatPercentage(entry.quality)}
                    </p>
                  </div>
                  {entry.adminApproved && (
                    <Badge variant="success" className="whitespace-nowrap">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}