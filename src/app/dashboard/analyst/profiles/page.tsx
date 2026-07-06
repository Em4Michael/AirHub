'use client';

// Route: /dashboard/analyst/profiles/page.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { analystApi } from '@/lib/api/analyst.api';
import { AnalystProfile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { WorkerHoursBar, colourForIndex, WorkerSlice } from '@/components/analyst/WorkerHoursBar';
import {
  Search, Users, CheckCircle, XCircle, Lock,
  Play, Plus, Edit, Trash2, UserPlus, UserMinus,
  X, Save, StopCircle, BarChart2, KeyRound, Eye, EyeOff,
} from 'lucide-react';

type CardPeriod = 'today' | 'week' | 'month' | 'allTime';
const CARD_PERIODS: { key: CardPeriod; label: string }[] = [
  { key: 'today',   label: 'Day'   },
  { key: 'week',    label: 'Week'  },
  { key: 'month',   label: 'Month' },
  { key: 'allTime', label: 'All'   },
];

const EMPTY_FORM = {
  name: '', description: '', accountBearerName: '',
  email: '', state: '', country: '',
  accountName: '', loginDetails: '', loginMethod: '',
};

export default function AnalystProfilesPage() {
  const { user } = useAuth();
  const isAdmin      = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;
  const isSuperadmin = user?.role === UserRole.SUPERADMIN;

  const [profiles,  setProfiles]  = useState<AnalystProfile[]>([]);
  const [allUsers,  setAllUsers]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<'all' | 'available' | 'claimed' | 'mine'>('all');

  // Per-card UI state: which period each card's bar shows (default daily),
  // and whether the claimer has revealed the login details on their card.
  const [cardPeriod, setCardPeriod] = useState<Record<string, CardPeriod>>({});
  const [revealLogin, setRevealLogin] = useState<Record<string, boolean>>({});
  const periodOf = (id: string): CardPeriod => cardPeriod[id] ?? 'today';

  // Claim / return
  const [claiming,  setClaiming]  = useState<string | null>(null);
  const [returnModal, setReturnModal] = useState<AnalystProfile | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [returnHours, setReturnHours] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Force-return (superadmin)
  const [forceModal, setForceModal] = useState<AnalystProfile | null>(null);
  const [forceReason, setForceReason] = useState('');

  // Admin modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal,   setEditModal]   = useState<AnalystProfile | null>(null);
  const [poolModal,   setPoolModal]   = useState<AnalystProfile | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Always use the ENRICHED getProfiles (getPublicAnalystProfiles) for card
      // data — it's the only endpoint that returns per-worker hours, totals and
      // pendingHours. adminGetProfiles returns raw profiles with no hours, which
      // is why cards looked empty for admins until "Stats" was clicked.
      const res = await analystApi.getProfiles();
      if (res.success) setProfiles(res.data!);

      // Admin-only extras (badged users for the pool modal) — must not blank the
      // page if it fails, so it's isolated from the profiles fetch above.
      if (isAdmin) {
        try {
          const ur = await analystApi.getAnalystUsers({ badge: 'badged', limit: 200 });
          if (ur.success) setAllUsers(ur.data!);
        } catch { /* pool list is non-critical */ }
      }

      // Worker's active session (for the return flow)
      try {
        const sr = await analystApi.getMySessions({ page: 1, limit: 1 });
        const active = sr.data?.find((s: any) => s.status === 'active');
        setActiveSessionId(active?._id ?? null);
      } catch { /* no active session is fine */ }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleClaim = async (profileId: string) => {
    setClaiming(profileId);
    setError('');
    try {
      const res = await analystApi.claimProfile(profileId);
      if (res.success) {
        setSuccess(res.message || 'Profile claimed!');
        await load();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to claim profile');
    } finally {
      setClaiming(null);
    }
  };

  const openReturn = (p: AnalystProfile) => {
    setReturnModal(p); setReturnHours(''); setReturnNotes(''); setError('');
  };

  const handleReturn = async () => {
    if (!activeSessionId) return;
    const h = parseFloat(returnHours);
    if (!returnHours || isNaN(h) || h <= 0) {
      setError('Enter the number of hours you worked (e.g. 3.5)');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await analystApi.returnProfile(activeSessionId, { hours: h, notes: returnNotes || undefined });
      if (res.success) {
        setSuccess('Spot returned. Hours pending admin review.');
        setReturnModal(null);
        setReturnHours(''); setReturnNotes('');
        await load();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to return profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceReturn = async () => {
    if (!forceModal) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await analystApi.forceReturnProfile(forceModal._id, forceReason || undefined);
      if (res.success) {
        setSuccess('Account force-returned and freed.');
        setForceModal(null); setForceReason('');
        await load();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to force-return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.accountBearerName) {
      setError('Name and account bearer name are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await analystApi.createProfile(form as any);
      if (res.success) {
        setSuccess('Profile created');
        setCreateModal(false);
        setForm({ ...EMPTY_FORM });
        await load();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (p: AnalystProfile) => {
    setForm({
      name: p.name ?? '', description: p.description ?? '', accountBearerName: p.accountBearerName ?? '',
      email: p.email ?? '', state: p.state ?? '', country: p.country ?? '',
      accountName: p.accountName ?? '', loginDetails: p.loginDetails ?? '', loginMethod: p.loginMethod ?? '',
    });
    setEditModal(p); setError('');
  };

  const handleEdit = async () => {
    if (!editModal) return;
    if (!form.name || !form.accountBearerName) {
      setError('Name and account bearer name are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await analystApi.updateProfile(editModal._id, form as any);
      if (res.success) {
        setSuccess('Profile updated');
        setEditModal(null);
        setForm({ ...EMPTY_FORM });
        await load();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this analyst profile?')) return;
    try {
      await analystApi.deleteProfile(id);
      setSuccess('Profile deleted');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Cannot delete — may be currently claimed');
    }
  };

  const handleAddToPool = async (profileId: string, userId: string) => {
    try {
      await analystApi.addWorkerToPool(profileId, userId);
      setSuccess('Worker added to pool');
      const r = await analystApi.getProfiles();
      if (r.success) {
        setProfiles(r.data!);
        setPoolModal(r.data!.find((p) => p._id === profileId) ?? null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to add worker');
    }
  };

  const handleRemoveFromPool = async (profileId: string, userId: string) => {
    try {
      await analystApi.removeWorkerFromPool(profileId, userId);
      setSuccess('Worker removed from pool');
      const r = await analystApi.getProfiles();
      if (r.success) {
        setProfiles(r.data!);
        setPoolModal(r.data!.find((p) => p._id === profileId) ?? null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to remove worker');
    }
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.accountBearerName.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'       ? true :
      filter === 'available' ? !p.currentHolder :
      filter === 'claimed'   ? !!p.currentHolder :
      filter === 'mine'      ? p.isMine === true : true;
    return matchSearch && matchFilter;
  });

  const fieldClass = 'w-full px-3 py-2.5 rounded-xl border text-sm';
  const fieldStyle = { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

  // Shared create/edit form body
  const ProfileFormFields = () => (
    <>
      {[
        { key: 'name',              label: 'Profile Name',        required: true,  placeholder: 'e.g. Alpha Rater' },
        { key: 'accountBearerName', label: 'Account Bearer Name', required: true,  placeholder: 'e.g. Jane Smith' },
        { key: 'description',       label: 'Description',         required: false, placeholder: 'Optional notes…' },
        { key: 'email',             label: 'Email',               required: false, placeholder: 'email@example.com' },
        { key: 'state',             label: 'State',               required: false, placeholder: 'e.g. Lagos' },
        { key: 'country',           label: 'Country',             required: false, placeholder: 'e.g. Nigeria' },
      ].map(({ key, label, required, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {label}{required && <span className="text-red-500"> *</span>}
          </label>
          <input value={(form as any)[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder} className={fieldClass} style={fieldStyle} />
        </div>
      ))}

      {/* Optional account-access section */}
      <div className="pt-2 mt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-[10px] uppercase font-black tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Account access (optional)
        </p>
        {[
          { key: 'accountName',  label: 'Account Name', placeholder: 'Platform username, if different from bearer' },
          { key: 'loginMethod',  label: 'Login Method', placeholder: 'e.g. Email + Password, Google SSO, 2FA via SMS' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="mb-4">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
            <input value={(form as any)[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder} className={fieldClass} style={fieldStyle} />
          </div>
        ))}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Login Details</label>
          <textarea rows={2} value={form.loginDetails}
            onChange={(e) => setForm((f) => ({ ...f, loginDetails: e.target.value }))}
            placeholder="Username, password, PIN — stored for admins only"
            className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={fieldStyle} />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Analyst Profiles</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {profiles.filter((p) => !p.currentHolder).length} available ·{' '}
            {profiles.filter((p) => !!p.currentHolder).length} claimed
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => { setForm({ ...EMPTY_FORM }); setCreateModal(true); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-color)' }}>
            <Plus className="w-4 h-4" />New Profile
          </button>
        )}
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search profiles…" className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm" style={fieldStyle} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all','available','claimed','mine'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
              style={{
                backgroundColor: filter === f ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color:           filter === f ? '#fff' : 'var(--text-secondary)',
                border:          `1px solid ${filter === f ? 'transparent' : 'var(--border-color)'}`,
              }}>
              {f === 'mine' ? 'My Claim' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No profiles match your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const available = !p.currentHolder;
            const isMine    = p.isMine;
            const inPool    = p.inPool ?? isAdmin;

            return (
              <div key={p._id} className="rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor:     isMine ? 'var(--accent-color)' : 'var(--border-color)',
                  borderWidth:     isMine ? 2 : 1,
                }}>
                {/* Card header */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                        {isMine && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0"
                            style={{ backgroundColor: 'var(--accent-color)' }}>YOURS</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                        {p.accountBearerName}{p.state ? ` · ${p.state}` : ''}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${available ? 'bg-green-400' : 'bg-red-400'}`} />
                  </div>
                  {p.description && (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                  )}
                </div>

                {/* Stats row */}
                <div className="px-5 py-3 border-t border-b grid grid-cols-2 gap-3"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                  <div>
                    <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Status</p>
                    <Badge variant={available ? 'success' : 'danger'}>{available ? 'Available' : 'Claimed'}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Pool size</p>
                    <p className="font-bold text-sm flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                      <Users className="w-3.5 h-3.5" />{p.workerPool.length}
                    </p>
                  </div>
                  {!available && p.currentHolder && (
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Held by</p>
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {(p.currentHolder as any).name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Hours + multi-colour worker bar — visible to everyone */}
                {(() => {
                  const anyP        = p as any;
                  const period      = periodOf(p._id);
                  const breakdown   = (anyP.workerBreakdown ?? []) as Array<{ id: string; name: string; today: number; week: number; month: number; allTime: number }>;
                  const totalForP   =
                    period === 'today' ? anyP.today
                    : period === 'week' ? anyP.thisWeek
                    : period === 'month' ? anyP.thisMonth
                    : anyP.allTime;
                  const cap =
                    period === 'today' ? anyP.caps?.daily
                    : period === 'week' ? anyP.caps?.weekly
                    : period === 'month' ? anyP.caps?.monthly
                    : 0;
                  const colourMap: Record<string, string> = {};
                  breakdown.forEach((w, i) => { colourMap[w.id] = colourForIndex(i); });
                  const slices: WorkerSlice[] = breakdown
                    .map((w) => ({ id: w.id, name: w.name, hours: (w as any)[period] }))
                    .filter((w) => w.hours > 0);

                  return (
                    <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                          Hours worked
                        </p>
                        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          {CARD_PERIODS.map(({ key, label }) => (
                            <button key={key}
                              onClick={() => setCardPeriod((s) => ({ ...s, [p._id]: key }))}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all"
                              style={{
                                backgroundColor: period === key ? 'var(--accent-color)' : 'transparent',
                                color:           period === key ? '#fff' : 'var(--text-muted)',
                              }}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {slices.length === 0 ? (
                        <p className="text-xs py-2 text-center" style={{ color: 'var(--text-muted)' }}>
                          {period === 'today' ? 'No approved hours yet today' : 'No approved hours in this period'}
                        </p>
                      ) : (
                        <WorkerHoursBar slices={slices} cap={cap ?? 0} colourMap={colourMap} height={18} showLegend />
                      )}
                      {anyP.pendingHours > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg"
                          style={{ backgroundColor: 'color-mix(in srgb, #f59e0b 12%, var(--bg-secondary))', color: '#b45309' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                          {anyP.pendingHours}h awaiting admin approval
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Claimer-only: login & access details */}
                {isMine && ((p as any).loginDetails || (p as any).loginMethod || (p as any).accountName) && (
                  <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--accent-color) 5%, var(--bg-secondary))' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                        <p className="text-[10px] uppercase font-black tracking-wider" style={{ color: 'var(--accent-color)' }}>
                          Your access
                        </p>
                      </div>
                      <button onClick={() => setRevealLogin((s) => ({ ...s, [p._id]: !s[p._id] }))}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {revealLogin[p._id] ? <><EyeOff className="w-3 h-3" />Hide</> : <><Eye className="w-3 h-3" />Show</>}
                      </button>
                    </div>
                    {(p as any).accountName && (
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Account: </span>{(p as any).accountName}
                      </p>
                    )}
                    {(p as any).loginMethod && (
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Method: </span>{(p as any).loginMethod}
                      </p>
                    )}
                    {(p as any).loginDetails && (
                      <p className="text-xs font-mono p-2 rounded-lg break-all"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                        {revealLogin[p._id] ? (p as any).loginDetails : '•'.repeat(Math.min(20, (p as any).loginDetails.length))}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="px-5 py-3 flex gap-2 flex-wrap">
                  {!isAdmin && (
                    <>
                      {isMine ? (
                        <button onClick={() => openReturn(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold text-white"
                          style={{ backgroundColor: '#ef4444' }}>
                          <XCircle className="w-4 h-4" />Return Spot
                        </button>
                      ) : available && inPool ? (
                        <button onClick={() => handleClaim(p._id)} disabled={!!claiming}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                          style={{ backgroundColor: 'var(--accent-color)' }}>
                          {claiming === p._id ? <Spinner size="sm" /> : <Play className="w-4 h-4" />}Claim
                        </button>
                      ) : !inPool ? (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold"
                          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                          <Lock className="w-4 h-4" />Not in pool
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold"
                          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                          <Lock className="w-4 h-4" />Unavailable
                        </div>
                      )}
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <Link href={`/dashboard/analyst/admin/accounts/${p._id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}>
                        <BarChart2 className="w-3.5 h-3.5" />Stats
                      </Link>
                      <button onClick={() => setPoolModal(p)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}>
                        <Users className="w-3.5 h-3.5" />Pool
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}>
                        <Edit className="w-3.5 h-3.5" />Edit
                      </button>
                      {isSuperadmin && p.currentHolder && (
                        <button onClick={() => { setForceModal(p); setForceReason(''); setError(''); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-600 border border-amber-200">
                          <StopCircle className="w-3.5 h-3.5" />Force return
                        </button>
                      )}
                      <button onClick={() => handleDelete(p._id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-200">
                        <Trash2 className="w-3.5 h-3.5" />Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Return Modal (single hours field) ────────────────────────────────── */}
      {returnModal && (
        <Modal onClose={() => setReturnModal(null)} title={`Return "${returnModal.name}"`} subtitle="Enter how many hours you worked">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Hours worked <span className="text-red-500">*</span>
            </label>
            <input type="number" min={0} step={0.25} inputMode="decimal" placeholder="e.g. 3.5"
              value={returnHours} onChange={(e) => setReturnHours(e.target.value)}
              className={fieldClass} style={fieldStyle} />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Decimals allowed (0.5 = 30 minutes).</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notes</label>
            <textarea rows={2} value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={fieldStyle} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button onClick={handleReturn} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: '#ef4444' }}>
              {submitting ? <Spinner size="sm" /> : <XCircle className="w-4 h-4" />}Submit & Return
            </button>
            <CancelBtn onClick={() => setReturnModal(null)} />
          </div>
        </Modal>
      )}

      {/* ── Force-return Modal (superadmin) ──────────────────────────────────── */}
      {forceModal && (
        <Modal onClose={() => setForceModal(null)} title={`Force-return "${forceModal.name}"`}
          subtitle={`Currently held by ${(forceModal.currentHolder as any)?.name ?? 'a worker'}`}>
          <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            This frees the slot immediately. The worker's active session is closed as rejected and contributes no hours.
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason (optional)</label>
            <input value={forceReason} onChange={(e) => setForceReason(e.target.value)}
              placeholder="e.g. Worker unreachable, stuck session" className={fieldClass} style={fieldStyle} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button onClick={handleForceReturn} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: '#f59e0b' }}>
              {submitting ? <Spinner size="sm" /> : <StopCircle className="w-4 h-4" />}Force return
            </button>
            <CancelBtn onClick={() => setForceModal(null)} />
          </div>
        </Modal>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      {createModal && (
        <Modal onClose={() => setCreateModal(false)} title="Create Analyst Profile" wide>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <ProfileFormFields />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={handleCreate} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent-color)' }}>
              {submitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}Create Profile
            </button>
            <CancelBtn onClick={() => setCreateModal(false)} />
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {editModal && (
        <Modal onClose={() => setEditModal(null)} title={`Edit "${editModal.name}"`} wide>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <ProfileFormFields />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={handleEdit} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent-color)' }}>
              {submitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}Save Changes
            </button>
            <CancelBtn onClick={() => setEditModal(null)} />
          </div>
        </Modal>
      )}

      {/* ── Pool Modal ───────────────────────────────────────────────────────── */}
      {poolModal && (
        <Modal onClose={() => setPoolModal(null)} title={`Worker Pool — ${poolModal.name}`}
          subtitle="Only badged analysts can be added" wide>
          <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                In Pool ({poolModal.workerPool.length})
              </p>
              {poolModal.workerPool.length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No workers in pool yet</p>
              ) : (
                <div className="space-y-2">
                  {poolModal.workerPool.map((w: any) => (
                    <div key={w._id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: 'var(--accent-color)' }}>{w.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{w.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{w.email}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveFromPool(poolModal._id, w._id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Add Badged Analyst
              </p>
              <div className="space-y-2">
                {allUsers
                  .filter((u) => u.analystBadge && !poolModal.workerPool.some((w: any) => w._id === u._id))
                  .map((u) => (
                    <div key={u._id} className="flex items-center justify-between p-3 rounded-xl border"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: '#10b981' }}>{u.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                      <button onClick={() => handleAddToPool(poolModal._id, u._id)}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                {allUsers.filter((u) => u.analystBadge && !poolModal.workerPool.some((w: any) => w._id === u._id)).length === 0 && (
                  <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>All badged analysts are already in the pool</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Small modal helpers ────────────────────────────────────────────────────────

function Modal({ children, onClose, title, subtitle, wide }: {
  children: React.ReactNode; onClose: () => void; title: string; subtitle?: string; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'} rounded-2xl overflow-hidden shadow-2xl`}
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-5 py-3 rounded-xl font-semibold text-sm"
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
  );
}