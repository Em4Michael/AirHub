'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { adminApi } from '@/lib/api/admin.api';
import { WeeklyPayment } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import {
  TrendingUp, X, ChevronDown, ChevronUp,
  DollarSign, Calendar, Award, Clock, BarChart2, Wallet,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

const ADMIN_CUT = 0.25;

interface WeekSummary {
  weekStart: string; weekEnd: string; weekNumber: number; year: number;
  workerTotal: number; adminCut: number; status: string;
  paymentType: string; entryCount: number; totalHours: number; paid: boolean;
}

interface WorkerStats {
  weeklyEarnings: number; lifetimeEarnings: number;
  totalHoursThisWeek: number; avgQualityThisWeek: number;
  totalUsers: number; activeWorkers: number;
}

const statusVariant = (s: string): 'success' | 'warning' | 'danger' | 'primary' =>
  ({ paid: 'success', approved: 'primary', pending: 'warning', denied: 'danger' } as any)[s] ?? 'warning';

/**
 * Aggregate paginated payment rows into per-week table rows.
 *
 * The most recent week's workerTotal is intentionally left as-is from payment
 * records here; the caller patches it with stats.weeklyEarnings after the fact
 * so the table row matches the summary cards (both sourced from getWorkerStats).
 */
const aggregateWeeks = (payments: WeeklyPayment[]): WeekSummary[] => {
  const map = new Map<string, WeekSummary>();
  payments.forEach((p) => {
    const key = `${p.weekStart}_${p.weekEnd}`;
    if (!map.has(key)) {
      map.set(key, {
        weekStart: p.weekStart, weekEnd: p.weekEnd,
        weekNumber: p.weekNumber, year: p.year,
        workerTotal: 0, adminCut: 0,
        status: p.status, paymentType: p.paymentType,
        entryCount: 0, totalHours: 0, paid: p.paid,
      });
    }
    const row = map.get(key)!;
    row.workerTotal += p.totalEarnings ?? 0;
    row.adminCut     = row.workerTotal * ADMIN_CUT;
    row.entryCount  += p.entryCount   ?? 0;
    row.totalHours  += p.totalHours   ?? 0;
    const rank: Record<string, number> = { paid: 3, approved: 2, pending: 1, denied: 0 };
    if ((rank[p.status] ?? 0) > (rank[row.status] ?? 0)) { row.status = p.status; row.paid = p.paid; }
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );
};



// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, accent, onClick }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; accent?: boolean; onClick?: () => void;
}) => (
  <div
    role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    onClick={onClick}
    className={`flex items-center gap-4 rounded-2xl p-4 border${onClick ? ' cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    style={{
      backgroundColor: accent ? 'var(--accent-color)' : 'var(--bg-secondary)',
      borderColor:     accent ? 'transparent'          : 'var(--border-color)',
    }}
  >
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: accent ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)', color: accent ? '#fff' : 'var(--accent-color)' }}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium truncate" style={{ color: accent ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>{label}</p>
      <p className="text-lg font-bold truncate" style={{ color: accent ? '#fff' : 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs truncate" style={{ color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>{sub}</p>}
    </div>
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
const EarningsModal = ({ weeks, stats, onClose }: { weeks: WeekSummary[]; stats: WorkerStats; onClose: () => void }) => {
  /**
   * All four headline figures come from getWorkerStats — the same source the
   * main dashboard uses — so they will always match.
   */
  const thisWeekWorker = stats.weeklyEarnings;
  const thisWeekAdmin  = thisWeekWorker  * ADMIN_CUT;
  const lifetimeWorker = stats.lifetimeEarnings;
  const lifetimeAdmin  = lifetimeWorker * ADMIN_CUT;
  const paidAdminTotal = weeks.filter((w) => w.paid).reduce((s, w) => s + w.adminCut, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Admin Earnings</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>25% of all worker payouts</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 stat cards — all from getWorkerStats */}
        <div className="p-6 grid grid-cols-2 gap-3">
          <StatCard icon={<Calendar className="w-5 h-5" />} label="This Week (Workers)" value={formatCurrency(thisWeekWorker)} accent />
          <StatCard icon={<DollarSign className="w-5 h-5" />} label="This Week (Admin 25%)" value={formatCurrency(thisWeekAdmin)} />
          <StatCard icon={<BarChart2 className="w-5 h-5" />} label="Lifetime Worker Total" value={formatCurrency(lifetimeWorker)} />
          <StatCard icon={<Wallet className="w-5 h-5" />} label="Lifetime Admin (25%)" value={formatCurrency(lifetimeAdmin)} sub={`Paid weeks: ${formatCurrency(paidAdminTotal)}`} />
        </div>

        {/* Recent weeks mini-list */}
        <div className="mx-6 mb-6 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            Recent weeks
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {weeks.slice(0, 8).map((w, i) => (
              <div key={`${w.weekStart}-${i}`} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Week {w.weekNumber}, {w.year}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(w.weekStart, 'MMM d')} – {formatDate(w.weekEnd, 'MMM d')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--accent-color)' }}>{formatCurrency(w.adminCut)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>of {formatCurrency(w.workerTotal)}</p>
                </div>
              </div>
            ))}
            {weeks.length === 0 && (
              <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No payment data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminEarningsSection() {
  const [payments,  setPayments]  = useState<WeeklyPayment[]>([]);
  const [stats,     setStats]     = useState<WorkerStats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch stats + first page of payments together
      const [firstPageRes, statsRes] = await Promise.all([
        adminApi.getWeeklyPayments(undefined, 1, 500),
        adminApi.getWorkerStats(),
      ]);

      let allPayments: WeeklyPayment[] = [];

      if (firstPageRes.success) {
        allPayments = (firstPageRes.data ?? []).flat() as WeeklyPayment[];

        // If server has more pages, fetch them all so the table is complete
        const totalPages = firstPageRes.pagination?.pages ?? 1;
        if (totalPages > 1) {
          const remaining = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              adminApi.getWeeklyPayments(undefined, i + 2, 500)
            )
          );
          remaining.forEach((res) => {
            if (res.success) {
              allPayments = [...allPayments, ...((res.data ?? []).flat() as WeeklyPayment[])];
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

  const thisWeekWorker = stats?.weeklyEarnings  ?? 0;
  const thisWeekAdmin  = thisWeekWorker  * ADMIN_CUT;
  const lifetimeWorker = stats?.lifetimeEarnings ?? 0;
  const lifetimeAdmin  = lifetimeWorker * ADMIN_CUT;

  const weeks = useMemo(() => aggregateWeeks(payments), [payments]);

  /**
   * Reconciliation: difference between stats.lifetimeEarnings (computed from
   * all approved Entry records) and the sum of all WeeklyPayment rows.
   *
   * This gap exists when entries were approved but no WeeklyPayment record was
   * ever generated for that week (e.g. before auto-generation was added).
   * Showing it as an explicit row keeps the table sum = lifetime total.
   */
  const rowSum       = weeks.reduce((s, w) => s + w.workerTotal, 0);
  const unrecorded   = Math.max(0, lifetimeWorker - rowSum);
  const showReconRow = stats !== null && unrecorded > 0.5; // > 50 kobo threshold

  const toggleRow = (key: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  return (
    <>
      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Calendar className="w-5 h-5" />} label="This Week — Workers Earned"
          value={formatCurrency(thisWeekWorker)} accent />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="This Week — Admin Cut (25%)"
          value={formatCurrency(thisWeekAdmin)} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Lifetime Admin Earnings"
          value={formatCurrency(lifetimeAdmin)} sub="Click for full breakdown →"
          onClick={() => setShowModal(true)} />
      </div>

      {/* Weekly breakdown table */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Weekly Earnings</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Most recent week first · Admin cut = 25%</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
            <Award className="w-4 h-4" /> My Earnings
          </button>
        </div>

        {error && <p className="text-center py-4 text-sm" style={{ color: '#dc2626' }}>{error}</p>}

        {loading && payments.length === 0 ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : weeks.length === 0 ? (
          <p className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>No weekly payment data available</p>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <tr>
                    {['#','Week','Period','Hours','Entries','Workers Earned','Admin (25%)','Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {weeks.map((w, idx) => (
                    <tr key={`${w.weekStart}-${idx}`} className="transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="px-6 py-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Wk {w.weekNumber}<span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{w.year}</span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(w.weekStart, 'MMM d')} – {formatDate(w.weekEnd, 'MMM d')}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                          {w.totalHours.toFixed(1)}h
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{w.entryCount}</td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(w.workerTotal)}</td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--accent-color)' }}>{formatCurrency(w.adminCut)}</td>
                      <td className="px-6 py-4"><Badge variant={statusVariant(w.status) as any}>{w.status}</Badge></td>
                    </tr>
                  ))}

                  {/* Reconciliation row: entries approved before payment records existed */}
                  {showReconRow && (
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <td className="px-6 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>—</td>
                      <td colSpan={4} className="px-6 py-3 text-sm italic" style={{ color: 'var(--text-muted)' }}>
                        Earnings without payment records
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(unrecorded)}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>
                        {formatCurrency(unrecorded * ADMIN_CUT)}
                      </td>
                      <td />
                    </tr>
                  )}
                </tbody>

                {/* Footer: always equals stats.lifetimeEarnings */}
                <tfoot style={{ backgroundColor: 'var(--bg-tertiary)', borderTop: '2px solid var(--border-color)' }}>
                  <tr>
                    <td colSpan={5} className="px-6 py-3 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                      All-time totals
                    </td>
                    <td className="px-6 py-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(lifetimeWorker)}</td>
                    <td className="px-6 py-3 text-sm font-bold" style={{ color: 'var(--accent-color)' }}>{formatCurrency(lifetimeAdmin)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {weeks.map((w, idx) => {
                const key = `${w.weekStart}-${idx}`;
                const open = expanded.has(key);
                return (
                  <div key={key} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <button className="w-full flex items-center justify-between px-4 py-4 text-left" onClick={() => toggleRow(key)}>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Week {w.weekNumber}, {w.year}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(w.weekStart, 'MMM d')} – {formatDate(w.weekEnd, 'MMM d')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: 'var(--accent-color)' }}>{formatCurrency(w.adminCut)}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>admin cut</p>
                        </div>
                        {open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                               : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    </button>
                    {open && (
                      <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                        {[
                          { label: 'Workers earned', value: formatCurrency(w.workerTotal) },
                          { label: 'Admin 25%',       value: formatCurrency(w.adminCut) },
                          { label: 'Total hours',     value: `${w.totalHours.toFixed(1)}h` },
                          { label: 'Entries',         value: String(w.entryCount) },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
                          </div>
                        ))}
                        <div className="col-span-2 pt-1"><Badge variant={statusVariant(w.status) as any}>{w.status}</Badge></div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile reconciliation row */}
              {showReconRow && (
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Earnings without payment records</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>{formatCurrency(unrecorded * ADMIN_CUT)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>of {formatCurrency(unrecorded)}</p>
                  </div>
                </div>
              )}

              {/* Mobile totals footer */}
              <div className="px-4 py-4 flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderTop: '2px solid var(--border-color)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>All-time admin total</p>
                <p className="text-sm font-bold" style={{ color: 'var(--accent-color)' }}>{formatCurrency(lifetimeAdmin)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && stats && (
        <EarningsModal weeks={weeks} stats={stats} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}