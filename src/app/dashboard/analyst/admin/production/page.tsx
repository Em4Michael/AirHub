'use client';

// Route: /dashboard/analyst/admin/production/page.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { analystApi } from '@/lib/api/analyst.api';
import { AnalystProduction } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { WorkerHoursBar, colourForIndex, WorkerSlice } from '@/components/analyst/WorkerHoursBar';
import {
  BarChart2, Clock, DollarSign, Briefcase, Users, Activity,
  CalendarDays, CalendarRange, Calendar, Infinity as InfinityIcon, Percent,
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

export default function AnalystProductionPage() {
  const [data,    setData]    = useState<AnalystProduction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [period,  setPeriod]  = useState<Period>('today');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analystApi.getProduction();
      if (res.success) setData(res.data!);
      else setError('Failed to load production data');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const accountSlices: WorkerSlice[] = useMemo(
    () => (data?.topAccounts ?? [])
      .map((a) => ({ id: a.id, name: a.name, hours: a[period] }))
      .filter((a) => a.hours > 0),
    [data, period]
  );

  const workerSlices: WorkerSlice[] = useMemo(
    () => (data?.topWorkers ?? [])
      .map((w) => ({ id: w.id, name: w.name, hours: w[period] }))
      .filter((w) => w.hours > 0),
    [data, period]
  );

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  if (error || !data) {
    return <Alert type="error" message={error || 'No data'} onClose={() => setError('')} />;
  }

  const totalFor = (p: Period) => data.totals[p];
  const capFor   = (p: Period) => (p === 'allTime' ? 0 : data.caps[p === 'today' ? 'daily' : p === 'week' ? 'weekly' : 'monthly']);
  const earnFor  = (p: Period) => data.earnings[p];
  const cutFor   = (p: Period) => data.adminCut[p];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
              <BarChart2 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Production</h1>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            All accounts · {formatCurrency(data.hourlyRate)}/hr · cap {data.maxHoursPerDay}h per account per day
          </p>
        </div>
        <Link href="/dashboard/analyst/admin/accounts"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
          <Briefcase className="w-4 h-4" />View accounts
        </Link>
      </div>

      {/* Fleet stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="w-5 h-5" />} label="Active accounts" value={String(data.accountCount)}
          sub={`${data.activeClaims} claimed now`} tint="bg-blue-100 text-blue-600" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Hours this month" value={`${data.totals.month}h`}
          sub={`${data.totals.today}h today`} tint="bg-purple-100 text-purple-600" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Payout this month" value={formatCurrency(data.earnings.month)}
          sub={`${formatCurrency(data.earnings.today)} today`} tint="bg-green-100 text-green-600" />
        <StatCard icon={<Activity className="w-5 h-5" />} label="Approved sessions" value={String(data.sessionCount)}
          sub="all time" tint="bg-amber-100 text-amber-600" />
      </div>

      {/* Earnings split — worker payout vs company's 25% cut (this month) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Analyst earnings · this month
            </p>
          </div>
          <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(data.earnings.month)}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Paid to analysts · {formatCurrency(data.earnings.allTime)} all-time
          </p>
        </div>

        <div className="rounded-2xl p-5 border-2" style={{
          backgroundColor: 'color-mix(in srgb, #10b981 8%, var(--bg-secondary))',
          borderColor: 'color-mix(in srgb, #10b981 40%, var(--border-color))',
        }}>
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4" style={{ color: '#059669' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#059669' }}>
              Admin cut ({Math.round(data.adminCut.rate * 100)}%) · this month
            </p>
          </div>
          <p className="text-3xl font-black tabular-nums" style={{ color: '#047857' }}>
            {formatCurrency(data.adminCut.month)}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Company earnings on top · {formatCurrency(data.adminCut.allTime)} all-time
          </p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(({ key, label, icon }) => {
          const active = period === key;
          return (
            <button key={key} onClick={() => setPeriod(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: active ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color:           active ? '#fff' : 'var(--text-secondary)',
                border:          `1px solid ${active ? 'transparent' : 'var(--border-color)'}`,
              }}>
              {icon}{label}
            </button>
          );
        })}
      </div>

      {/* Period summary band */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 6%, var(--bg-secondary))', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <div>
            <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {totalFor(period)}<span className="text-lg" style={{ color: 'var(--text-muted)' }}>h</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {PERIODS.find((x) => x.key === period)!.label} total{capFor(period) > 0 ? ` of ${capFor(period)}h capacity` : ''}
            </p>
          </div>
          <div>
            <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--accent-color)' }}>
              {formatCurrency(earnFor(period))}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>analyst payout</p>
          </div>
          <div>
            <p className="text-3xl font-black tabular-nums" style={{ color: '#047857' }}>
              {formatCurrency(cutFor(period))}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              admin cut ({Math.round(data.adminCut.rate * 100)}%)
            </p>
          </div>
        </div>
      </div>

      {/* 30-day trend */}
      {data.trend.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Fleet hours — last 30 days
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-color)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent-color)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: 12 }}
                formatter={(v: any) => [`${v}h`, 'Hours']} />
              <Area type="monotone" dataKey="hours" stroke="var(--accent-color)" strokeWidth={2} fill="url(#prodFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top accounts + top workers — multi-colour bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Busiest accounts</h2>
          </div>
          {accountSlices.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No hours in this period.</p>
          ) : (
            <WorkerHoursBar slices={accountSlices} cap={0} height={24} />
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Busiest analysts</h2>
          </div>
          {workerSlices.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No hours in this period.</p>
          ) : (
            <WorkerHoursBar slices={workerSlices} cap={0} height={24} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tint }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; tint: string;
}) {
  return (
    <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tint}`}>{icon}</div>
      <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}