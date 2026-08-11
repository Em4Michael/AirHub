'use client';

// Route: /dashboard/transcription/admin/page.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { transcriptionApi } from '@/lib/api/transcription.api';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle, XCircle, Clock, DollarSign, Users, Settings,
  X, Save, Plus, Search, SlidersHorizontal, ShieldCheck, ClipboardList,
} from 'lucide-react';

const money = (n: number) => formatCurrency(n ?? 0);

const statusVariant = (s: string): any =>
  ({ approved: 'success', pending: 'warning', rejected: 'danger', active: 'primary', paid: 'success', denied: 'danger' })[s] ?? 'warning';

type Tab = 'sessions' | 'payments' | 'users' | 'benchmarks' | 'settings';

/** Get the Monday of the ISO week containing `date`. */
function getMondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (dow - 1));
  return d;
}

/** Format a Date as YYYY-MM-DD for <input type="date"> */
function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AdminTranscriptionPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === UserRole.SUPERADMIN;

  const [tab, setTab] = useState<Tab>('sessions');
  const [sessions,    setSessions]    = useState<any[]>([]);
  const [sessFilter,  setSessFilter]  = useState('pending');
  const [payments,    setPayments]    = useState<any[]>([]);

  // Users
  const [analystUsers,         setAnalystUsers]         = useState<any[]>([]);
  const [userSearch,           setUserSearch]           = useState('');
  const [userSearchDebounced,  setUserSearchDebounced]  = useState('');
  const [badgeFilter,          setBadgeFilter]          = useState<'' | 'badged' | 'nobadge'>('');

  // Benchmarks — defaultMonday computed once at mount via useRef so re-renders don't reset the form
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const defaultMondayRef = React.useRef(toDateInput(getMondayOf(new Date())));
  const defaultMonday = defaultMondayRef.current;
  const [bmForm, setBmForm] = useState({ minutesPerTask: '10', ratePerHour: '2000', weekStartDate: defaultMonday, notes: '' });

  // Settings
  const [settings,  setSettings]  = useState<any>(null);
  const [maxTasks,  setMaxTasks]  = useState('');

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [actionModal, setActionModal] = useState<{ session: any; type: 'approve' | 'reject' } | null>(null);
  const [actionForm, setActionForm] = useState({ adminTasks: '', adminNotes: '', reason: '' });
  const [payModal, setPayModal] = useState<{ userId: string; name: string; week: number; year: number } | null>(null);

  const [filterWeek, setFilterWeek] = useState(0); // 0 = current
  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear());

  // Derive current ISO week once — computed once, not on every render
  const currentWeekNo = React.useMemo(() => {
    const _now = new Date();
    const d = new Date(Date.UTC(_now.getUTCFullYear(), _now.getUTCMonth(), _now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - y.getTime()) / 86400000 + 1) / 7);
  }, []);
  const activeWeek = filterWeek || currentWeekNo;

  // Debounce user search
  useEffect(() => {
    const t = setTimeout(() => setUserSearchDebounced(userSearch), 350);
    return () => clearTimeout(t);
  }, [userSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    const [sessR, payR, userR, bmR, setR] = await Promise.allSettled([
      transcriptionApi.adminGetSessions({ status: sessFilter, week: activeWeek, year: filterYear }),
      transcriptionApi.adminGetPayments({ week: activeWeek, year: filterYear }),
      transcriptionApi.getTranscriptionUsers({
        search: userSearchDebounced || undefined,
        badge:  badgeFilter || undefined,
        limit:  200,
      }),
      transcriptionApi.getBenchmarks(),
      transcriptionApi.getSettings(),
    ]);

    const failures: string[] = [];
    if (sessR.status === 'fulfilled' && sessR.value.success) setSessions((sessR.value.data as any[]) ?? []);
    else failures.push('sessions');
    if (payR.status === 'fulfilled' && payR.value.success) setPayments((payR.value.data as any[]) ?? []);
    else failures.push('payments');
    if (userR.status === 'fulfilled' && userR.value.success) setAnalystUsers((userR.value.data as any[]) ?? []);
    else failures.push('users');
    if (bmR.status === 'fulfilled' && bmR.value.success) {
      const bms = (bmR.value.data as any[]) ?? [];
      setBenchmarks(bms);
      // Pre-fill the form with the active benchmark so preview shows current rates
      const activeBm = bms.find((b: any) => b.isActive) ?? bms[0];
      if (activeBm) {
        setBmForm((f) => ({
          ...f,
          minutesPerTask: String(activeBm.minutesPerTask),
          ratePerHour:    String(activeBm.ratePerHour),
        }));
      }
    } else failures.push('benchmarks');
    if (setR.status === 'fulfilled' && setR.value.success) {
      const s = setR.value.data as any;
      setSettings(s);
      setMaxTasks(String(s?.maxTasksPerDay));
    } else failures.push('settings');

    if (failures.length) setError(`Some data failed to load: ${failures.join(', ')}. Other tabs still work.`);
    else setError('');
    setLoading(false);
  }, [sessFilter, activeWeek, filterYear, userSearchDebounced, badgeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!actionModal) return;
    setSubmitting(true); setError('');
    try {
      const data: any = {};
      if (actionForm.adminTasks)  data.adminTasks  = parseInt(actionForm.adminTasks, 10);
      if (actionForm.adminNotes) data.adminNotes = actionForm.adminNotes;
      const res = await transcriptionApi.approveSession(actionModal.session._id, data);
      if (res.success) { setSuccess('Session approved'); setActionModal(null); await load(); setTimeout(() => setSuccess(''), 3000); }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to approve'); }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!actionModal) return;
    setSubmitting(true); setError('');
    try {
      const res = await transcriptionApi.rejectSession(actionModal.session._id, { reason: actionForm.reason, adminNotes: actionForm.adminNotes });
      if (res.success) { setSuccess('Session rejected'); setActionModal(null); await load(); setTimeout(() => setSuccess(''), 3000); }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to reject'); }
    finally { setSubmitting(false); }
  };

  const handleMarkPaid = async () => {
    if (!payModal) return;
    setSubmitting(true);
    try {
      const res = await transcriptionApi.markPaymentPaid({ userId: payModal.userId, week: payModal.week, year: payModal.year });
      if (res.success) { setSuccess('Payment marked as paid'); setPayModal(null); await load(); setTimeout(() => setSuccess(''), 3000); }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleGrantBadge  = async (userId: string) => {
    try { await transcriptionApi.grantBadge(userId);  setSuccess('Badge granted'); await load(); setTimeout(() => setSuccess(''), 3000); }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed'); }
  };
  const handleRevokeBadge = async (userId: string) => {
    try { await transcriptionApi.revokeBadge(userId); setSuccess('Badge revoked'); await load(); setTimeout(() => setSuccess(''), 3000); }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed'); }
  };

  const handleCreateBenchmark = async () => {
    if (!parseFloat(bmForm.minutesPerTask) || !parseFloat(bmForm.ratePerHour) || !bmForm.weekStartDate) {
      setError('Minutes per task, rate per hour and week start date are required'); return;
    }
    // Validate it's a Monday
    const d = new Date(bmForm.weekStartDate);
    if (d.getUTCDay() !== 1) { setError('Week start date must be a Monday'); return; }
    setSubmitting(true);
    try {
      const res = await transcriptionApi.createBenchmark({
        minutesPerTask: parseFloat(bmForm.minutesPerTask),
        ratePerHour:    parseFloat(bmForm.ratePerHour),
        weekStartDate:  bmForm.weekStartDate,
        notes:          bmForm.notes,
      });
      if (res.success) {
        setSuccess('Benchmark created and set as active');
        setBmForm({ minutesPerTask: '10', ratePerHour: '2000', weekStartDate: defaultMonday, notes: '' });
        await load(); setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleSaveSettings = async () => {
    const v = parseInt(maxTasks, 10);
    if (isNaN(v) || v < 1) { setError('Daily task cap must be at least 1'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await transcriptionApi.updateSettings({ maxTasksPerDay: v });
      if (res.success) { setSettings(res.data as any); setSuccess('Daily task cap updated'); setTimeout(() => setSuccess(''), 3000); }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to update setting'); }
    finally { setSubmitting(false); }
  };

  const fieldStyle = { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };
  const fieldClass = 'w-full px-3 py-2.5 rounded-xl border text-sm';

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'sessions',   label: 'Sessions',   icon: <Clock className="w-4 h-4" /> },
    { key: 'payments',   label: 'Payments',   icon: <DollarSign className="w-4 h-4" /> },
    { key: 'users',      label: 'Users',      icon: <Users className="w-4 h-4" /> },
    { key: 'benchmarks', label: 'Benchmarks', icon: <Settings className="w-4 h-4" /> },
    { key: 'settings',   label: 'Settings',   icon: <SlidersHorizontal className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Transcription Administration</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage sessions, payments, badges, rates and the daily task cap</p>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 min-w-[92px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor: tab === t.key ? 'var(--accent-color)' : 'transparent', color: tab === t.key ? '#fff' : 'var(--text-secondary)' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Week filter for sessions + payments */}
      {(tab === 'sessions' || tab === 'payments') && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 items-center">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Week #</label>
            <input type="number" min={1} max={53} value={filterWeek || currentWeekNo}
              onChange={(e) => setFilterWeek(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-2 rounded-xl border text-sm" style={fieldStyle} />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Year</label>
            <input type="number" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="w-24 px-3 py-2 rounded-xl border text-sm" style={fieldStyle} />
          </div>
          {tab === 'sessions' && (
            <div className="flex gap-2 items-center">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Status</label>
              <select value={sessFilter} onChange={(e) => setSessFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border text-sm" style={fieldStyle}>
                {['pending', 'approved', 'rejected', 'active', ''].map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* ── Sessions ──────────────────────────────────────────────────── */}
          {tab === 'sessions' && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
              <div className="px-5 py-4" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Sessions — Week {activeWeek} · {filterYear}</h2>
              </div>
              {sessions.length === 0 ? (
                <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No sessions found</p>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {sessions.map((s: any) => {
                    const worker  = typeof s.worker  === 'object' ? s.worker  : null;
                    const profile = typeof s.profile === 'object' ? s.profile : null;
                    return (
                      <div key={s._id} className="px-5 py-4 flex items-start justify-between gap-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{(worker as any)?.name ?? 'Unknown'}</p>
                            <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Profile: {(profile as any)?.name ?? '—'} · {s.tasksLogged} tasks logged
                            {s.adminTasks != null && ` (admin: ${s.adminTasks})`}
                          </p>
                          {s.notes && <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>"{s.notes}"</p>}
                        </div>
                        {s.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => { setActionModal({ session: s, type: 'approve' }); setActionForm({ adminTasks: '', adminNotes: '', reason: '' }); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#10b981' }}>
                              <CheckCircle className="w-3.5 h-3.5" />Approve
                            </button>
                            <button onClick={() => { setActionModal({ session: s, type: 'reject' }); setActionForm({ adminTasks: '', adminNotes: '', reason: '' }); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#ef4444' }}>
                              <XCircle className="w-3.5 h-3.5" />Reject
                            </button>
                          </div>
                        )}
                        {s.status === 'approved' && (
                          <button onClick={() => { setActionModal({ session: s, type: 'reject' }); setActionForm({ adminTasks: '', adminNotes: '', reason: '' }); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 flex-shrink-0">
                            <XCircle className="w-3.5 h-3.5" />Reject
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Payments ──────────────────────────────────────────────────── */}
          {tab === 'payments' && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
              <div className="px-5 py-4" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Payments — Week {activeWeek} · {filterYear}</h2>
              </div>
              {payments.length === 0 ? (
                <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No payment records found</p>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {payments.map((p: any) => {
                    const u = typeof p.user === 'object' ? p.user : null;
                    return (
                      <div key={p._id} className="px-5 py-4 flex items-center justify-between gap-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{(u as any)?.name ?? 'Unknown'}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.totalTasks} tasks · {money(p.totalEarnings)} · {p.sessionCount} sessions</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                          {p.status !== 'paid' && (
                            <button onClick={() => setPayModal({ userId: typeof p.user === 'string' ? p.user : (p.user as any)._id, name: (u as any)?.name, week: p.week, year: p.year })}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: 'var(--accent-color)' }}>Mark Paid</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Users ─────────────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name or email…" className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm" style={fieldStyle} />
                </div>
                <div className="flex gap-2">
                  {([['', 'All'], ['badged', 'Badged'], ['nobadge', 'No badge']] as ['', string][]).map(([val, label]) => (
                    <button key={val} onClick={() => setBadgeFilter(val as any)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ backgroundColor: badgeFilter === val ? 'var(--accent-color)' : 'var(--bg-secondary)', color: badgeFilter === val ? '#fff' : 'var(--text-secondary)', border: `1px solid ${badgeFilter === val ? 'transparent' : 'var(--border-color)'}` }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="px-5 py-4" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Transcription Users ({analystUsers.length})</h2>
                </div>
                {analystUsers.length === 0 ? (
                  <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No users match your filters</p>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {analystUsers.map((u: any) => (
                      <div key={u._id} className="px-5 py-4 flex items-center justify-between gap-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--accent-color)' }}>
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={u.transcriptionBadge ? 'success' : 'warning'}>{u.transcriptionBadge ? 'Badged' : 'No Badge'}</Badge>
                          {u.transcriptionBadge ? (
                            <button onClick={() => handleRevokeBadge(u._id)} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200">Revoke Badge</button>
                          ) : (
                            <button onClick={() => handleGrantBadge(u._id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#10b981' }}>Grant Badge</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Benchmarks ────────────────────────────────────────────────── */}
          {tab === 'benchmarks' && (
            <div className="space-y-4">
              <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Set New Weekly Rate</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Pay formula: tasks × (minutes/task ÷ 60) × rate/hr.
                  Creating a new benchmark deactivates the previous one.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Minutes per Task *</label>
                    <input type="number" min={1} value={bmForm.minutesPerTask} onChange={(e) => setBmForm((f) => ({ ...f, minutesPerTask: e.target.value }))}
                      placeholder="e.g. 10" className={fieldClass} style={fieldStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Rate per Hour (₦) *</label>
                    <input type="number" min={1} value={bmForm.ratePerHour} onChange={(e) => setBmForm((f) => ({ ...f, ratePerHour: e.target.value }))}
                      placeholder="e.g. 2000" className={fieldClass} style={fieldStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Week Start (Monday) *</label>
                    <input type="date" value={bmForm.weekStartDate} onChange={(e) => setBmForm((f) => ({ ...f, weekStartDate: e.target.value }))}
                      className={fieldClass} style={fieldStyle} />
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Must be a Monday</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                  <input value={bmForm.notes} onChange={(e) => setBmForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes…" className={fieldClass} style={fieldStyle} />
                </div>
                {/* Live pay preview */}
                {parseFloat(bmForm.minutesPerTask) > 0 && parseFloat(bmForm.ratePerHour) > 0 && (
                  <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 8%, var(--bg-secondary))', color: 'var(--text-secondary)' }}>
                    Preview: 100 tasks × {bmForm.minutesPerTask} min ÷ 60 × {money(parseFloat(bmForm.ratePerHour))}/hr
                    = <strong style={{ color: 'var(--accent-color)' }}>{money(100 * (parseFloat(bmForm.minutesPerTask) / 60) * parseFloat(bmForm.ratePerHour))}</strong>
                  </div>
                )}
                <button onClick={handleCreateBenchmark} disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--accent-color)' }}>
                  {submitting ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}Create Benchmark
                </button>
              </div>

              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="px-5 py-4" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Benchmark History</h2>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {benchmarks.map((bm: any) => (
                    <div key={bm._id} className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {bm.minutesPerTask} min/task · {money(bm.ratePerHour)}/hr
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(bm.weekStart).toLocaleDateString()} – {new Date(bm.weekEnd).toLocaleDateString()}
                          {bm.notes && ` · ${bm.notes}`}
                        </p>
                      </div>
                      <Badge variant={bm.isActive ? 'success' : 'warning'}>{bm.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  ))}
                  {benchmarks.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No benchmarks yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Settings ──────────────────────────────────────────────────── */}
          {tab === 'settings' && (
            <div className="rounded-2xl border p-6 max-w-xl" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Daily task cap</h2>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Maximum tasks a single account may accumulate per calendar day, across all workers.
                {!isSuperadmin && ' Only a superadmin can change this.'}
              </p>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Max tasks per account per day</label>
              <div className="flex items-center gap-3">
                <input type="number" min={1} step={1} value={maxTasks}
                  onChange={(e) => setMaxTasks(e.target.value)} disabled={!isSuperadmin}
                  className="w-32 px-3 py-2.5 rounded-xl border text-sm font-semibold disabled:opacity-60" style={fieldStyle} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>tasks</span>
                {isSuperadmin && (
                  <button onClick={handleSaveSettings} disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--accent-color)' }}>
                    {submitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}Save
                  </button>
                )}
              </div>
              {settings && (
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  Current cap: <strong style={{ color: 'var(--text-primary)' }}>{settings.maxTasksPerDay} tasks</strong> per account per day
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Approve / Reject Modal ───────────────────────────────────────── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => setActionModal(null)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {actionModal.type === 'approve' ? 'Approve Session' : 'Reject Session'}
              </h2>
              <button onClick={() => setActionModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {typeof actionModal.session.worker === 'object' ? (actionModal.session.worker as any).name : 'Worker'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {actionModal.session.tasksLogged} tasks logged{actionModal.session.notes && ` · "${actionModal.session.notes}"`}
                </p>
              </div>

              {actionModal.type === 'approve' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Override Tasks (leave blank to use logged {actionModal.session.tasksLogged})
                  </label>
                  <input type="number" min={0} step={1} value={actionForm.adminTasks}
                    onChange={(e) => setActionForm((f) => ({ ...f, adminTasks: e.target.value }))}
                    placeholder={String(actionModal.session.tasksLogged)} className={fieldClass} style={fieldStyle} />
                </div>
              )}

              {actionModal.type === 'reject' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason for rejection</label>
                  <input value={actionForm.reason} onChange={(e) => setActionForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. Task count doesn't match work log" className={fieldClass} style={fieldStyle} />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Admin Notes (optional)</label>
                <textarea rows={2} value={actionForm.adminNotes} onChange={(e) => setActionForm((f) => ({ ...f, adminNotes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={fieldStyle} />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3">
                <button onClick={actionModal.type === 'approve' ? handleApprove : handleReject} disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                  style={{ backgroundColor: actionModal.type === 'approve' ? '#10b981' : '#ef4444' }}>
                  {submitting ? <Spinner size="sm" /> : actionModal.type === 'approve' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {actionModal.type === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button onClick={() => setActionModal(null)} className="px-5 py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Paid Modal ──────────────────────────────────────────────── */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => setPayModal(null)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 15%, var(--bg-secondary))' }}>
                <DollarSign className="w-7 h-7" style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Mark as Paid</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{payModal.name} · Week {payModal.week} · {payModal.year}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleMarkPaid} disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: 'var(--accent-color)' }}>
                  {submitting ? <Spinner size="sm" /> : 'Confirm Paid'}
                </button>
                <button onClick={() => setPayModal(null)} className="px-5 py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
