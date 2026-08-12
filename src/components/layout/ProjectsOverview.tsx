'use client';

/**
 * ProjectsOverview.tsx
 *
 * Drop-in for admin/superadmin dashboards.
 * Shows a collapsible summary card per project with live earnings.
 *
 * Usage:
 *   import ProjectsOverview from '@/components/layout/ProjectsOverview';
 *   <ProjectsOverview />                          // admin  → "Projects Overview"
 *   <ProjectsOverview title="Super Overview" />   // superadmin
 */

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { transcriptionApi } from '@/lib/api/transcription.api';
import { analystApi } from '@/lib/api/analyst.api';
import { adminApi } from '@/lib/api/admin.api';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import {
  BarChart2, ClipboardList, Users, ChevronDown, ChevronUp,
  DollarSign, Briefcase, Activity, ExternalLink, Percent, Wallet,
} from 'lucide-react';

const money = (n: number) => formatCurrency(n ?? 0);
const DEFAULT_CUT = 0.25;

// ── Shared sub-components ────────────────────────────────────────────────────

/** Bold actual + muted strikethrough gross (only shown if meaningfully different) */
function DualValue({ actual, gross, accent }: { actual: number; gross: number; accent?: boolean }) {
  const diff = Math.abs(gross - actual) > 1;
  return (
    <div>
      <p className="font-black tabular-nums text-xl leading-tight"
        style={{ color: accent ? 'var(--accent-color)' : 'var(--text-primary)' }}>
        {money(actual)}
      </p>
      {diff && (
        <p className="text-xs tabular-nums line-through leading-tight"
          style={{ color: 'var(--text-muted)' }}
          title="Gross before terminated-account deduction">
          {money(gross)}
        </p>
      )}
    </div>
  );
}

function StatBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProjectsOverview({ title = 'Projects Overview' }: { title?: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    main: true, analyst: true, transcription: true,
  });
  const toggle = (key: string) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  // ── Multimango (main) ─────────────────────────────────────────────────────
  const [mainData,  setMainData]  = useState<any>(null);
  const [mainLoad,  setMainLoad]  = useState(true);
  const [mainErr,   setMainErr]   = useState('');

  // ── Analyst ───────────────────────────────────────────────────────────────
  const [analystData, setAnalystData] = useState<any>(null);
  const [analystLoad, setAnalystLoad] = useState(true);
  const [analystErr,  setAnalystErr]  = useState('');

  // ── Transcription ─────────────────────────────────────────────────────────
  const [transData,  setTransData]  = useState<any>(null);
  const [transLoad,  setTransLoad]  = useState(true);
  const [transErr,   setTransErr]   = useState('');

  const loadAll = useCallback(async () => {
    // ── Multimango ──
    try {
      setMainLoad(true);
      const [statsRes, paymentsRes, earningsRes] = await Promise.allSettled([
        adminApi.getWorkerStats(),
        adminApi.getWeeklyPayments(undefined, 1, 500),
        apiClient.get('/admin/admin-earnings').catch(() => ({ data: null })),
      ]);

      const stats    = statsRes.status === 'fulfilled' && statsRes.value.success ? statsRes.value.data : null;
      const payments = paymentsRes.status === 'fulfilled' && paymentsRes.value.success ? (paymentsRes.value.data ?? []) as any[] : [];

      // Build fraction map (terminated account deductions) same as AdminEarningsSection
      const fMap = new Map<string, { terminatedFraction: number; activeRate: number }>();
      const er = earningsRes.status === 'fulfilled' ? (earningsRes.value as any)?.data : null;
      if (er?.success && er?.data?.workerWeekFractions) {
        (er.data.workerWeekFractions as any[]).forEach((e: any) => {
          fMap.set(`${e.userId}_${e.weekNumber}_${e.year}`, {
            terminatedFraction: e.terminatedFraction,
            activeRate: e.activeRate,
          });
        });
      }

      // Current week payments (most recent weekStart)
      const sorted = [...payments].sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
      const latestWeekStart = sorted[0]?.weekStart;
      const thisWeekPayments = latestWeekStart ? sorted.filter((p) => p.weekStart === latestWeekStart) : [];

      const calcActual = (pmts: any[]) => {
        let worker = 0, admin = 0;
        pmts.forEach((p) => {
          const earn = p.totalEarnings ?? 0;
          const userId = typeof p.user === 'string' ? p.user : (p.user as any)?._id ?? '';
          const frac = fMap.get(`${userId}_${p.weekNumber}_${p.year}`);
          const termFrac = frac?.terminatedFraction ?? 0;
          const rate = frac?.activeRate ?? DEFAULT_CUT;
          const activeEarn = earn * (1 - termFrac);
          worker += activeEarn;
          admin  += activeEarn * rate;
        });
        return { worker, admin };
      };

      const calcGross = (pmts: any[]) => {
        let worker = 0, admin = 0;
        pmts.forEach((p) => { const e = p.totalEarnings ?? 0; worker += e; admin += e * DEFAULT_CUT; });
        return { worker, admin };
      };

      const thisActual   = calcActual(thisWeekPayments);
      const thisGross    = calcGross(thisWeekPayments);
      const allActual    = calcActual(payments);
      const allGross     = calcGross(payments);

      const lifetimeWorker = stats?.lifetimeEarnings ?? allActual.worker;
      const unrecorded     = Math.max(0, lifetimeWorker - allActual.worker);
      const lifetimeAdmin  = allActual.admin + unrecorded * DEFAULT_CUT;
      const grossLifetime  = allGross.admin + unrecorded * DEFAULT_CUT;

      setMainData({
        stats,
        thisWeek: { actual: thisActual, gross: thisGross },
        lifetime: { actual: lifetimeAdmin, gross: grossLifetime },
        workers:  stats?.totalUsers ?? 0,
        profiles: stats?.totalProfiles ?? 0,
        pending:  stats?.pendingEntries ?? 0,
      });
    } catch { setMainErr('Could not load Multimango earnings'); }
    finally { setMainLoad(false); }

    // ── Analyst ──
    try {
      setAnalystLoad(true);
      const res = await analystApi.getProduction();
      if (res.success) setAnalystData(res.data);
      else setAnalystErr('Could not load analyst earnings');
    } catch { setAnalystErr('Could not load analyst earnings'); }
    finally { setAnalystLoad(false); }

    // ── Transcription ──
    try {
      setTransLoad(true);
      const [prodRes, bmRes] = await Promise.allSettled([
        transcriptionApi.getProduction(),
        transcriptionApi.getBenchmarks(),
      ]);
      if (prodRes.status === 'fulfilled' && prodRes.value.success) {
        const p = prodRes.value.data as any;
        if (bmRes.status === 'fulfilled' && bmRes.value.success) {
          const bms = (bmRes.value.data as any[]) ?? [];
          const active = bms.find((b: any) => b.isActive) ?? bms[0];
          if (active && p) { p.minutesPerTask = active.minutesPerTask; p.ratePerHour = active.ratePerHour; }
        }
        setTransData(p);
      } else setTransErr('Could not load transcription earnings');
    } catch { setTransErr('Could not load transcription earnings'); }
    finally { setTransLoad(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Project card definitions ───────────────────────────────────────────────

  const projects = [
    {
      key:     'main',
      label:   'Multimango',
      desc:    'Core platform — user entries, profiles and weekly payments',
      icon:    <Users className="w-5 h-5" />,
      color:   '#6366f1',
      loading: mainLoad,
      error:   mainErr,
      headline: mainData ? money(mainData.thisWeek.actual.admin) : null,
      headlineSub: 'admin cut this week',
      stats: mainData ? [
        {
          label: 'This week — workers earned',
          node: <DualValue actual={mainData.thisWeek.actual.worker} gross={mainData.thisWeek.gross.worker} />,
        },
        {
          label: 'This week — admin cut',
          node: <DualValue actual={mainData.thisWeek.actual.admin} gross={mainData.thisWeek.gross.admin} accent />,
        },
        {
          label: 'Lifetime admin earnings',
          node: <DualValue actual={mainData.lifetime.actual} gross={mainData.lifetime.gross} accent />,
        },
        {
          label: 'Platform',
          node: (
            <div className="space-y-0.5">
              <p className="text-base font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{mainData.workers} users</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{mainData.profiles} profiles · {mainData.pending} pending entries</p>
            </div>
          ),
        },
      ] : [],
      note: (
        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Percent className="w-3 h-3 flex-shrink-0" />
          Bold = actual (terminated excluded) · <span className="line-through">Strikethrough</span> = gross ·{` `}
          <Link href="/dashboard/admin/accounts" className="underline font-semibold" style={{ color: '#6366f1' }}>Configure rates →</Link>
        </p>
      ),
      links: [
        { label: 'Admin dashboard', href: '/dashboard/admin' },
        { label: 'Top Earners',      href: '/dashboard/admin/topEarners' },
        { label: 'Entries',          href: '/dashboard/admin/entries' },
        { label: 'Users',            href: '/dashboard/admin/users' },
        { label: 'Accounts',         href: '/dashboard/admin/accounts' },
      ],
    },
    {
      key:     'analyst',
      label:   'Online Data Analyst',
      desc:    'Hourly sessions, monthly payments, account pool',
      icon:    <BarChart2 className="w-5 h-5" />,
      color:   '#8b5cf6',
      loading: analystLoad,
      error:   analystErr,
      headline: analystData ? money(analystData.adminCut?.month ?? 0) : null,
      headlineSub: 'admin cut this month',
      stats: analystData ? [
        {
          label: 'This month — workers earned',
          node: <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{money(analystData.earnings?.month ?? 0)}</p>,
        },
        {
          label: 'This month — admin cut',
          node: <p className="text-xl font-black tabular-nums" style={{ color: 'var(--accent-color)' }}>{money(analystData.adminCut?.month ?? 0)}</p>,
        },
        {
          label: 'Lifetime admin earnings',
          node: <p className="text-xl font-black tabular-nums" style={{ color: 'var(--accent-color)' }}>{money(analystData.adminCut?.allTime ?? 0)}</p>,
        },
        {
          label: 'Accounts',
          node: (
            <div className="space-y-0.5">
              <p className="text-base font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{analystData.accountCount ?? 0} accounts</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{analystData.activeClaims ?? 0} claimed · {analystData.sessionCount ?? 0} sessions total</p>
            </div>
          ),
        },
      ] : [],
      note: null,
      links: [
        { label: 'Analyst dashboard', href: '/dashboard/analyst' },
        { label: 'Top Earners',        href: '/dashboard/analyst/top-earners' },
        { label: 'Sessions',           href: '/dashboard/analyst/admin' },
        { label: 'Production',         href: '/dashboard/analyst/admin/production' },
        { label: 'Accounts',           href: '/dashboard/analyst/admin/accounts' },
      ],
    },
    {
      key:     'transcription',
      label:   'Transcription Analyst',
      desc:    'Task sessions, weekly payments, account pool',
      icon:    <ClipboardList className="w-5 h-5" />,
      color:   '#059669',
      loading: transLoad,
      error:   transErr,
      headline: transData ? money(transData.adminCut?.week ?? 0) : null,
      headlineSub: 'admin cut this week',
      stats: transData ? [
        {
          label: 'This week — workers earned',
          node: <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{money(transData.earnings?.week ?? 0)}</p>,
        },
        {
          label: 'This week — admin cut',
          node: <p className="text-xl font-black tabular-nums" style={{ color: 'var(--accent-color)' }}>{money(transData.adminCut?.week ?? 0)}</p>,
        },
        {
          label: 'Lifetime admin earnings',
          node: <p className="text-xl font-black tabular-nums" style={{ color: 'var(--accent-color)' }}>{money(transData.adminCut?.allTime ?? 0)}</p>,
        },
        {
          label: 'Accounts',
          node: (
            <div className="space-y-0.5">
              <p className="text-base font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{transData.accountCount ?? 0} accounts</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{transData.activeClaims ?? 0} claimed · {transData.sessionCount ?? 0} sessions total</p>
            </div>
          ),
        },
      ] : [],
      note: null,
      links: [
        { label: 'Trans. dashboard', href: '/dashboard/transcription/dashboard' },
        { label: 'Top Earners',       href: '/dashboard/transcription/top-earners' },
        { label: 'Sessions',          href: '/dashboard/transcription/admin' },
        { label: 'Production',        href: '/dashboard/transcription/admin/production' },
        { label: 'Accounts',          href: '/dashboard/transcription/admin/account' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
        <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
          {projects.length} projects
        </span>
      </div>

      {projects.map((proj) => (
        <div key={proj.key} className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>

          {/* Always-visible header */}
          <button onClick={() => toggle(proj.key)}
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                style={{ backgroundColor: proj.color }}>
                {proj.icon}
              </div>
              <div className="text-left min-w-0">
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{proj.label}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{proj.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              {/* Headline stat */}
              {!proj.loading && !proj.error && proj.headline && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-black tabular-nums" style={{ color: proj.color }}>
                    {proj.headline}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{proj.headlineSub}</p>
                </div>
              )}
              {expanded[proj.key]
                ? <ChevronUp   className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            </div>
          </button>

          {/* Expanded body */}
          {expanded[proj.key] && (
            <div className="border-t" style={{ borderColor: 'var(--border-color)' }}>
              {proj.loading ? (
                <div className="flex justify-center py-8"><Spinner size="sm" /></div>
              ) : proj.error ? (
                <p className="px-5 py-4 text-sm text-red-500">{proj.error}</p>
              ) : (
                <>
                  {/* 4-stat grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-px"
                    style={{ backgroundColor: 'var(--border-color)' }}>
                    {proj.stats.map(({ label, node }) => (
                      <StatBox key={label} label={label}>{node}</StatBox>
                    ))}
                  </div>

                  {/* Optional note (Multimango only — explains dual figures) */}
                  {proj.note && (
                    <div className="px-5 py-3 border-t"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, ' + proj.color + ' 4%, var(--bg-secondary))' }}>
                      {proj.note}
                    </div>
                  )}

                  {/* Quick links */}
                  <div className="px-5 py-3 flex flex-wrap gap-2 border-t"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    {proj.links.map(({ label, href }) => (
                      <Link key={href} href={href}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-opacity hover:opacity-75"
                        style={{
                          borderColor:     proj.color + '44',
                          color:           proj.color,
                          backgroundColor: proj.color + '10',
                        }}>
                        <ExternalLink className="w-3 h-3" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
