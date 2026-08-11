'use client';

// Route: /dashboard/transcription/profiles/page.tsx
//
// Worker: Claim / Return spot, see pool status, reveal credentials.
// Admin:  Create / Edit / Delete profiles, manage worker pool, force-return.

import React, { useEffect, useState, useCallback } from 'react';
import { transcriptionApi, TranscriptionProfile } from '@/lib/api/transcription.api';
import { formatCurrency } from '@/lib/utils/format';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  ClipboardList, Play, StopCircle, Users, Lock, Eye, EyeOff,
  AlertCircle, MapPin, Search, Plus, Edit, Trash2,
  UserPlus, UserMinus, X, Save, BarChart2, KeyRound,
} from 'lucide-react';
import Link from 'next/link';

const money = (n: number) => formatCurrency(n ?? 0);

const EMPTY_FORM = {
  name: '', description: '', accountBearerName: '',
  email: '', state: '', country: '',
  accountName: '', loginDetails: '', loginMethod: '',
};

export default function TranscriptionProfilesPage() {
  const { user } = useAuth();
  const isAdmin      = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;
  const isSuperadmin = user?.role === UserRole.SUPERADMIN;

  const [profiles,   setProfiles]   = useState<TranscriptionProfile[]>([]);
  const [allUsers,   setAllUsers]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<'all' | 'available' | 'claimed' | 'mine'>('all');

  // Credential reveal per card
  const [revealLogin, setRevealLogin] = useState<Record<string, boolean>>({});

  // Claim / Return
  const [claiming,       setClaiming]       = useState<string | null>(null);
  const [returnModal,    setReturnModal]     = useState<TranscriptionProfile | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [tasks,          setTasks]           = useState('');
  const [notes,          setNotes]           = useState('');
  const [submitting,     setSubmitting]      = useState(false);

  // Force-return (superadmin)
  const [forceModal,  setForceModal]  = useState<TranscriptionProfile | null>(null);
  const [forceReason, setForceReason] = useState('');

  // Admin CRUD modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal,   setEditModal]   = useState<TranscriptionProfile | null>(null);
  const [poolModal,   setPoolModal]   = useState<TranscriptionProfile | null>(null);
  const [form,        setForm]        = useState({ ...EMPTY_FORM });

  // Rate snapshot for earnings preview in return modal
  const [rateSnapshot, setRateSnapshot] = useState<{ minutesPerTask: number; ratePerHour: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Always use enriched public profiles endpoint — returns per-worker task
      // breakdown, daily cap, today/thisWeek/allTime totals, isMine, inPool.
      const res = await transcriptionApi.getProfiles();
      if (res.success) setProfiles((res.data as TranscriptionProfile[]) ?? []);

      // Admin extras: badged users for pool modal
      if (isAdmin) {
        try {
          const ur = await transcriptionApi.getTranscriptionUsers({ badge: 'badged', limit: 200 });
          if (ur.success) setAllUsers((ur.data as any[]) ?? []);
        } catch { /* non-critical */ }
      }

      // Worker's active session id (for the return flow)
      try {
        const sr = await transcriptionApi.getMySessions({ page: 1, limit: 1 });
        const active = ((sr.data as any[]) ?? []).find((s: any) => s.status === 'active');
        setActiveSessionId(active?._id ?? null);
      } catch { /* fine */ }

      // Rate snapshot — fetch active benchmark directly so it's always current
      try {
        const bmRes = await transcriptionApi.getBenchmarks();
        if (bmRes.success) {
          const bms = (bmRes.data as any[]) ?? [];
          const active = bms.find((b: any) => b.isActive) ?? bms[0];
          if (active) setRateSnapshot({ minutesPerTask: active.minutesPerTask, ratePerHour: active.ratePerHour });
        }
      } catch { /* fine */ }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  // ── Claim ──────────────────────────────────────────────────────────────────
  const handleClaim = async (profileId: string) => {
    setClaiming(profileId); setError('');
    try {
      const res = await transcriptionApi.claimProfile(profileId);
      if (res.success) {
        setSuccess(res.message || 'Profile claimed! You can now start working.');
        await load(); setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to claim profile'); }
    finally { setClaiming(null); }
  };

  // ── Return ─────────────────────────────────────────────────────────────────
  const openReturn = (p: TranscriptionProfile) => {
    setReturnModal(p); setTasks(''); setNotes(''); setError('');
  };

  const handleReturn = async () => {
    if (!activeSessionId) return;
    const t = parseInt(tasks, 10);
    if (!tasks || isNaN(t) || t <= 0) { setError('Enter the number of tasks you completed (e.g. 100)'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await transcriptionApi.returnProfile(activeSessionId, { tasks: t, notes: notes || undefined });
      if (res.success) {
        setSuccess('Spot returned. Tasks pending admin approval.');
        setReturnModal(null); setActiveSessionId(null);
        await load(); setTimeout(() => setSuccess(''), 4000);
      }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to return'); }
    finally { setSubmitting(false); }
  };

  // ── Force-return (superadmin) ──────────────────────────────────────────────
  const handleForceReturn = async () => {
    if (!forceModal) return;
    setSubmitting(true); setError('');
    try {
      const res = await transcriptionApi.forceReturnProfile(forceModal._id, forceReason || undefined);
      if (res.success) {
        setSuccess('Account force-returned and slot freed.');
        setForceModal(null); setForceReason('');
        await load(); setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to force-return'); }
    finally { setSubmitting(false); }
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name || !form.accountBearerName) { setError('Name and account bearer name are required'); return; }
    setSubmitting(true);
    try {
      const res = await transcriptionApi.createProfile(form as any);
      if (res.success) {
        setSuccess('Profile created'); setCreateModal(false); setForm({ ...EMPTY_FORM }); await load();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to create profile'); }
    finally { setSubmitting(false); }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEdit = (p: TranscriptionProfile) => {
    setForm({
      name: p.name ?? '', description: p.description ?? '', accountBearerName: p.accountBearerName ?? '',
      email: p.email ?? '', state: p.state ?? '', country: p.country ?? '',
      accountName: p.accountName ?? '', loginDetails: p.loginDetails ?? '', loginMethod: p.loginMethod ?? '',
    });
    setEditModal(p); setError('');
  };

  const handleEdit = async () => {
    if (!editModal) return;
    if (!form.name || !form.accountBearerName) { setError('Name and account bearer name are required'); return; }
    setSubmitting(true);
    try {
      const res = await transcriptionApi.updateProfile(editModal._id, form as any);
      if (res.success) {
        setSuccess('Profile updated'); setEditModal(null); setForm({ ...EMPTY_FORM }); await load();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to update profile'); }
    finally { setSubmitting(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transcription profile?')) return;
    try {
      await transcriptionApi.deleteProfile(id);
      setSuccess('Profile deleted'); await load(); setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e?.response?.data?.message || 'Cannot delete — may be currently claimed'); }
  };

  // ── Pool management ────────────────────────────────────────────────────────
  const handleAddToPool = async (profileId: string, userId: string) => {
    try {
      await transcriptionApi.addWorkerToPool(profileId, userId);
      setSuccess('Worker added to pool');
      const r = await transcriptionApi.getProfiles();
      if (r.success) {
        setProfiles((r.data as TranscriptionProfile[]) ?? []);
        setPoolModal((r.data as TranscriptionProfile[])?.find((p) => p._id === profileId) ?? null);
      }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to add worker'); }
  };

  const handleRemoveFromPool = async (profileId: string, userId: string) => {
    try {
      await transcriptionApi.removeWorkerFromPool(profileId, userId);
      setSuccess('Worker removed from pool');
      const r = await transcriptionApi.getProfiles();
      if (r.success) {
        setProfiles((r.data as TranscriptionProfile[]) ?? []);
        setPoolModal((r.data as TranscriptionProfile[])?.find((p) => p._id === profileId) ?? null);
      }
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to remove worker'); }
  };

  // ── Derived lists ──────────────────────────────────────────────────────────
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

  const earningsPreview = tasks && !isNaN(parseInt(tasks)) && rateSnapshot
    ? money(parseInt(tasks) * (rateSnapshot.minutesPerTask / 60) * rateSnapshot.ratePerHour)
    : '—';

  // ── Shared create/edit form ────────────────────────────────────────────────
  const ProfileFormFields = () => (
    <>
      {[
        { key: 'name',              label: 'Profile Name',        required: true,  placeholder: 'e.g. Beta Transcriber' },
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

      <div className="pt-2 mt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-[10px] uppercase font-black tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Account access (optional)
        </p>
        {[
          { key: 'accountName',  label: 'Account Name',  placeholder: 'Platform username' },
          { key: 'loginMethod',  label: 'Login Method',  placeholder: 'e.g. Email + Password, Google SSO' },
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
            placeholder="Username, password, PIN — for admins and the current holder only"
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
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Transcription Profiles</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {profiles.filter((p) => !p.currentHolder).length} available ·{' '}
            {profiles.filter((p) => !!p.currentHolder).length} claimed ·{' '}
            {rateSnapshot ? `${rateSnapshot.minutesPerTask} min/task · ${money(rateSnapshot.ratePerHour)}/hr` : 'Loading rate…'}
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
            placeholder="Search profiles…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm" style={fieldStyle} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'available', 'claimed', 'mine'] as const).map((f) => (
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
        <div className="rounded-2xl p-12 text-center border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No profiles match your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const available = !p.currentHolder;
            const isMine    = p.isMine;
            const inPool    = p.inPool ?? isAdmin;
            const holder    = typeof p.currentHolder === 'object' ? p.currentHolder as any : null;
            const cap       = p.caps?.daily ?? p.maxTasksPerDay ?? 500;
            const todayPct  = Math.min(100, Math.round(((p.today ?? 0) / cap) * 100));

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
                        {p.accountBearerName}
                        {(p.state || p.country) && (
                          <span> · <MapPin className="w-3 h-3 inline" /> {[p.state, p.country].filter(Boolean).join(', ')}</span>
                        )}
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
                    <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
                    <Badge variant={available ? 'success' : 'danger'}>{available ? 'Available' : 'Claimed'}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Pool size</p>
                    <p className="font-bold text-sm flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                      <Users className="w-3.5 h-3.5" />{p.workerPool.length}
                    </p>
                  </div>
                  {!available && holder && (
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Held by</p>
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{holder.name}</p>
                    </div>
                  )}
                </div>

                {/* Task stats + daily cap bar */}
                <div className="px-5 py-3 border-b space-y-2" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between gap-4">
                    {[
                      { label: 'Today',     value: p.today    ?? 0 },
                      { label: 'This week', value: p.thisWeek ?? 0 },
                      { label: 'All time',  value: p.allTime  ?? 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-sm font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${todayPct}%`, backgroundColor: todayPct >= 90 ? '#ef4444' : 'var(--accent-color)' }} />
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {p.today ?? 0} / {cap} task daily cap
                    </p>
                  </div>
                  {(p.pendingTasks ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg"
                      style={{ backgroundColor: 'color-mix(in srgb, #f59e0b 12%, var(--bg-secondary))', color: '#b45309' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                      {p.pendingTasks} tasks awaiting admin approval
                    </div>
                  )}
                </div>

                {/* Credential reveal — holder only */}
                {isMine && (p.accountName || p.loginMethod || p.loginDetails) && (
                  <div className="px-5 py-3 border-b"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--accent-color) 5%, var(--bg-secondary))' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                        <p className="text-[10px] uppercase font-black tracking-wider" style={{ color: 'var(--accent-color)' }}>Your access</p>
                      </div>
                      <button onClick={() => setRevealLogin((s) => ({ ...s, [p._id]: !s[p._id] }))}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {revealLogin[p._id] ? <><EyeOff className="w-3 h-3" />Hide</> : <><Eye className="w-3 h-3" />Show</>}
                      </button>
                    </div>
                    {p.accountName  && <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Account: </span>{p.accountName}</p>}
                    {p.loginMethod  && <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Method: </span>{p.loginMethod}</p>}
                    {p.loginDetails && (
                      <p className="text-xs font-mono p-2 rounded-lg break-all"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                        {revealLogin[p._id] ? p.loginDetails : '•'.repeat(Math.min(20, p.loginDetails.length))}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="px-5 py-3 flex gap-2 flex-wrap">
                  {/* ── Worker actions ── */}
                  {!isAdmin && (
                    <>
                      {isMine ? (
                        <button onClick={() => openReturn(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold text-white"
                          style={{ backgroundColor: '#ef4444' }}>
                          <StopCircle className="w-4 h-4" />Return Spot
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

                  {/* ── Admin actions ── */}
                  {isAdmin && (
                    <>
                      <Link href={`/dashboard/transcription/admin/account/${p._id}`}
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

      {/* ── Return modal ─────────────────────────────────────────────────────── */}
      {returnModal && (
        <ModalShell onClose={() => setReturnModal(null)} title={`Return — ${returnModal.name}`}
          subtitle="Enter tasks completed to close this session">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Tasks completed <span className="text-red-500">*</span>
            </label>
            <input type="number" min={1} step={1} inputMode="numeric" placeholder="e.g. 100"
              value={tasks} onChange={(e) => setTasks(e.target.value)}
              className={fieldClass} style={fieldStyle} />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Earnings preview: <strong style={{ color: 'var(--accent-color)' }}>{earningsPreview}</strong>
              {rateSnapshot && ` (${tasks || 0} × ${rateSnapshot.minutesPerTask} min ÷ 60 × ${money(rateSnapshot.ratePerHour)}/hr)`}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notes (optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={fieldStyle} />
          </div>
          {error && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
          <ModalActions>
            <button onClick={handleReturn} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: '#ef4444' }}>
              {submitting ? <Spinner size="sm" /> : <StopCircle className="w-4 h-4" />}Submit & Return
            </button>
            <CancelBtn onClick={() => setReturnModal(null)} />
          </ModalActions>
        </ModalShell>
      )}

      {/* ── Force-return modal ────────────────────────────────────────────────── */}
      {forceModal && (
        <ModalShell onClose={() => setForceModal(null)} title={`Force-return — ${forceModal.name}`}
          subtitle={`Currently held by ${(forceModal.currentHolder as any)?.name ?? 'a worker'}`}>
          <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            This frees the slot immediately. The worker's active session is closed as rejected with no tasks counted.
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason (optional)</label>
            <input value={forceReason} onChange={(e) => setForceReason(e.target.value)}
              placeholder="e.g. Worker unreachable, stuck session" className={fieldClass} style={fieldStyle} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <ModalActions>
            <button onClick={handleForceReturn} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: '#f59e0b' }}>
              {submitting ? <Spinner size="sm" /> : <StopCircle className="w-4 h-4" />}Force return
            </button>
            <CancelBtn onClick={() => setForceModal(null)} />
          </ModalActions>
        </ModalShell>
      )}

      {/* ── Create modal ─────────────────────────────────────────────────────── */}
      {createModal && (
        <ModalShell onClose={() => setCreateModal(false)} title="Create Transcription Profile" wide>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <ProfileFormFields />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <ModalActions>
            <button onClick={handleCreate} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent-color)' }}>
              {submitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}Create Profile
            </button>
            <CancelBtn onClick={() => setCreateModal(false)} />
          </ModalActions>
        </ModalShell>
      )}

      {/* ── Edit modal ───────────────────────────────────────────────────────── */}
      {editModal && (
        <ModalShell onClose={() => setEditModal(null)} title={`Edit — ${editModal.name}`} wide>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <ProfileFormFields />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <ModalActions>
            <button onClick={handleEdit} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent-color)' }}>
              {submitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}Save Changes
            </button>
            <CancelBtn onClick={() => setEditModal(null)} />
          </ModalActions>
        </ModalShell>
      )}

      {/* ── Pool modal ───────────────────────────────────────────────────────── */}
      {poolModal && (
        <ModalShell onClose={() => setPoolModal(null)} title={`Worker Pool — ${poolModal.name}`}
          subtitle="Only users with the transcription badge can be added" wide>
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
                    <div key={w._id} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}>
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
                Add Badged Transcription User
              </p>
              <div className="space-y-2">
                {allUsers
                  .filter((u: any) => u.transcriptionBadge && !poolModal.workerPool.some((w: any) => w._id === u._id))
                  .map((u: any) => (
                    <div key={u._id} className="flex items-center justify-between p-3 rounded-xl border"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: '#059669' }}>{u.name?.[0]?.toUpperCase()}</div>
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
                {allUsers.filter((u: any) => u.transcriptionBadge && !poolModal.workerPool.some((w: any) => w._id === u._id)).length === 0 && (
                  <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                    All badged transcription users are already in the pool
                  </p>
                )}
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ── Shared modal shell ────────────────────────────────────────────────────────

function ModalShell({ children, onClose, title, subtitle, wide }: {
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

function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3 pt-1">{children}</div>;
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-5 py-3 rounded-xl font-semibold text-sm"
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
      Cancel
    </button>
  );
}