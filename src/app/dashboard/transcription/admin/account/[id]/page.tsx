'use client';

// Route: /dashboard/transcription/admin/account/[id]/page.tsx
// Per-account task breakdown with worker stats and 30-day chart.

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { transcriptionApi } from '@/lib/api/transcription.api';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  ClipboardList, Users, Briefcase, ChevronLeft, Flame, CalendarDays,
  CalendarRange, Calendar,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const money = (n: number) => formatCurrency(n ?? 0);

export default function TranscriptionAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [benchmark, setBenchmark] = useState<{ minutesPerTask: number; ratePerHour: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, bmRes] = await Promise.allSettled([
        transcriptionApi.getAccountStats(id),
        transcriptionApi.getBenchmarks(),
      ]);
      if (statsRes.status === 'fulfilled' && statsRes.value.success) setData(statsRes.value.data);
      else setError('Failed to load account stats');
      if (bmRes.status === 'fulfilled' && bmRes.value.success) {
        const bms = (bmRes.value.data as any[]) ?? [];
        const active = bms.find((b: any) => b.isActive) ?? bms[0];
        if (active) setBenchmark({ minutesPerTask: active.minutesPerTask, ratePerHour: active.ratePerHour });
      }
    } catch { setError('Failed to load account stats'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (error || !data) return <Alert type="error" message={error || 'No data'} onClose={() => setError('')} />;

  const { profile, today, thisWeek, thisMonth, allTime, workerBreakdown, chartData, sessionCount, maxTasksPerDay, caps } = data;
  const holder = typeof profile.currentHolder === 'object' ? profile.currentHolder as any : null;

  const stats = [
    { label: 'Today',     value: today,     cap: caps?.daily   ?? maxTasksPerDay, icon: <CalendarDays className="w-4 h-4" />  },
    { label: 'This week', value: thisWeek,  cap: caps?.weekly  ?? 0,              icon: <CalendarRange className="w-4 h-4" /> },
    { label: 'This month',value: thisMonth, cap: caps?.monthly ?? 0,              icon: <Calendar className="w-4 h-4" />      },
    { label: 'All time',  value: allTime,   cap: 0,                               icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <Link href="/dashboard/transcription/admin/account"
        className="inline-flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: 'var(--accent-color)' }}>
        <ChevronLeft className="w-4 h-4" />Accounts
      </Link>

      {/* Header */}
      <div className="rounded-2xl border p-5 space-y-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{profile.name}</h1>
              {profile.isTerminated && <Badge variant="danger">Terminated</Badge>}
              {!profile.isActive    && <Badge variant="warning">Inactive</Badge>}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{profile.accountBearerName}</p>
            {profile.email && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{profile.email}</p>}
          </div>
          {holder ? (
            <Badge variant="warning">Held by {holder.name}</Badge>
          ) : (
            <Badge variant="success">Available</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          <span>{sessionCount} approved sessions</span>
          <span>Daily cap: {maxTasksPerDay} tasks</span>
          {profile.workerPool?.length > 0 && <span>{profile.workerPool.length} workers in pool</span>}
          {benchmark && (
            <span className="font-semibold" style={{ color: 'var(--accent-color)' }}>
              {benchmark.minutesPerTask} min/task · {money(benchmark.ratePerHour)}/hr (active rate)
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, cap, icon }) => {
          const pct = cap > 0 ? Math.min(100, Math.round((value / cap) * 100)) : null;
          return (
            <div key={label} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--accent-color)' }}>{icon}</div>
              <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
              {pct !== null && (
                <div className="mt-2">
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? '#ef4444' : 'var(--accent-color)' }} />
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{pct}% of cap</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 30-day chart */}
      {chartData?.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Last 30 days — tasks approved</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: 12 }}
                formatter={(v: any) => [`${v} tasks`, 'Tasks']} />
              <Bar dataKey="tasks" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Worker breakdown */}
      {workerBreakdown?.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Worker breakdown</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {workerBreakdown.map((w: any) => (
              <div key={w.id} className="px-5 py-3 flex items-center justify-between gap-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent-color)' }}>
                    {w.name?.[0]?.toUpperCase()}
                  </div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{w.name}</p>
                </div>
                <div className="flex gap-6 text-right flex-shrink-0">
                  <div>
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{w.today}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>today</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{w.week}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>week</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{w.allTime}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>all-time</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
