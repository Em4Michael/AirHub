'use client';

// Route: /dashboard/transcription/admin/production/page.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { transcriptionApi } from '@/lib/api/transcription.api';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { WorkerHoursBar, WorkerSlice } from '@/components/analyst/WorkerHoursBar';
import {
  ClipboardList, DollarSign, Briefcase, Users, Activity,
  CalendarDays, CalendarRange, Calendar, Infinity as InfinityIcon, Percent,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Period = 'today' | 'week' | 'month' | 'allTime';
const PERIODS: { key: Period; label: string; icon: React.ReactNode }[] = [
  { key: 'today',   label: 'Daily',    icon: <CalendarDays  className="w-4 h-4" /> },
  { key: 'week',    label: 'Weekly',   icon: <CalendarRange className="w-4 h-4" /> },
  { key: 'month',   label: 'Monthly',  icon: <Calendar      className="w-4 h-4" /> },
  { key: 'allTime', label: 'All time', icon: <InfinityIcon  className="w-4 h-4" /> },
];

const money = (n: number) => formatCurrency(n ?? 0);

export default function TranscriptionProductionPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [period,  setPeriod]  = useState<Period>('week');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transcriptionApi.getProduction();
      if (res.success) setData(res.data);
      else setError('Failed to load production data');
    } catch (e: any) { setError(e?.message || 'Failed'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const accountSlices: WorkerSlice[] = useMemo(
    () => (data?.topAccounts ?? []).map((a: any) => ({ id: a.id, name: a.name, hours: a[period] })).filter((a: any) => a.hours > 0),
    [data, period]
  );
  const workerSlices: WorkerSlice[] = useMemo(
    () => (data?.topWorkers ?? []).map((w: any) => ({ id: w.id, name: w.name, hours: w[period] })).filter((w: any) => w.hours > 0),
    [data, period]
  );

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (error || !data) return <Alert type="error" message={error || 'No data'} onClose={() => setError('')} />;

  const totalFor = (p: Period) => data.totals[p];
  const earnFor  = (p: Period) => data.earnings[p];
  const cutFor   = (p: Period) => data.adminCut[p];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
              <ClipboardList className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Transcription Production</h1>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            All accounts · {data.minutesPerTask} min/task · {money(data.ratePerHour)}/hr · cap {data.maxTasksPerDay} tasks/account/day
          </p>
        </div>
        <Link href="/dashboard/transcription/admin/accounts"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
          <Briefcase className="w-4 h-4" />View accounts
        </Link>
      </div>

      {/* Fleet stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="w-5 h-5" />}     label="Active accounts"    value={String(data.accountCount)}  sub={`${data.activeClaims} claimed now`} tint="bg-blue-100 text-blue-600" />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Tasks this week"    value={`${data.totals.week}`}       sub={`${data.totals.today} today`}       tint="bg-purple-100 text-purple-600" />
        <StatCard icon={<DollarSign className="w-5 h-5" />}    label="Payout this week"   value={money(data.earnings.week)}  sub={`${money(data.earnings.today)} today`} tint="bg-green-100 text-green-600" />
        <StatCard icon={<Activity className="w-5 h-5" />}      label="Approved sessions"  value={String(data.sessionCount)}  sub="all time"                           tint="bg-amber-100 text-amber-600" />
      </div>

      {/* Earnings split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Analyst earnings · this week</p>
          </div>
          <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{money(data.earnings.week)}</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Paid to analysts · {money(data.earnings.allTime)} all-time</p>
        </div>
        <div className="rounded-2xl p-5 border-2" style={{ backgroundColor: 'color-mix(in srgb, #10b981 8%, var(--bg-secondary))', borderColor: 'color-mix(in srgb, #10b981 40%, var(--border-color))' }}>
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4" style={{ color: '#059669' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#059669' }}>Admin cut ({Math.round(data.adminCut.rate * 100)}%) · this week</p>
          </div>
          <p className="text-3xl font-black tabular-nums" style={{ color: '#047857' }}>{money(data.adminCut.week)}</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Company earnings · {money(data.adminCut.allTime)} all-time</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setPeriod(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor: period === key ? 'var(--accent-color)' : 'var(--bg-secondary)', color: period === key ? '#fff' : 'var(--text-secondary)', border: `1px solid ${period === key ? 'transparent' : 'var(--border-color)'}` }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Period summary */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 6%, var(--bg-secondary))', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <div>
            <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {totalFor(period)}<span className="text-lg" style={{ color: 'var(--text-muted)' }}> tasks</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{PERIODS.find((x) => x.key === period)!.label} total</p>
          </div>
          <div>
            <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--accent-color)' }}>{money(earnFor(period))}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>analyst payout</p>
          </div>
          <div>
            <p className="text-3xl font-black tabular-nums" style={{ color: '#047857' }}>{money(cutFor(period))}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>admin cut ({Math.round(data.adminCut.rate * 100)}%)</p>
          </div>
        </div>
      </div>

      {/* 30-day trend */}
      {data.trend.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Fleet tasks — last 30 days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="transProdFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-color)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent-color)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: 12 }}
                formatter={(v: any) => [`${v} tasks`, 'Tasks']} />
              <Area type="monotone" dataKey="tasks" stroke="var(--accent-color)" strokeWidth={2} fill="url(#transProdFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top accounts + workers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Busiest accounts</h2>
          </div>
          {accountSlices.length === 0
            ? <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No tasks in this period.</p>
            : <WorkerHoursBar slices={accountSlices} cap={0} height={24} />}
        </div>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Busiest analysts</h2>
          </div>
          {workerSlices.length === 0
            ? <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No tasks in this period.</p>
            : <WorkerHoursBar slices={workerSlices} cap={0} height={24} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tint }: { icon: React.ReactNode; label: string; value: string; sub?: string; tint: string }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tint}`}>{icon}</div>
      <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}