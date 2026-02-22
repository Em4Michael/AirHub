'use client';

import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { userApi } from '@/lib/api/user.api';
import { DashboardData, DashboardApiResponse, Entry, WeeklyPayment } from '@/types';
import { formatCurrency, formatPercentage, formatTime, formatDate } from '@/lib/utils/format';
import { QUALITY_WEIGHT, TIME_WEIGHT } from '@/lib/utils/performance';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Award, DollarSign, Calendar, CheckCircle } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function getWeekBoundaries(
  date: Date,
  weekStartDay: number = 2
): { weekStart: Date; weekEnd: Date } {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const currentDay = d.getUTCDay();
  const daysBack = (currentDay - weekStartDay + 7) % 7;
  const weekStart = new Date(d);
  weekStart.setUTCDate(d.getUTCDate() - daysBack);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

// ─── Derived stats from WeeklyPayment records ────────────────────────────────
// These are the ONLY source of truth for hours, quality, and earnings.
// The dashboard summary endpoint recalculates from raw entries and does not
// match stored payment values — never use it for stat card display.

interface PaymentStats {
  // This week (most recent WeeklyPayment record)
  weekHours: number;
  weekQuality: number;
  weekEarnings: number;
  weekEntryCount: number;
  weekPerformance: number;
  weekStatus: string;
  weekPaid: boolean;
  weekPaidDate?: string;
  // Lifetime (all WeeklyPayment records summed)
  lifetimeHours: number;
  lifetimeQuality: number;   // weighted average
  lifetimeEarnings: number;
  lifetimeEntryCount: number;
}

function derivePaymentStats(payments: WeeklyPayment[]): PaymentStats {
  const empty: PaymentStats = {
    weekHours: 0, weekQuality: 0, weekEarnings: 0, weekEntryCount: 0,
    weekPerformance: 0, weekStatus: 'pending', weekPaid: false,
    lifetimeHours: 0, lifetimeQuality: 0, lifetimeEarnings: 0, lifetimeEntryCount: 0,
  };
  if (!payments.length) return empty;

  const sorted = [...payments].sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );
  const latest = sorted[0];

  // Lifetime totals
  let totalWeightedQuality = 0;
  let totalEntries = 0;
  const lifetimeHours = sorted.reduce((s, p) => s + (Number(p.totalHours) || 0), 0);
  const lifetimeEarnings = sorted.reduce((s, p) => s + (Number(p.totalEarnings) || 0), 0);
  sorted.forEach((p) => {
    const ec = Number(p.entryCount) || 0;
    totalEntries += ec;
    totalWeightedQuality += (Number(p.avgQuality) || 0) * ec;
  });
  const lifetimeQuality = totalEntries > 0 ? totalWeightedQuality / totalEntries : 0;

  // This week performance score: 60% quality + 40% time-normalised
  // Use stored avgQuality and totalHours from payment record
  const weekHours = Number(latest.totalHours) || 0;
  const weekQuality = Number(latest.avgQuality) || 0;
  const weekEntryCount = Number(latest.entryCount) || 0;
  const avgDailyHours = weekEntryCount > 0 ? weekHours / weekEntryCount : 0;
  const timeNorm = Math.min((avgDailyHours / 8) * 100, 100);
  const weekPerformance = weekQuality * QUALITY_WEIGHT + timeNorm * TIME_WEIGHT;

  return {
    weekHours,
    weekQuality,
    weekEarnings: Number(latest.totalEarnings) || 0,
    weekEntryCount,
    weekPerformance,
    weekStatus: latest.status ?? 'pending',
    weekPaid: latest.paid ?? false,
    weekPaidDate: latest.paidDate,
    lifetimeHours,
    lifetimeQuality,
    lifetimeEarnings,
    lifetimeEntryCount: totalEntries,
  };
}

// ─── component ──────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [payments, setPayments] = useState<WeeklyPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats>(derivePaymentStats([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStartDay] = useState<number>(2);

  useEffect(() => {
    // Fetch both in parallel — neither blocks the other
    Promise.all([fetchDashboard(), fetchPayments()]).finally(() => setLoading(false));
  }, []);

  // Re-derive stats whenever payments change
  useEffect(() => {
    setStats(derivePaymentStats(payments));
  }, [payments]);

  const fetchPayments = async () => {
    try {
      const res = await userApi.getMyPayments(1, 500);
      if (res.success && Array.isArray(res.data)) {
        setPayments(res.data as WeeklyPayment[]);
      }
    } catch (err) {
      console.warn('Could not fetch payment history:', err);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await userApi.getDashboard();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'No dashboard data received');
      }
      const apiData = response.data;
      const approvedDaily = apiData.dailyData ?? [];

      setDashboard({
        // totalTime / averageQuality / totalEntries only used for the entries
        // list and chart — NOT for stat cards (payments are the source there)
        totalTime: apiData.summary.totalTime ?? 0,
        totalEntries: apiData.summary.totalEntries ?? 0,
        averageQuality: apiData.summary.avgQuality ?? 0,
        weeklyPerformance: apiData.summary.overallPerformance ?? 0,
        earnings: 0,
        performanceLevel: apiData.earnings?.tier ?? 'average',
        bonusMultiplier: apiData.earnings?.multiplier ?? 1.0,

        recentEntries: approvedDaily
          .slice(-10)
          .reverse()
          .map((d): Entry => ({
            _id: d._id || `temp-${d.date}`,
            worker: 'unknown',
            profile: d.profile || 'unknown',
            date: d.date,
            time: d.effectiveTime ?? d.time ?? 0,
            quality: d.effectiveQuality ?? d.quality ?? 0,
            adminApproved: d.adminApproved ?? false,
            notes: d.notes ?? '',
            createdAt: d.date ?? new Date().toISOString(),
            updatedAt: d.date ?? new Date().toISOString(),
          })),

        chartData: approvedDaily.map((d) => {
          const t = d.effectiveTime ?? d.time ?? 0;
          const q = d.effectiveQuality ?? d.quality ?? 0;
          return {
            date: new Date(d.date).toISOString().split('T')[0],
            time: t,
            quality: q,
            overall: q * QUALITY_WEIGHT + t * TIME_WEIGHT,
          };
        }),

        weeklyData: { hours: 0, quality: 0, earnings: 0, performance: 0 },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load dashboard');
      setDashboard({
        totalTime: 0, totalEntries: 0, averageQuality: 0,
        weeklyPerformance: 0, earnings: 0, performanceLevel: 'average',
        bonusMultiplier: 1.0, recentEntries: [], chartData: [],
        weeklyData: { hours: 0, quality: 0, earnings: 0, performance: 0 },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) return <Alert type="error" message={error} />;
  if (!dashboard) {
    return <Alert type="info" message="No dashboard data available. Start creating entries!" />;
  }

  // ── Current-week entries list (for the entries table at the bottom) ────────
  const getCurrentWeekEntries = (): Entry[] => {
    if (!dashboard?.recentEntries?.length) return [];
    const { weekStart, weekEnd } = getWeekBoundaries(new Date(), weekStartDay);
    return dashboard.recentEntries.filter((entry) => {
      const entryDate = new Date(entry.date.split('T')[0] + 'T00:00:00Z');
      return entryDate >= weekStart && entryDate <= weekEnd && entry.adminApproved;
    });
  };
  const weekEntries = getCurrentWeekEntries();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const tierColor = (score: number) =>
    score >= 80 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 60 ? '#f59e0b' : '#ef4444';
  const tierLabel = (score: number) =>
    score >= 80 ? 'Excellent' : score >= 70 ? 'Good' : score >= 60 ? 'Average' : 'Below';

  const earningsSubtitle = stats.weekPaid
    ? `Paid on ${formatDate(stats.weekPaidDate || '')}`
    : stats.weekStatus === 'approved'
    ? 'Approved — ready for payout'
    : 'Pending admin approval';

  interface StatCardProps {
    icon: React.ElementType;
    label: string;
    weeklyValue: string | React.ReactNode;
    lifetimeValue: string;
    subtitle?: string;
    iconColor?: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, weeklyValue, lifetimeValue, subtitle, iconColor }) => (
    <div
      className="card p-5 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-start justify-between relative mb-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
          style={{ backgroundColor: iconColor || 'var(--accent-color)' }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {weeklyValue}
          </p>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-color)' }}
          >
            This Week
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
        <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Calendar className="w-4 h-4" />
          Week of{' '}
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Payment status banner */}
      {payments.length > 0 && (() => {
        const latest = [...payments].sort(
          (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
        )[0];
        if (latest.paid || latest.status === 'paid') {
          return (
            <Alert type="success" message={`This week's earnings (${formatCurrency(latest.totalEarnings)}) were paid on ${formatDate(latest.paidDate || '')}.`} />
          );
        }
        if (latest.status === 'approved') {
          return (
            <Alert type="info" message={`This week's performance is approved. ${formatCurrency(latest.totalEarnings)} is ready for payout.`} />
          );
        }
        if (latest.status === 'pending') {
          return (
            <Alert type="warning" message="This week's entries are pending admin approval." />
          );
        }
        return null;
      })()}

      {/* ── Stat cards — ALL values from WeeklyPayment records ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Approved Hours"
          weeklyValue={formatTime(stats.weekHours)}
          lifetimeValue={formatTime(stats.lifetimeHours)}
          subtitle={`${stats.weekEntryCount} vetted entries this week`}
          iconColor="#3b82f6"
        />
        <StatCard
          icon={Award}
          label="Approved Quality"
          weeklyValue={formatPercentage(stats.weekQuality)}
          lifetimeValue={formatPercentage(stats.lifetimeQuality)}
          subtitle="Average across vetted entries"
          iconColor="#10b981"
        />
        <StatCard
          icon={TrendingUp}
          label="Overall Performance"
          weeklyValue={
            <span className="flex items-center gap-2">
              {formatPercentage(stats.weekPerformance)}
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: tierColor(stats.weekPerformance), color: 'white' }}
              >
                {tierLabel(stats.weekPerformance)}
              </span>
            </span>
          }
          lifetimeValue={`${stats.lifetimeEntryCount} total entries`}
          subtitle="60% Quality + 40% Time"
          iconColor="#8b5cf6"
        />
        <StatCard
          icon={DollarSign}
          label="Approved Earnings"
          weeklyValue={formatCurrency(stats.weekEarnings)}
          lifetimeValue={formatCurrency(stats.lifetimeEarnings)}
          subtitle={earningsSubtitle}
          iconColor="#f59e0b"
        />
      </div>

      {/* ── Performance Breakdown (uses this week's payment stats) ──────────── */}
      <div
        className="card p-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Performance Breakdown
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              This week — vetted entries only (60% Quality + 40% Time)
            </p>
          </div>
          <div className="text-3xl font-bold" style={{ color: tierColor(stats.weekPerformance) }}>
            {formatPercentage(stats.weekPerformance)}
          </div>
        </div>

        <div className="space-y-4">
          {/* Quality bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Quality Score (60% weight)
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatPercentage(stats.weekQuality)}
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div
                className="absolute h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.weekQuality, 100)}%`, backgroundColor: '#10b981' }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Contributes {(stats.weekQuality * QUALITY_WEIGHT).toFixed(1)} points to overall
            </p>
          </div>

          {/* Time bar */}
          <div>
            {(() => {
              const avgDaily = stats.weekEntryCount > 0 ? stats.weekHours / stats.weekEntryCount : 0;
              const timeNormPct = Math.min((avgDaily / 8) * 100, 100);
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Time Achievement (40% weight)
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatTime(stats.weekHours)} / {stats.weekEntryCount * 8}h target
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div
                      className="absolute h-full rounded-full transition-all duration-500"
                      style={{ width: `${timeNormPct}%`, backgroundColor: '#3b82f6' }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Contributes {(timeNormPct * TIME_WEIGHT).toFixed(1)} points to overall
                  </p>
                </>
              );
            })()}
          </div>

          {/* Overall bar */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Overall Performance</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatPercentage(stats.weekPerformance)}
              </span>
            </div>
            <div className="relative h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div
                className="absolute h-full rounded-full transition-all duration-500 flex items-center justify-center"
                style={{
                  width: `${Math.min(stats.weekPerformance, 100)}%`,
                  backgroundColor: tierColor(stats.weekPerformance),
                }}
              >
                {stats.weekPerformance > 10 && (
                  <span className="text-xs font-bold text-white">
                    {stats.weekPerformance.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tier badge */}
          <div
            className="p-4 rounded-lg text-center"
            style={{
              backgroundColor: `${tierColor(stats.weekPerformance)}1a`,
              border: `2px solid ${tierColor(stats.weekPerformance)}`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Your Performance Tier
            </p>
            <p className="text-2xl font-bold" style={{ color: tierColor(stats.weekPerformance) }}>
              {stats.weekPerformance >= 80 ? '⭐ Excellent'
                : stats.weekPerformance >= 70 ? '👍 Good'
                : stats.weekPerformance >= 60 ? '📊 Average'
                : '📉 Below Target'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {stats.weekPerformance >= 80 ? 'Outstanding work! Keep it up!'
                : stats.weekPerformance >= 70 ? "Great job! You're performing well."
                : stats.weekPerformance >= 60 ? 'Good effort. Room for improvement.'
                : 'Focus on improving quality and consistency.'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Recent Performance (Approved Entries)
        </h3>
        {!dashboard.chartData?.length ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            No chart data yet. Approved entries will appear here.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.chartData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.75rem',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="time" stroke="#3b82f6" name="Hours" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="quality" stroke="#10b981" name="Quality %" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* This week's entries */}
      <div className="card p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          This Week's Entries ({weekEntries.length})
        </h3>
        {weekEntries.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No approved entries this week yet.
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
                  <p className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Calendar className="w-4 h-4" />
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {entry.notes || 'No notes'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {formatTime(entry.time)} • {formatPercentage(entry.quality)}
                  </p>
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