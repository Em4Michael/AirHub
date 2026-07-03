'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { adminApi } from '@/lib/api/admin.api';
import { apiClient } from '@/lib/api/client';
import { WeeklyPayment } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import {
  TrendingUp, X, ChevronDown, ChevronUp,
  DollarSign, Calendar, Award, Clock, BarChart2, Wallet, Percent,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

const DEFAULT_ADMIN_CUT = 0.25;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileMeta {
  _id: string;
  adminCutPercentage?: number | null;
  isTerminated?: boolean;
}

interface WeekSummary {
  weekStart:   string;
  weekEnd:     string;
  weekNumber:  number;
  year:        number;
  /** Actual: excludes terminated-account earnings */
  workerTotal: number;
  adminCut:    number;
  /** Gross (old method): includes everything */
  grossWorkerTotal: number;
  grossAdminCut:    number;
  /** True if any termination deduction was applied this week */
  hasDeduction: boolean;
  status:      string;
  paymentType: string;
  entryCount:  number;
  totalHours:  number;
  paid:        boolean;
}

interface WorkerStats {
  weeklyEarnings:     number;
  lifetimeEarnings:   number;
  totalHoursThisWeek: number;
  avgQualityThisWeek: number;
  totalUsers:         number;
  activeWorkers:      number;
}

interface PaymentRow extends WeeklyPayment {}

/** key: `${userId}_${weekNumber}_${year}` */
type FractionMap = Map<string, { terminatedFraction: number; activeRate: number }>;

const statusVariant = (s: string): 'success' | 'warning' | 'danger' | 'primary' =>
  ({ paid: 'success', approved: 'primary', pending: 'warning', denied: 'danger' } as any)[s] ?? 'warning';

/**
 * Build per-week summaries.
 *
 * For each payment:
 *  - grossWorkerTotal / grossAdminCut  = old method (flat DEFAULT cut on full earnings)
 *  - workerTotal / adminCut            = new method (terminated fraction removed, per-account rate)
 */
const aggregateWeeks = (
  payments: PaymentRow[],
  fractionMap: FractionMap,
): WeekSummary[] => {
  const map = new Map<string, WeekSummary>();

  payments.forEach((p) => {
    const key = `${p.weekStart}_${p.weekEnd}`;
    if (!map.has(key)) {
      map.set(key, {
        weekStart:        p.weekStart,
        weekEnd:          p.weekEnd,
        weekNumber:       p.weekNumber,
        year:             p.year,
        workerTotal:      0,
        adminCut:         0,
        grossWorkerTotal: 0,
        grossAdminCut:    0,
        hasDeduction:     false,
        status:           p.status,
        paymentType:      p.paymentType,
        entryCount:       0,
        totalHours:       0,
        paid:             p.paid,
      });
    }
    const row  = map.get(key)!;
    const earn = p.totalEarnings ?? 0;

    // ── Gross (old method) ────────────────────────────────────────────────
    row.grossWorkerTotal += earn;
    row.grossAdminCut    += earn * DEFAULT_ADMIN_CUT;

    // ── Actual (new method) ───────────────────────────────────────────────
    const userId  = typeof p.user === 'string' ? p.user : (p.user as any)?._id ?? '';
    const fracKey = `${userId}_${p.weekNumber}_${p.year}`;
    const frac    = fractionMap.get(fracKey);

    const termFrac   = frac?.terminatedFraction ?? 0;
    const activeRate = frac?.activeRate         ?? DEFAULT_ADMIN_CUT;

    const activeEarn = earn * (1 - termFrac);
    row.workerTotal += activeEarn;
    row.adminCut    += activeEarn * activeRate;
    if (termFrac > 0) row.hasDeduction = true;

    row.entryCount += p.entryCount ?? 0;
    row.totalHours += p.totalHours ?? 0;

    const rank: Record<string, number> = { paid: 3, approved: 2, pending: 1, denied: 0 };
    if ((rank[p.status] ?? 0) > (rank[row.status] ?? 0)) {
      row.status = p.status;
      row.paid   = p.paid;
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );
};

// ── Dual amount display ───────────────────────────────────────────────────────
// Shows actual (bold) and, if different, gross (muted strikethrough) below it.

const DualAmount = ({
  actual, gross, accentActual = false,
}: {
  actual: number;
  gross:  number;
  accentActual?: boolean;
}) => {
  const diff = Math.abs(gross - actual) > 1; // only show gross if meaningfully different
  return (
    <div>
      <p
        className="font-bold tabular-nums"
        style={{ color: accentActual ? 'var(--accent-color)' : 'var(--text-primary)' }}
      >
        {formatCurrency(actual)}
      </p>
      {diff && (
        <p
          className="text-xs tabular-nums line-through"
          style={{ color: 'var(--text-muted)' }}
          title="Gross (before terminated-account deduction)"
        >
          {formatCurrency(gross)}
        </p>
      )}
    </div>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, accent, onClick }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; accent?: boolean; onClick?: () => void;
}) => (
  <div
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    onClick={onClick}
    className={`flex items-center gap-4 rounded-2xl p-4 border${onClick ? ' cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    style={{
      backgroundColor: accent ? 'var(--accent-color)' : 'var(--bg-secondary)',
      borderColor:     accent ? 'transparent'          : 'var(--border-color)',
    }}
  >
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        backgroundColor: accent ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
        color: accent ? '#fff' : 'var(--accent-color)',
      }}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium truncate"
        style={{ color: accent ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-lg font-bold truncate"
        style={{ color: accent ? '#fff' : 'var(--text-primary)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs truncate"
          style={{ color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
          {sub}
        </p>
      )}
    </div>
  </div>
);

// ── Dual StatCard (actual bold + gross muted below) ───────────────────────────

const DualStatCard = ({ icon, label, actual, gross, accent, onClick }: {
  icon: React.ReactNode; label: string;
  actual: number; gross: number;
  accent?: boolean; onClick?: () => void;
}) => {
  const diff = Math.abs(gross - actual) > 1;
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl p-4 border${onClick ? ' cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      style={{
        backgroundColor: accent ? 'var(--accent-color)' : 'var(--bg-secondary)',
        borderColor:     accent ? 'transparent'          : 'var(--border-color)',
      }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: accent ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
          color: accent ? '#fff' : 'var(--accent-color)',
        }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate"
          style={{ color: accent ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>
          {label}
        </p>
        <p className="text-lg font-bold leading-tight"
          style={{ color: accent ? '#fff' : 'var(--text-primary)' }}>
          {formatCurrency(actual)}
        </p>
        {diff && (
          <p className="text-xs line-through leading-tight"
            style={{ color: accent ? 'rgba(255,255,255,0.45)' : 'var(--text-muted)' }}
            title="Gross before terminated-account deduction">
            {formatCurrency(gross)}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────

const EarningsModal = ({
  weeks, lifetimeWorker, lifetimeAdmin,
  grossLifetimeWorker, grossLifetimeAdmin,
  thisWeekWorker, thisWeekAdmin,
  grossThisWeekWorker, grossThisWeekAdmin,
  onClose,
}: {
  weeks:               WeekSummary[];
  lifetimeWorker:      number; lifetimeAdmin:      number;
  grossLifetimeWorker: number; grossLifetimeAdmin: number;
  thisWeekWorker:      number; thisWeekAdmin:      number;
  grossThisWeekWorker: number; grossThisWeekAdmin: number;
  onClose:             () => void;
}) => {
  const paidAdminTotal = weeks.filter((w) => w.paid).reduce((s, w) => s + w.adminCut, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}>

        <div className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Admin Earnings
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Bold = actual (terminated excluded) · Strikethrough = gross
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-3">
          <DualStatCard icon={<Calendar className="w-5 h-5" />}
            label="This Week (Workers)"
            actual={thisWeekWorker} gross={grossThisWeekWorker} accent />
          <DualStatCard icon={<DollarSign className="w-5 h-5" />}
            label="This Week (Admin)"
            actual={thisWeekAdmin} gross={grossThisWeekAdmin} />
          <DualStatCard icon={<BarChart2 className="w-5 h-5" />}
            label="Lifetime Worker Total"
            actual={lifetimeWorker} gross={grossLifetimeWorker} />
          <DualStatCard icon={<Wallet className="w-5 h-5" />}
            label="Lifetime Admin Total"
            actual={lifetimeAdmin} gross={grossLifetimeAdmin}
            onClick={undefined} />
        </div>

        {/* Legend */}
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-xl p-3"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <Percent className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-color)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Bold</strong> figures exclude earnings from terminated accounts.{' '}
            <span className="line-through">Strikethrough</span> shows what the total would have been with all accounts included.{' '}
            <Link href="/dashboard/admin/accounts"
              className="font-semibold underline"
              style={{ color: 'var(--accent-color)' }} onClick={onClose}>
              Configure rates →
            </Link>
          </p>
        </div>

        {/* Recent weeks list */}
        <div className="mx-6 mb-6 rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border-color)' }}>
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            Recent weeks
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {weeks.slice(0, 8).map((w, i) => (
              <div key={`${w.weekStart}-${i}`}
                className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Week {w.weekNumber}, {w.year}
                    </p>
                    <Badge variant={statusVariant(w.status) as any}>{w.status}</Badge>
                    {w.hasDeduction && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: 'color-mix(in srgb, #ef4444 12%, var(--bg-tertiary))', color: '#ef4444' }}>
                        −terminated
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(w.weekStart, 'MMM d')} – {formatDate(w.weekEnd, 'MMM d')}
                  </p>
                </div>
                <div className="text-right">
                  {/* Actual admin cut bold */}
                  <p className="text-sm font-bold" style={{ color: 'var(--accent-color)' }}>
                    {formatCurrency(w.adminCut)}
                  </p>
                  {/* Gross muted strikethrough if different */}
                  {w.hasDeduction && (
                    <p className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(w.grossAdminCut)}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    of {formatCurrency(w.workerTotal)}
                  </p>
                </div>
              </div>
            ))}
            {weeks.length === 0 && (
              <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                No payment data yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminEarningsSection() {
  const [payments,    setPayments]    = useState<PaymentRow[]>([]);
  const [fractionMap, setFractionMap] = useState<FractionMap>(new Map());
  const [stats,       setStats]       = useState<WorkerStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [expanded,    setExpanded]    = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [firstPageRes, statsRes, earningsRes] = await Promise.all([
        adminApi.getWeeklyPayments(undefined, 1, 500),
        adminApi.getWorkerStats(),
        apiClient.get('/admin/admin-earnings').catch(() => ({ data: null })),
      ]);

      // Build fraction map from backend
      const fMap: FractionMap = new Map();
      if (earningsRes.data?.success && earningsRes.data?.data?.workerWeekFractions) {
        (earningsRes.data.data.workerWeekFractions as any[]).forEach((entry: any) => {
          fMap.set(
            `${entry.userId}_${entry.weekNumber}_${entry.year}`,
            { terminatedFraction: entry.terminatedFraction, activeRate: entry.activeRate }
          );
        });
      }
      setFractionMap(fMap);

      // Payment records
      let allPayments: PaymentRow[] = [];
      if (firstPageRes.success) {
        allPayments = (firstPageRes.data ?? []).flat() as PaymentRow[];
        const totalPages = firstPageRes.pagination?.pages ?? 1;
        if (totalPages > 1) {
          const remaining = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              adminApi.getWeeklyPayments(undefined, i + 2, 500)
            )
          );
          remaining.forEach((res) => {
            if (res.success) {
              allPayments = [...allPayments, ...((res.data ?? []).flat() as PaymentRow[])];
            }
          });
        }
      }
      setPayments(allPayments);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
    } catch {
      setError('Failed to load earnings data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const weeks = useMemo(
    () => aggregateWeeks(payments, fractionMap),
    [payments, fractionMap]
  );

  // ── Actual (terminated excluded) ──────────────────────────────────────────
  const thisWeekWorker  = weeks[0]?.workerTotal     ?? (stats?.weeklyEarnings ?? 0);
  const thisWeekAdmin   = weeks[0]?.adminCut        ?? (stats?.weeklyEarnings ?? 0) * DEFAULT_ADMIN_CUT;
  const rowWorkerSum    = weeks.reduce((s, w) => s + w.workerTotal, 0);
  const rowAdminSum     = weeks.reduce((s, w) => s + w.adminCut, 0);
  const lifetimeWorker  = stats?.lifetimeEarnings ?? rowWorkerSum;
  const unrecorded      = Math.max(0, lifetimeWorker - rowWorkerSum);
  const lifetimeAdmin   = rowAdminSum + unrecorded * DEFAULT_ADMIN_CUT;
  const showReconRow    = stats !== null && unrecorded > 0.5;

  // ── Gross (old method — no termination deduction) ─────────────────────────
  const grossThisWeekWorker  = weeks[0]?.grossWorkerTotal ?? (stats?.weeklyEarnings ?? 0);
  const grossThisWeekAdmin   = weeks[0]?.grossAdminCut    ?? (stats?.weeklyEarnings ?? 0) * DEFAULT_ADMIN_CUT;
  const grossRowWorkerSum    = weeks.reduce((s, w) => s + w.grossWorkerTotal, 0);
  const grossRowAdminSum     = weeks.reduce((s, w) => s + w.grossAdminCut, 0);
  const grossLifetimeWorker  = stats?.lifetimeEarnings ?? grossRowWorkerSum;
  const grossLifetimeAdmin   = grossRowAdminSum + unrecorded * DEFAULT_ADMIN_CUT;

  const toggleRow = (key: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  return (
    <>
      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DualStatCard
          icon={<Calendar className="w-5 h-5" />}
          label="This Week — Workers Earned"
          actual={thisWeekWorker}
          gross={grossThisWeekWorker}
          accent
        />
        <DualStatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="This Week — Admin Cut"
          actual={thisWeekAdmin}
          gross={grossThisWeekAdmin}
        />
        <DualStatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Lifetime Admin Earnings"
          actual={lifetimeAdmin}
          gross={grossLifetimeAdmin}
          onClick={() => setShowModal(true)}
        />
      </div>

      {/* ── Rate notice ────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl p-4 border"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-color) 5%, var(--bg-secondary))',
          borderColor:     'color-mix(in srgb, var(--accent-color) 25%, var(--border-color))',
        }}>
        <Percent className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-color)' }} />
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Bold</strong> figures reflect actual earnings after excluding terminated accounts.{' '}
          <span className="line-through" style={{ color: 'var(--text-muted)' }}>Strikethrough</span>{' '}
          shows the gross total before deductions.{' '}
          <Link href="/dashboard/admin/accounts"
            className="font-semibold underline"
            style={{ color: 'var(--accent-color)' }}>
            Configure rates →
          </Link>
        </p>
      </div>

      {/* ── Weekly breakdown table ─────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Weekly Earnings
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Most recent week first · bold = actual · strikethrough = gross
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
            <Award className="w-4 h-4" /> My Earnings
          </button>
        </div>

        {error && (
          <p className="text-center py-4 text-sm" style={{ color: '#dc2626' }}>{error}</p>
        )}

        {loading && payments.length === 0 ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : weeks.length === 0 ? (
          <p className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            No weekly payment data available
          </p>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <tr>
                    {['#','Week','Period','Hours','Entries','Workers Earned','Admin Cut','Status'].map((h) => (
                      <th key={h}
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-secondary)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {weeks.map((w, idx) => (
                    <tr key={`${w.weekStart}-${idx}`}
                      className="transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="px-6 py-4 text-xs font-mono"
                        style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}>
                        Wk {w.weekNumber}
                        <span className="ml-1 text-xs font-normal"
                          style={{ color: 'var(--text-muted)' }}>{w.year}</span>
                        {w.hasDeduction && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold align-middle"
                            style={{
                              backgroundColor: 'color-mix(in srgb, #ef4444 12%, var(--bg-tertiary))',
                              color: '#ef4444',
                            }}>
                            −T
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm"
                        style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(w.weekStart, 'MMM d')} – {formatDate(w.weekEnd, 'MMM d')}
                      </td>
                      <td className="px-6 py-4 text-sm"
                        style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                          {w.totalHours.toFixed(1)}h
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm"
                        style={{ color: 'var(--text-secondary)' }}>{w.entryCount}</td>
                      {/* Workers Earned: actual bold, gross muted strikethrough */}
                      <td className="px-6 py-4">
                        <DualAmount
                          actual={w.workerTotal}
                          gross={w.grossWorkerTotal}
                        />
                      </td>
                      {/* Admin Cut: actual bold accent, gross muted strikethrough */}
                      <td className="px-6 py-4">
                        <DualAmount
                          actual={w.adminCut}
                          gross={w.grossAdminCut}
                          accentActual
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant(w.status) as any}>{w.status}</Badge>
                      </td>
                    </tr>
                  ))}

                  {showReconRow && (
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <td className="px-6 py-3 text-xs font-mono"
                        style={{ color: 'var(--text-muted)' }}>—</td>
                      <td colSpan={4} className="px-6 py-3 text-sm italic"
                        style={{ color: 'var(--text-muted)' }}>
                        Earnings without payment records
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(unrecorded)}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold"
                        style={{ color: 'var(--accent-color)' }}>
                        {formatCurrency(unrecorded * DEFAULT_ADMIN_CUT)}
                      </td>
                      <td />
                    </tr>
                  )}
                </tbody>

                <tfoot style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderTop: '2px solid var(--border-color)',
                }}>
                  <tr>
                    <td colSpan={5} className="px-6 py-3 text-sm font-bold"
                      style={{ color: 'var(--text-secondary)' }}>
                      All-time totals
                    </td>
                    <td className="px-6 py-3">
                      <DualAmount actual={lifetimeWorker} gross={grossLifetimeWorker} />
                    </td>
                    <td className="px-6 py-3">
                      <DualAmount actual={lifetimeAdmin} gross={grossLifetimeAdmin} accentActual />
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {weeks.map((w, idx) => {
                const key  = `${w.weekStart}-${idx}`;
                const open = expanded.has(key);
                return (
                  <div key={key} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <button
                      className="w-full flex items-center justify-between px-4 py-4 text-left"
                      onClick={() => toggleRow(key)}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm"
                            style={{ color: 'var(--text-primary)' }}>
                            Week {w.weekNumber}, {w.year}
                          </p>
                          {w.hasDeduction && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{
                                backgroundColor: 'color-mix(in srgb, #ef4444 12%, var(--bg-tertiary))',
                                color: '#ef4444',
                              }}>
                              −T
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(w.weekStart, 'MMM d')} – {formatDate(w.weekEnd, 'MMM d')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold"
                            style={{ color: 'var(--accent-color)' }}>
                            {formatCurrency(w.adminCut)}
                          </p>
                          {w.hasDeduction && (
                            <p className="text-xs line-through"
                              style={{ color: 'var(--text-muted)' }}>
                              {formatCurrency(w.grossAdminCut)}
                            </p>
                          )}
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>admin cut</p>
                        </div>
                        {open
                          ? <ChevronUp   className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    </button>

                    {open && (
                      <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-2"
                        style={{ borderTop: '1px solid var(--border-color)' }}>
                        {[
                          {
                            label: 'Workers earned',
                            value: formatCurrency(w.workerTotal),
                            sub:   w.hasDeduction ? formatCurrency(w.grossWorkerTotal) : undefined,
                          },
                          {
                            label: 'Admin cut',
                            value: formatCurrency(w.adminCut),
                            sub:   w.hasDeduction ? formatCurrency(w.grossAdminCut) : undefined,
                          },
                          { label: 'Total hours', value: `${w.totalHours.toFixed(1)}h` },
                          { label: 'Entries',     value: String(w.entryCount) },
                        ].map(({ label, value, sub }) => (
                          <div key={label} className="rounded-lg p-3"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                            <p className="text-sm font-semibold mt-0.5"
                              style={{ color: 'var(--text-primary)' }}>{value}</p>
                            {sub && (
                              <p className="text-xs line-through"
                                style={{ color: 'var(--text-muted)' }}>{sub}</p>
                            )}
                          </div>
                        ))}
                        <div className="col-span-2 pt-1">
                          <Badge variant={statusVariant(w.status) as any}>{w.status}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {showReconRow && (
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                    Earnings without payment records
                  </p>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>
                      {formatCurrency(unrecorded * DEFAULT_ADMIN_CUT)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      of {formatCurrency(unrecorded)}
                    </p>
                  </div>
                </div>
              )}

              <div className="px-4 py-4 flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderTop: '2px solid var(--border-color)',
                }}>
                <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                  All-time admin total
                </p>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--accent-color)' }}>
                    {formatCurrency(lifetimeAdmin)}
                  </p>
                  {Math.abs(grossLifetimeAdmin - lifetimeAdmin) > 1 && (
                    <p className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(grossLifetimeAdmin)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <EarningsModal
          weeks={weeks}
          lifetimeWorker={lifetimeWorker}   lifetimeAdmin={lifetimeAdmin}
          grossLifetimeWorker={grossLifetimeWorker} grossLifetimeAdmin={grossLifetimeAdmin}
          thisWeekWorker={thisWeekWorker}   thisWeekAdmin={thisWeekAdmin}
          grossThisWeekWorker={grossThisWeekWorker} grossThisWeekAdmin={grossThisWeekAdmin}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}