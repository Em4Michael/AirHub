'use client';

// Route: /dashboard/analyst/admin/accounts/[id]/page.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { analystApi } from '@/lib/api/analyst.api';
import { AccountStats } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { WorkerHoursBar, colourForIndex, WorkerSlice } from '@/components/analyst/WorkerHoursBar';
import {
  ArrowLeft, Clock, Users, CalendarDays, CalendarRange, Calendar,
  Infinity as InfinityIcon, KeyRound, User, Mail, MapPin, Eye, EyeOff, ShieldAlert,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

type Period = 'today' | 'week' | 'month' | 'allTime';

const PERIODS: { key: Period; label: string; icon: React.ReactNode }[] = [
  { key: 'today',   label: 'Daily',    icon: <CalendarDays  className="w-4 h-4" /> },
  { key: 'week',    label: 'Weekly',   icon: <CalendarRange className="w-4 h-4" /> },
  { key: 'month',   label: 'Monthly',  icon: <Calendar      className="w-4 h-4" /> },
  { key: 'allTime', label: 'All time', icon: <InfinityIcon  className="w-4 h-4" /> },
];

export default function AnalystAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [stats,   setStats]   = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [period,  setPeriod]  = useState<Period>('today');
  const [showLogin, setShowLogin] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analystApi.getAccountStats(id);
      if (res.success) setStats(res.data!);
      else setError('Could not load account stats');
    } catch {
      setError('Could not load account stats');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  // Stable colour per worker across every bar on the page.
  const colourMap = useMemo(() => {
    const map: Record<string, string> = {};
    (stats?.workerBreakdown ?? []).forEach((w, i) => { map[w.id] = colourForIndex(i); });
    return map;
  }, [stats]);

  const periodTotal = (p: Period) =>
    p === 'today' ? stats?.today
    : p === 'week' ? stats?.thisWeek
    : p === 'month' ? stats?.thisMonth
    : stats?.allTime;

  const capFor = (p: Period) =>
    p === 'today' ? stats?.caps.daily
    : p === 'week' ? stats?.caps.weekly
    : p === 'month' ? stats?.caps.monthly
    : 0; // all-time: no cap → bar fills against total

  const slices: WorkerSlice[] = useMemo(
    () => (stats?.workerBreakdown ?? [])
      .map((w) => ({ id: w.id, name: w.name, hours: w[period] }))
      .filter((w) => w.hours > 0),
    [stats, period]
  );

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  if (error || !stats) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: 'var(--accent-color)' }}>
          <ArrowLeft className="w-4 h-4" />Back
        </button>
        <Alert type="error" message={error || 'Account not found'} onClose={() => setError('')} />
      </div>
    );
  }

  const p = stats.profile;
  const cap = capFor(period) ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Back */}
      <button onClick={() => router.push('/dashboard/analyst/admin/accounts')}
        className="flex items-center gap-2 text-sm font-semibold"
        style={{ color: 'var(--accent-color)' }}>
        <ArrowLeft className="w-4 h-4" />All accounts
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
            style={{ backgroundColor: p.isTerminated ? '#9ca3af' : 'var(--accent-color)' }}>
            {p.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{p.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge variant={p.currentHolder ? 'danger' : 'success'}>
                {p.currentHolder ? `Claimed by ${(p.currentHolder as any).name}` : 'Available'}
              </Badge>
              {p.isTerminated && <Badge variant="danger">Terminated</Badge>}
              {!p.isActive && <Badge variant="warning">Inactive</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Period totals (infographic strip) ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PERIODS.map(({ key, label, icon }) => {
          const val    = periodTotal(key) ?? 0;
          const c      = capFor(key) ?? 0;
          const pct    = c > 0 ? Math.min(100, (val / c) * 100) : 0;
          const active = period === key;
          return (
            <button key={key} onClick={() => setPeriod(key)}
              className="text-left rounded-2xl p-4 border transition-all"
              style={{
                backgroundColor: active
                  ? 'color-mix(in srgb, var(--accent-color) 10%, var(--bg-secondary))'
                  : 'var(--bg-secondary)',
                borderColor: active ? 'var(--accent-color)' : 'var(--border-color)',
                borderWidth: active ? 2 : 1,
              }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-color)' }}>
                  {icon}
                </div>
                {active && (
                  <span className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: 'var(--accent-color)' }}>Viewing</span>
                )}
              </div>
              <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {val}<span className="text-base font-bold" style={{ color: 'var(--text-muted)' }}>h</span>
              </p>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
              {c > 0 && (
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#ef4444' : 'var(--accent-color)' }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Per-worker breakdown (signature multi-colour bar) ─────────────── */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Who worked this account — {PERIODS.find((x) => x.key === period)!.label}
            </h2>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {cap > 0 ? `Cap ${cap}h` : 'No cap'}
          </span>
        </div>

        {slices.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
            No approved hours in this period yet.
          </p>
        ) : (
          <WorkerHoursBar slices={slices} cap={cap} colourMap={colourMap} height={26} />
        )}
      </div>

      {/* ── 30-day trend ──────────────────────────────────────────────────── */}
      {stats.chartData.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Daily hours — last 30 days
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="acctFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-color)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent-color)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: 12 }}
                formatter={(v: any) => [`${v}h`, 'Hours']} />
              <Area type="monotone" dataKey="hours" stroke="var(--accent-color)" strokeWidth={2} fill="url(#acctFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Account details + access ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Registered details */}
        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Account details</h2>
          <DetailRow icon={<User className="w-4 h-4" />} label="Bearer name" value={p.accountBearerName} />
          {p.accountName  && <DetailRow icon={<User className="w-4 h-4" />} label="Account name" value={p.accountName} />}
          {p.email        && <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={p.email} />}
          {(p.state || p.country) && (
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location"
              value={[p.state, p.country].filter(Boolean).join(', ')} />
          )}
          {p.description && (
            <div className="pt-1">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
            </div>
          )}
        </div>

        {/* Login / access — sensitive, hidden by default */}
        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Access</h2>
            </div>
            {(p.loginDetails || p.loginMethod) && (
              <button onClick={() => setShowLogin((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {showLogin ? <><EyeOff className="w-3.5 h-3.5" />Hide</> : <><Eye className="w-3.5 h-3.5" />Reveal</>}
              </button>
            )}
          </div>

          {!p.loginDetails && !p.loginMethod ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No access details stored.</p>
          ) : (
            <>
              {p.loginMethod && <DetailRow icon={<ShieldAlert className="w-4 h-4" />} label="Method" value={p.loginMethod} />}
              {p.loginDetails && (
                <div>
                  <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Credentials</p>
                  <p className="text-sm font-mono p-3 rounded-xl break-all"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    {showLogin ? p.loginDetails : '•'.repeat(Math.min(24, p.loginDetails.length))}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pool */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
          Worker pool ({p.workerPool.length})
        </h2>
        {p.workerPool.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No workers assigned to this account.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {p.workerPool.map((w: any) => (
              <span key={w._id} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--accent-color)' }}>
                  {w.name?.[0]?.toUpperCase()}
                </span>
                {w.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5" style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}