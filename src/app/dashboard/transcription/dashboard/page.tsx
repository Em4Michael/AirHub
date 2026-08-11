'use client';

// Route: /dashboard/transcription/page.tsx
//
// Two dashboards behind one route:
//   • Admin / superadmin → MONITORING view (whole operation)
//   • Worker             → PERSONAL view (their own tasks, earnings, sessions)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { transcriptionApi } from '@/lib/api/transcription.api';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { WorkerHoursBar, colourForIndex, WorkerSlice } from '@/components/analyst/WorkerHoursBar';
import {
  ClipboardList, BarChart2, Award, CheckCircle, AlertCircle, Play, StopCircle,
  ChevronRight, Zap, Users, Trophy, Hourglass, Wallet, Flame,
  Briefcase, Percent, Activity, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import Link from 'next/link';

const money = (n: number) => formatCurrency(n ?? 0);

type Period = 'today' | 'week' | 'month' | 'allTime';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today',   label: 'Today'    },
  { key: 'week',    label: 'This week' },
  { key: 'month',   label: 'This month' },
  { key: 'allTime', label: 'All time'   },
];

export default function TranscriptionDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;
  return isAdmin ? <MonitoringDashboard /> : <PersonalDashboard />;
}

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN — MONITORING DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */

function MonitoringDashboard() {
  const [prod,    setProd]    = useState<any>(null);
  const [earners, setEarners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [period,  setPeriod]  = useState<Period>('week');

  const load = useCallback(async () => {
    setLoading(true);
    const [prodRes, topRes, bmRes] = await Promise.allSettled([
      transcriptionApi.getProduction(),
      transcriptionApi.getTopEarners(),
      transcriptionApi.getBenchmarks(),
    ]);
    if (prodRes.status === 'fulfilled' && prodRes.value.success) {
      const p = prodRes.value.data as any;
      if (bmRes.status === 'fulfilled' && bmRes.value.success) {
        const bms = (bmRes.value.data as any[]) ?? [];
        const active = bms.find((b: any) => b.isActive) ?? bms[0];
        if (active && p) { p.minutesPerTask = active.minutesPerTask; p.ratePerHour = active.ratePerHour; }
      }
      setProd(p);
    } else setError('Could not load production data.');
    if (topRes.status === 'fulfilled' && topRes.value.success)
      setEarners((topRes.value.data as any)?.earners ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const accountSlices: WorkerSlice[] = useMemo(
    () => (prod?.topAccounts ?? []).map((a: any) => ({ id: a.id, name: a.name, hours: a[period] })).filter((x: any) => x.hours > 0),
    [prod, period]
  );
  const workerSlices: WorkerSlice[] = useMemo(
    () => (prod?.topWorkers ?? []).map((w: any) => ({ id: w.id, name: w.name, hours: w[period] })).filter((x: any) => x.hours > 0),
    [prod, period]
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;

  const totalFor = (p: Period) => prod?.totals[p] ?? 0;
  const earnFor  = (p: Period) => prod?.earnings[p] ?? 0;
  const cutFor   = (p: Period) => prod?.adminCut[p] ?? 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
              <ClipboardList className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Transcription Monitoring</h1>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {prod?.minutesPerTask ?? '…'} min/task · {money(prod?.ratePerHour ?? 0)}/hr · cap {prod?.maxTasksPerDay ?? 500} tasks/account/day
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/transcription/admin" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
            <CheckCircle className="w-4 h-4" />Vet sessions
          </Link>
          <Link href="/dashboard/transcription/admin/production" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
            <Activity className="w-4 h-4" />Full production
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {!prod ? (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No production data yet.</p>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Analyst payout · this week</p>
                  <p className="text-4xl sm:text-5xl font-black tabular-nums mt-1" style={{ color: 'var(--text-primary)' }}>{money(prod.earnings.week)}</p>
                  <p className="inline-flex items-center gap-1 text-sm font-semibold mt-2" style={{ color: 'var(--accent-color)' }}>
                    <ClipboardList className="w-4 h-4" />{prod.totals.week} tasks approved this week · {prod.totals.today} today
                  </p>
                </div>
                <div className="rounded-2xl px-4 py-3 border-2" style={{ backgroundColor: 'color-mix(in srgb, #10b981 8%, var(--bg-secondary))', borderColor: 'color-mix(in srgb, #10b981 40%, var(--border-color))' }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Percent className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#059669' }}>Admin cut {Math.round(prod.adminCut.rate * 100)}%</p>
                  </div>
                  <p className="text-2xl font-black tabular-nums" style={{ color: '#047857' }}>{money(prod.adminCut.week)}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>company earning</p>
                </div>
              </div>

              {prod.trend.length > 0 ? (
                <div className="mt-4 -mx-2">
                  <ResponsiveContainer width="100%" height={170}>
                    <AreaChart data={prod.trend} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="transFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-color)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--accent-color)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={(d) => String(d).slice(5)} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: 12 }}
                        formatter={(v: any) => [`${v} tasks`, 'Tasks']} />
                      <Area type="monotone" dataKey="tasks" stroke="var(--accent-color)" strokeWidth={2.5} fill="url(#transFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed p-6 text-center" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No approved tasks yet. Approve pending sessions to populate the trend.</p>
                </div>
              )}
            </div>

            {/* Fleet snapshot */}
            <div className="rounded-2xl border p-6 flex flex-col justify-center gap-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <SnapshotRow icon={<Briefcase className="w-4 h-4" />} label="Active accounts" value={String(prod.accountCount)} sub={`${prod.activeClaims} claimed now`} />
              <SnapshotRow icon={<CheckCircle className="w-4 h-4" />} label="Approved sessions" value={String(prod.sessionCount)} sub="all time" />
              <SnapshotRow icon={<Wallet className="w-4 h-4" />} label="Payout all-time" value={money(prod.earnings.allTime)} sub={`admin cut ${money(prod.adminCut.allTime)}`} />
            </div>
          </div>

          {/* Period toggle */}
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(({ key, label }) => (
              <button key={key} onClick={() => setPeriod(key)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: period === key ? 'var(--accent-color)' : 'var(--bg-secondary)',
                  color: period === key ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${period === key ? 'transparent' : 'var(--border-color)'}`,
                }}>
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <PeriodStat label="Tasks" value={`${totalFor(period)}`} />
            <PeriodStat label="Analyst payout" value={money(earnFor(period))} />
            <PeriodStat label={`Admin cut (${Math.round(prod.adminCut.rate * 100)}%)`} value={money(cutFor(period))} highlight />
          </div>

          {/* Busiest accounts + analysts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Busiest accounts</h2>
              </div>
              {accountSlices.length === 0
                ? <EmptyBlock text="No account tasks in this period." />
                : <WorkerHoursBar slices={accountSlices} cap={0} height={22} />}
            </div>
            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Busiest analysts</h2>
              </div>
              {workerSlices.length === 0
                ? <EmptyBlock text="No analyst tasks in this period." />
                : <WorkerHoursBar slices={workerSlices} cap={0} height={22} />}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Top earners · this week</h2>
              </div>
              <Link href="/dashboard/transcription/top-earners" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--accent-color)' }}>
                Full leaderboard <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {earners.length === 0 ? (
              <EmptyBlock text="No approved earnings yet this week." />
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {earners.slice(0, 8).map((e: any) => (
                  <div key={e.userId} className="px-5 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                        style={{ backgroundColor: e.rank <= 3 ? 'var(--accent-color)' : 'var(--bg-tertiary)', color: e.rank <= 3 ? '#fff' : 'var(--text-muted)' }}>
                        {e.rank}
                      </span>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{e.name}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>{e.tasks} tasks</span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{money(e.earnings)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   WORKER — PERSONAL DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */

function PersonalDashboard() {
  const [data,        setData]        = useState<any>(null);
  const [profiles,    setProfiles]    = useState<any[]>([]);
  const [sessions,    setSessions]    = useState<any[]>([]);
  const [rank,        setRank]        = useState<{ rank: number; total: number } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [returnModal, setReturnModal] = useState(false);
  const [tasks,       setTasks]       = useState('');
  const [notes,       setNotes]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [dashRes, profRes, sessRes, topRes, bmRes] = await Promise.allSettled([
      transcriptionApi.getDashboard(),
      transcriptionApi.getProfiles(),
      transcriptionApi.getMySessions({ page: 1, limit: 30 }),
      transcriptionApi.getTopEarners(),
      transcriptionApi.getBenchmarks(),
    ]);
    if (dashRes.status === 'fulfilled' && dashRes.value.success) {
      const d = dashRes.value.data as any;
      // Override rate from active benchmark if available (dashboard rate may be from old sessions)
      if (bmRes.status === 'fulfilled' && bmRes.value.success) {
        const bms = (bmRes.value.data as any[]) ?? [];
        const active = bms.find((b: any) => b.isActive) ?? bms[0];
        if (active && d) {
          d.minutesPerTask = active.minutesPerTask;
          d.ratePerHour    = active.ratePerHour;
        }
      }
      setData(d);
    } else setError('Could not load dashboard stats');
    if (profRes.status === 'fulfilled' && profRes.value.success) setProfiles(profRes.value.data ?? []);
    if (sessRes.status === 'fulfilled' && sessRes.value.success) setSessions(sessRes.value.data ?? []);
    if (topRes.status === 'fulfilled' && topRes.value.success) {
      const earners = (topRes.value.data as any)?.earners ?? [];
      const me = earners.find((e: any) => e.isCurrentUser);
      if (me) setRank({ rank: me.rank, total: earners.length });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openReturn = () => { setTasks(''); setNotes(''); setError(''); setReturnModal(true); };

  const handleReturn = async () => {
    if (!data?.activeSession) return;
    const t = parseInt(tasks, 10);
    if (!tasks || isNaN(t) || t <= 0) { setError('Enter the number of tasks you completed (e.g. 100)'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await transcriptionApi.returnProfile((data.activeSession as any)._id, { tasks: t, notes: notes || undefined });
      if (res.success) {
        setSuccess('Spot returned. Your tasks are pending admin approval.');
        setReturnModal(false);
        await load();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to return profile');
    } finally { setSubmitting(false); }
  };

  const availableProfiles = profiles.filter((p: any) => p.isAvailable && p.inPool);

  const statusSplit = useMemo(() => {
    const acc = { approved: 0, pending: 0, rejected: 0, active: 0 };
    sessions.forEach((s: any) => { if (acc[s.status as keyof typeof acc] !== undefined) acc[s.status as keyof typeof acc]++; });
    return acc;
  }, [sessions]);

  const weekGauge = useMemo(() => {
    const cap  = (data?.maxTasksPerDay ?? 500) * 5; // Mon–Fri
    const done = data?.totalTasks ?? 0;
    return { pct: Math.min(100, Math.round((done / cap) * 100)), done, ref: cap };
  }, [data]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;

  const { week, year } = data?.currentWeek ?? {};

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
              <ClipboardList className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Transcription Analyst</h1>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Week {week} · {data?.minutesPerTask ?? '…'} min/task · {money(data?.ratePerHour ?? 0)}/hr
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/transcription/profiles" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
            <Users className="w-4 h-4" />Profiles
          </Link>
          <Link href="/dashboard/transcription/top-earners" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
            <Award className="w-4 h-4" />Leaderboard
          </Link>
        </div>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Active session banner */}
      {data?.activeSession && (
        <div className="rounded-2xl p-5 border-2" style={{ borderColor: 'var(--accent-color)', backgroundColor: 'color-mix(in srgb, var(--accent-color) 8%, var(--bg-secondary))' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse" style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
                <Play className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  Currently working on{' '}
                  <span style={{ color: 'var(--accent-color)' }}>
                    {typeof data.activeSession.profile === 'object' ? (data.activeSession.profile as any).name : 'a profile'}
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Claimed {new Date(data.activeSession.claimedAt).toLocaleString()}</p>
              </div>
            </div>
            <button onClick={openReturn} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: '#ef4444' }}>
              <StopCircle className="w-4 h-4" />Return Spot
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Your earnings · week {week}</p>
              <p className="text-4xl sm:text-5xl font-black tabular-nums mt-1" style={{ color: 'var(--text-primary)' }}>{money(data?.earnings ?? 0)}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>
                  <ClipboardList className="w-4 h-4" />{data?.totalTasks ?? 0} tasks approved
                </span>
                {(data?.pendingEarnings ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#b45309' }}>
                    <Hourglass className="w-4 h-4" />{money(data?.pendingEarnings ?? 0)} pending
                  </span>
                )}
              </div>
            </div>
            {rank && (
              <Link href="/dashboard/transcription/top-earners" className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 12%, var(--bg-secondary))' }}>
                <Trophy className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p className="text-lg font-black leading-none" style={{ color: 'var(--text-primary)' }}>#{rank.rank}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>of {rank.total}</p>
                </div>
              </Link>
            )}
          </div>

          {(data?.dailyBreakdown?.length ?? 0) > 0 ? (
            <div className="mt-4 -mx-2">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.dailyBreakdown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: 12 }}
                    formatter={(v: any, name: any) => name === 'tasks' ? [`${v} tasks`, 'Tasks'] : [money(v), 'Earnings']} />
                  <Bar dataKey="tasks" fill="var(--accent-color)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed p-6 text-center" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No approved tasks yet this week. Claim a profile to start earning.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-6 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <p className="text-xs font-bold uppercase tracking-widest self-start" style={{ color: 'var(--text-muted)' }}>Week progress</p>
          <Ring pct={weekGauge.pct} />
          <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
            {weekGauge.done} <span style={{ color: 'var(--text-muted)' }}>of ~{weekGauge.ref} tasks</span>
          </p>
          <p className="text-[11px] text-center mt-1" style={{ color: 'var(--text-muted)' }}>Approved tasks vs Mon–Fri at {data?.maxTasksPerDay ?? 500}/day</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile icon={<Wallet className="w-5 h-5" />}      tint="bg-green-100 text-green-600"  value={money(data?.lifetimeEarnings ?? 0)} label="Lifetime earnings"   sub={`${data?.lifetimeTasks ?? 0} tasks all-time`} />
        <Tile icon={<CheckCircle className="w-5 h-5" />} tint="bg-purple-100 text-purple-600" value={String(data?.approvedCount ?? 0)}   label="Approved sessions"  sub={`${data?.pendingCount ?? 0} awaiting review`} />
        <Tile icon={<Hourglass className="w-5 h-5" />}   tint="bg-amber-100 text-amber-600"   value={`${data?.pendingTasks ?? 0}`}        label="Pending tasks"      sub="awaiting admin review" />
        <Tile icon={<Flame className="w-5 h-5" />}       tint="bg-blue-100 text-blue-600"     value={String(sessions.length)}            label="Recent sessions"    sub={`${statusSplit.approved} approved`} />
      </div>

      {/* Recent sessions */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Recent sessions</h2>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <LegendDot color="#10b981" /> {statusSplit.approved}
            <LegendDot color="#f59e0b" /> {statusSplit.pending}
            <LegendDot color="#ef4444" /> {statusSplit.rejected}
          </div>
        </div>
        {sessions.length === 0 ? (
          <EmptyBlock text="Your returned sessions will show here." />
        ) : (
          <div className="divide-y max-h-[220px] overflow-y-auto" style={{ borderColor: 'var(--border-color)' }}>
            {sessions.slice(0, 8).map((s: any) => {
              const profName = typeof s.profile === 'object' ? s.profile?.name : '—';
              const c = s.status === 'approved' ? '#10b981' : s.status === 'pending' ? '#f59e0b' : s.status === 'rejected' ? '#ef4444' : 'var(--accent-color)';
              const t = s.adminTasks ?? s.tasksLogged ?? s.effectiveTasks ?? 0;
              return (
                <div key={s._id} className="px-5 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{profName}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {s.returnedAt ? new Date(s.returnedAt).toLocaleDateString() : s.claimedAt ? new Date(s.claimedAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{t} tasks</p>
                    <p className="text-[11px] capitalize" style={{ color: c }}>{s.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment status */}
      {data?.payment && (
        <div className="rounded-2xl p-4 border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Week {week} payment</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{money(data.payment.totalEarnings)} · {data.payment.totalTasks} tasks</p>
            </div>
          </div>
          <Badge variant={data.payment.status === 'paid' ? 'success' : data.payment.status === 'approved' ? 'primary' : data.payment.status === 'denied' ? 'danger' : 'warning'}>
            {data.payment.status}
          </Badge>
        </div>
      )}

      {/* Available profiles */}
      {!data?.activeSession && availableProfiles.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Open to claim ({availableProfiles.length})</h2>
            </div>
            <Link href="/dashboard/transcription/profiles" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--accent-color)' }}>
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {availableProfiles.slice(0, 5).map((p: any) => (
              <div key={p._id} className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.accountBearerName}</p>
                </div>
                <Link href="/dashboard/transcription/profiles" className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: 'var(--accent-color)' }}>Claim</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => setReturnModal(false)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center"><StopCircle className="w-5 h-5 text-red-500" /></div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Return profile slot</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Enter how many tasks you completed</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tasks completed <span className="text-red-500">*</span></label>
                <input type="number" min={1} step={1} inputMode="numeric" placeholder="e.g. 100" value={tasks} onChange={(e) => setTasks(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Earnings preview: {tasks && !isNaN(parseInt(tasks))
                    ? money(parseInt(tasks) * ((data?.minutesPerTask ?? 0) / 60) * (data?.ratePerHour ?? 0))
                    : '—'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this session…"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              {error && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
              <div className="flex gap-3">
                <button onClick={handleReturn} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: '#ef4444' }}>
                  {submitting ? <Spinner size="sm" /> : <StopCircle className="w-4 h-4" />}Submit & Return
                </button>
                <button onClick={() => setReturnModal(false)} className="px-5 py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared helpers ──────────────────────────────────────────────────────────── */

function SnapshotRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-color)' }}>{icon}</div>
      <div className="min-w-0">
        <p className="text-lg font-black tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {sub && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </div>
  );
}

function PeriodStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ backgroundColor: highlight ? 'color-mix(in srgb, #10b981 10%, var(--bg-secondary))' : 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <p className="text-2xl font-black tabular-nums" style={{ color: highlight ? '#047857' : 'var(--text-primary)' }}>{value}</p>
      <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function Tile({ icon, tint, value, label, sub }: { icon: React.ReactNode; tint: string; value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tint}`}>{icon}</div>
      <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 46, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div className="relative my-3" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--accent-color)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 700ms ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{pct}%</span>
      </div>
    </div>
  );
}

function LegendDot({ color }: { color: string }) {
  return <span className="inline-flex items-center"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /></span>;
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="flex items-center justify-center py-12 px-6 text-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p></div>;
}
