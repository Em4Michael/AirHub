'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin.api';
import { apiClient } from '@/lib/api/client';
import { Profile } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  Percent, XCircle, CheckCircle, Save, Search,
  AlertTriangle, Users, TrendingDown, Edit3, X,
  CalendarDays, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_ADMIN_CUT = 25;

// ── Week helpers ───────────────────────────────────────────────────────────────

interface WeekRange {
  weekStart: Date;
  weekEnd:   Date;
  label:     string;
}

function getMondayOf(d: Date): Date {
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function buildWeek(monday: Date): WeekRange {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return {
    weekStart: monday,
    weekEnd:   sunday,
    label:     `${fmt(monday)} – ${fmt(sunday)} ${sunday.getFullYear()}`,
  };
}

/** Returns "YYYY-MM-DD" without timezone shift. */
function toDateStr(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface EditState {
  adminCutPercentage: string;
  isTerminated: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const thisWeek = useMemo(() => buildWeek(getMondayOf(new Date())), []);

  const [week,           setWeek]          = useState<WeekRange>(thisWeek);
  const [allProfiles,    setAllProfiles]    = useState<Profile[]>([]);
  const [activeIds,      setActiveIds]      = useState<Set<string>>(new Set());
  const [loadingInit,    setLoadingInit]    = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [search,         setSearch]         = useState('');
  const [saving,         setSaving]         = useState<string | null>(null);
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editState,      setEditState]      = useState<EditState>({
    adminCutPercentage: '',
    isTerminated: false,
  });

  // ── Load profiles once ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingInit(true);
        setError('');
        const res = await adminApi.getAllProfiles(1, 500);
        if (cancelled) return;
        if (res.success && res.data) {
          setAllProfiles(res.data as Profile[]);
        } else {
          setError('Failed to load profiles');
        }
      } catch {
        if (!cancelled) setError('Failed to load profiles');
      } finally {
        if (!cancelled) setLoadingInit(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Load entries for selected week (server-side date filter) ───────────────
  const loadEntriesForWeek = useCallback(async (w: WeekRange) => {
    setLoadingEntries(true);
    setError('');
    try {
      const res = await apiClient.get('/admin/entries', {
        params: {
          approved:  'true',
          startDate: toDateStr(w.weekStart),
          endDate:   toDateStr(w.weekEnd),
          limit:     500,
          page:      1,
        },
      });

      const body = res.data;
      if (body.success && Array.isArray(body.data)) {
        const ids = new Set<string>();
        body.data.forEach((entry: any) => {
          const pid =
            entry.profile && typeof entry.profile === 'object'
              ? entry.profile._id
              : entry.profile;
          if (pid) ids.add(String(pid));
        });
        setActiveIds(ids);
      } else {
        setError('Failed to load entries for this week');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load entries for this week'
      );
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    loadEntriesForWeek(week);
  }, [week, loadEntriesForWeek]);

  // ── Week navigation ────────────────────────────────────────────────────────
  const isCurrentWeek =
    week.weekStart.getTime() === thisWeek.weekStart.getTime();

  const goPrev = () => {
    const prev = new Date(week.weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeek(buildWeek(prev));
  };

  const goNext = () => {
    if (isCurrentWeek) return;
    const next = new Date(week.weekStart);
    next.setDate(next.getDate() + 7);
    setWeek(buildWeek(next));
  };

  // ── Derived lists ──────────────────────────────────────────────────────────
  const activeProfiles = useMemo(
    () => allProfiles.filter((p) => activeIds.has(p._id)),
    [allProfiles, activeIds]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return activeProfiles;
    return activeProfiles.filter(
      (a) =>
        a.fullName?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.accountBearerName?.toLowerCase().includes(q) ||
        a.state?.toLowerCase().includes(q)
    );
  }, [activeProfiles, search]);

  // ── Edit handlers ──────────────────────────────────────────────────────────
  const openEdit = (account: Profile) => {
    setEditingId(account._id);
    setEditState({
      adminCutPercentage:
        account.adminCutPercentage != null
          ? String(account.adminCutPercentage)
          : '',
      isTerminated: account.isTerminated ?? false,
    });
  };

  const closeEdit = () => setEditingId(null);

  const handleSave = async (accountId: string) => {
    const raw = editState.adminCutPercentage;
    const pct = raw === '' ? null : parseFloat(raw);
    if (pct !== null && (isNaN(pct) || pct < 0 || pct > 100)) {
      setError('Percentage must be between 0 and 100');
      return;
    }
    setSaving(accountId);
    setError('');
    setSuccess('');
    try {
      const payload: Partial<Profile> = {
        isTerminated:       editState.isTerminated,
        adminCutPercentage: pct,
      };
      const res = await adminApi.updateProfile(accountId, payload);
      if (res.success) {
        setAllProfiles((prev) =>
          prev.map((p) => (p._id === accountId ? { ...p, ...payload } : p))
        );
        setSuccess('Account settings saved');
        setEditingId(null);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.message || 'Failed to save');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const terminatedCount = activeProfiles.filter((a) => a.isTerminated).length;
  const activeCount     = activeProfiles.length - terminatedCount;
  const withCustomRate  = activeProfiles.filter(
    (a) => a.adminCutPercentage != null
  ).length;

  const workerMeta = (
    w: string | { _id: string; name: string } | null | undefined
  ): { id: string; name: string } | null => {
    if (!w || typeof w === 'string') return null;
    return { id: (w as any)._id, name: (w as any).name };
  };

  const loading = loadingInit || loadingEntries;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">

      {/* Header + week picker */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Active Accounts
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Accounts with approved entries for the selected week.
            Set admin cut % and mark terminated accounts here.
          </p>
        </div>

        <div
          className="flex items-center gap-1 rounded-2xl p-1 self-start flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={goPrev}
            disabled={loadingEntries}
            className="p-2 rounded-xl transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center px-2 min-w-[200px]">
            {isCurrentWeek && (
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: 'var(--accent-color)' }}
              >
                Current Week
              </p>
            )}
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {week.label}
            </p>
          </div>

          <button
            onClick={goNext}
            disabled={isCurrentWeek || loadingEntries}
            className="p-2 rounded-xl transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <CalendarDays className="w-5 h-5" />, label: 'Active This Week',   value: loading ? '…' : String(activeProfiles.length), color: 'bg-blue-100 text-blue-600'   },
          { icon: <CheckCircle  className="w-5 h-5" />, label: 'Earning Admin Cut',  value: loading ? '…' : String(activeCount),            color: 'bg-green-100 text-green-600' },
          { icon: <TrendingDown className="w-5 h-5" />, label: 'Terminated',         value: loading ? '…' : String(terminatedCount),        color: 'bg-red-100 text-red-600'     },
          { icon: <Percent      className="w-5 h-5" />, label: 'Custom Rates',       value: loading ? '…' : String(withCustomRate),         color: 'bg-purple-100 text-purple-600'},
        ].map(({ icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 border"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              {icon}
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 rounded-2xl p-4 border"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-color) 6%, var(--bg-secondary))',
          borderColor:     'color-mix(in srgb, var(--accent-color) 30%, var(--border-color))',
        }}
      >
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-color)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            How earnings are calculated:{' '}
          </span>
          Each account can have a custom admin cut %. If none is set the default{' '}
          <strong>{DEFAULT_ADMIN_CUT}%</strong> applies. Accounts marked{' '}
          <strong>Terminated</strong> contribute ₦0 to admin earnings — workers are still
          paid normally.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, bearer or state…"
          className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor:     'var(--border-color)',
            color:           'var(--text-primary)',
          }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {search ? 'No accounts match your search' : 'No accounts worked on this week'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {!search && 'Use the arrows above to browse other weeks, or check back once entries are approved.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <tr>
                  {['Account', 'Bearer', 'Workers', 'Admin Cut %', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {filtered.map((account) => {
                  const isEditing  = editingId === account._id;
                  const isSaving   = saving    === account._id;
                  const terminated = account.isTerminated ?? false;
                  const rate       = account.adminCutPercentage != null ? account.adminCutPercentage : DEFAULT_ADMIN_CUT;
                  const dw         = workerMeta(account.defaultWorker);
                  const sw         = workerMeta(account.secondWorker);

                  return (
                    <tr
                      key={account._id}
                      style={{
                        backgroundColor: terminated
                          ? 'color-mix(in srgb, #ef4444 4%, var(--bg-primary))'
                          : 'var(--bg-primary)',
                        opacity: terminated ? 0.85 : 1,
                      }}
                    >
                      {/* Account */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                            style={{ backgroundColor: terminated ? '#9ca3af' : 'var(--accent-color)' }}
                          >
                            {account.fullName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {account.fullName}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {account.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Bearer */}
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {account.accountBearerName || '—'}
                      </td>

                      {/* Workers */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          {dw ? (
                            <Link
                              href={`/dashboard/admin/users/${dw.id}`}
                              className="text-xs font-medium hover:underline flex items-center gap-1"
                              style={{ color: 'var(--accent-color)' }}
                            >
                              <Users className="w-3 h-3" />{dw.name}
                            </Link>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No worker</span>
                          )}
                          {sw && (
                            <Link
                              href={`/dashboard/admin/users/${sw.id}`}
                              className="text-xs font-medium hover:underline flex items-center gap-1"
                              style={{ color: 'var(--accent-color)' }}
                            >
                              <Users className="w-3 h-3" />{sw.name}
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Admin Cut % */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min="0" max="100" step="0.5"
                              value={editState.adminCutPercentage}
                              onChange={(e) => setEditState((s) => ({ ...s, adminCutPercentage: e.target.value }))}
                              placeholder={String(DEFAULT_ADMIN_CUT)}
                              className="w-20 px-2 py-1.5 rounded-lg border text-sm font-semibold text-center"
                              style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor:     'var(--accent-color)',
                                color:           'var(--text-primary)',
                              }}
                            />
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className="text-lg font-black tabular-nums"
                              style={{ color: account.adminCutPercentage != null ? 'var(--accent-color)' : 'var(--text-muted)' }}
                            >
                              {rate}%
                            </span>
                            {account.adminCutPercentage == null && (
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                              >
                                default
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <button
                            onClick={() => setEditState((s) => ({ ...s, isTerminated: !s.isTerminated }))}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              editState.isTerminated
                                ? 'bg-red-100 border-red-300 text-red-700'
                                : 'bg-green-100 border-green-300 text-green-700'
                            }`}
                          >
                            {editState.isTerminated
                              ? <><XCircle className="w-3.5 h-3.5" />Terminated</>
                              : <><CheckCircle className="w-3.5 h-3.5" />Active</>}
                          </button>
                        ) : (
                          <Badge variant={terminated ? 'danger' : 'success'}>
                            {terminated ? 'Terminated' : 'Active'}
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(account._id)}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
                              style={{ backgroundColor: 'var(--accent-color)' }}
                            >
                              {isSaving ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5" />}
                              Save
                            </button>
                            <button
                              onClick={closeEdit}
                              className="p-1.5 rounded-xl"
                              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openEdit(account)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border"
                            style={{
                              borderColor:     'var(--border-color)',
                              color:           'var(--text-secondary)',
                              backgroundColor: 'var(--bg-secondary)',
                            }}
                          >
                            <Edit3 className="w-3.5 h-3.5" />Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {filtered.map((account) => {
              const isEditing  = editingId === account._id;
              const isSaving   = saving    === account._id;
              const terminated = account.isTerminated ?? false;
              const rate       = account.adminCutPercentage != null ? account.adminCutPercentage : DEFAULT_ADMIN_CUT;
              const dw         = workerMeta(account.defaultWorker);
              const sw         = workerMeta(account.secondWorker);

              return (
                <div
                  key={account._id}
                  className="p-4 space-y-3"
                  style={{
                    backgroundColor: terminated
                      ? 'color-mix(in srgb, #ef4444 4%, var(--bg-primary))'
                      : 'var(--bg-primary)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: terminated ? '#9ca3af' : 'var(--accent-color)' }}
                      >
                        {account.fullName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {account.fullName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{account.email}</p>
                      </div>
                    </div>
                    <Badge variant={terminated ? 'danger' : 'success'}>
                      {terminated ? 'Terminated' : 'Active'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin Cut</p>
                      <p className="text-lg font-black" style={{ color: 'var(--accent-color)' }}>
                        {rate}%
                        {account.adminCutPercentage == null && (
                          <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>(default)</span>
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bearer</p>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {account.accountBearerName || '—'}
                      </p>
                    </div>
                  </div>

                  {(dw || sw) && (
                    <div className="flex flex-wrap gap-2">
                      {dw && (
                        <Link
                          href={`/dashboard/admin/users/${dw.id}`}
                          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-color)' }}
                        >
                          <Users className="w-3 h-3" />{dw.name}
                        </Link>
                      )}
                      {sw && (
                        <Link
                          href={`/dashboard/admin/users/${sw.id}`}
                          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-color)' }}
                        >
                          <Users className="w-3 h-3" />{sw.name}
                        </Link>
                      )}
                    </div>
                  )}

                  {isEditing ? (
                    <div
                      className="rounded-xl p-4 space-y-4 border"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent-color)' }}
                    >
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                          Admin Cut Percentage
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="0" max="100" step="0.5"
                            value={editState.adminCutPercentage}
                            onChange={(e) => setEditState((s) => ({ ...s, adminCutPercentage: e.target.value }))}
                            placeholder={String(DEFAULT_ADMIN_CUT)}
                            className="flex-1 px-3 py-2 rounded-xl border text-sm font-semibold"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              borderColor:     'var(--border-color)',
                              color:           'var(--text-primary)',
                            }}
                          />
                          <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>%</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Leave blank to use default {DEFAULT_ADMIN_CUT}%
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                          Account Status
                        </label>
                        <button
                          onClick={() => setEditState((s) => ({ ...s, isTerminated: !s.isTerminated }))}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                            editState.isTerminated
                              ? 'bg-red-50 border-red-300 text-red-700'
                              : 'bg-green-50 border-green-300 text-green-700'
                          }`}
                        >
                          {editState.isTerminated
                            ? <><XCircle className="w-4 h-4" />Marked Terminated — tap to undo</>
                            : <><CheckCircle className="w-4 h-4" />Active — tap to mark Terminated</>}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(account._id)}
                          disabled={isSaving}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
                          style={{ backgroundColor: 'var(--accent-color)' }}
                        >
                          {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                          Save Changes
                        </button>
                        <button
                          onClick={closeEdit}
                          className="px-4 py-2.5 rounded-xl font-semibold text-sm"
                          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openEdit(account)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border"
                      style={{
                        borderColor:     'var(--border-color)',
                        color:           'var(--text-secondary)',
                        backgroundColor: 'var(--bg-secondary)',
                      }}
                    >
                      <Edit3 className="w-4 h-4" />Edit Rate & Status
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}