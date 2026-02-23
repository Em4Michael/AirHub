'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin.api';
import { Profile, User, Entry } from '@/types';
import { formatDate, formatTime, formatPercentage, formatCurrency } from '@/lib/utils/format';
import {
  Plus, Search, Trash2, Eye, Clock, Award,
  MapPin, User as UserIcon, Building, ChevronLeft, ChevronRight,
  AlertTriangle, Edit, DollarSign, Wallet, TrendingUp, Users, BarChart2,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PeriodStats { hours: number; quality: number; entries: number; earnings: number; }
interface ProfileStats {
  weekly: PeriodStats;
  lifetime: PeriodStats;
  chartData: Array<{ date: string; hours: number; quality: number }>;
}
interface AssignWorkerState { profile: Profile; defaultWorkerId: string; secondWorkerId: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RATE_PER_HOUR = 2000; // ₦/hr — adjust to match your benchmark rate

function calcStats(entries: Entry[]): PeriodStats {
  const approved = entries.filter((e) => e.adminApproved);
  if (!approved.length) return { hours: 0, quality: 0, entries: 0, earnings: 0 };
  const hours = approved.reduce((s, e) => s + (e.adminTime ?? e.time ?? 0), 0);
  const quality = approved.reduce((s, e) => s + (e.adminQuality ?? e.quality ?? 0), 0) / approved.length;
  return { hours, quality, entries: approved.length, earnings: hours * RATE_PER_HOUR };
}

function buildChartData(entries: Entry[]): Array<{ date: string; hours: number; quality: number }> {
  const byDate: Record<string, { hours: number; qualities: number[] }> = {};
  entries.filter((e) => e.adminApproved).forEach((e) => {
    const d = e.date.split('T')[0];
    if (!byDate[d]) byDate[d] = { hours: 0, qualities: [] };
    byDate[d].hours += e.adminTime ?? e.time ?? 0;
    byDate[d].qualities.push(e.adminQuality ?? e.quality ?? 0);
  });
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, v]) => ({
      date,
      hours: Math.round(v.hours * 10) / 10,
      quality: Math.round((v.qualities.reduce((s, q) => s + q, 0) / v.qualities.length) * 10) / 10,
    }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeChart, setActiveChart] = useState<'hours' | 'quality'>('hours');
  const [assignWorker, setAssignWorker] = useState<AssignWorkerState | null>(null);
  const [assigningWorker, setAssigningWorker] = useState(false);

  useEffect(() => { fetchProfiles(); fetchWorkers(); }, [page]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllProfiles(page, 200);
      if (response.success && response.data) {
        setProfiles(response.data);
        if (response.pagination) setTotalPages(response.pagination.pages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profiles');
    } finally { setLoading(false); }
  };

  const fetchWorkers = async () => {
    try {
      const response = await adminApi.getAllUsers(1, 200);
      if (response.success && response.data) {
        setWorkers(response.data.filter(
          (u: User) => u.role === 'user' && (u.isApproved === true || u.status === 'approved')
        ));
      }
    } catch (err: any) { console.error('Failed to load workers:', err); }
  };

  const fetchProfileDetails = async (profileId: string) => {
    setLoadingDetails(true);
    try {
      const response = await adminApi.getProfileById(profileId);
      if (response.success && response.data) {
        setSelectedProfile(response.data);
        const allEntries: Entry[] = response.data.entries || [];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyEntries = allEntries.filter((e) => new Date(e.date) >= oneWeekAgo);
        setProfileStats({
          weekly: calcStats(weeklyEntries),
          lifetime: calcStats(allEntries),
          chartData: buildChartData(allEntries),
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile details');
    } finally { setLoadingDetails(false); }
  };

  const openAssignModal = (profile: Profile) => {
    const getId = (w: string | User | null | undefined) =>
      !w ? '' : typeof w === 'string' ? w : w._id;
    setAssignWorker({
      profile,
      defaultWorkerId: getId(profile.defaultWorker as any),
      secondWorkerId: getId(profile.secondWorker as any),
    });
  };

  const handleAssignWorker = async () => {
    if (!assignWorker) return;
    setAssigningWorker(true);
    setError('');
    try {
      await adminApi.reassignWorker({ profileId: assignWorker.profile._id, newWorkerId: assignWorker.defaultWorkerId, permanent: true, slot: 'default' });
      await adminApi.reassignWorker({ profileId: assignWorker.profile._id, newWorkerId: assignWorker.secondWorkerId, permanent: true, slot: 'second' });
      setSuccess('Workers assigned successfully');
      setAssignWorker(null);
      fetchProfiles();
      if (selectedProfile?.profile._id === assignWorker.profile._id) fetchProfileDetails(assignWorker.profile._id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign workers');
    } finally { setAssigningWorker(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await adminApi.deleteProfile(deleteConfirm._id);
      setProfiles((prev) => prev.filter((p) => p._id !== deleteConfirm._id));
      setDeleteConfirm(null);
      setSelectedProfile(null);
      setSuccess('Profile deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete profile');
    } finally { setDeleting(false); }
  };

  const getWorkerName = (w: string | User | null | undefined) =>
    !w || typeof w === 'string' ? null : w.name;

  const filteredProfiles = profiles.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.accountBearerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && profiles.length === 0) {
    return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;
  }

  // ── Stat box sub-component ────────────────────────────────────────────────

  const StatBox = ({
    icon: Icon, label, value, colorClass,
  }: { icon: React.ElementType; label: string; value: string; colorClass: string }) => (
    <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      <Icon className={`w-5 h-5 mx-auto mb-2 ${colorClass}`} />
      <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Profiles</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Manage client profiles and view performance</p>
        </div>
        <div className="flex gap-3">
          <Input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles…" leftIcon={<Search className="w-5 h-5" />} />
          <Link href="/dashboard/admin/profiles/new">
            <Button><Plus className="w-5 h-5" />Create Profile</Button>
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No profiles found</p>
            <Link href="/dashboard/admin/profiles/new">
              <Button className="mt-4"><Plus className="w-5 h-5" />Create First Profile</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => {
            const primaryName = getWorkerName(profile.defaultWorker as any);
            const secondaryName = getWorkerName(profile.secondWorker as any);
            return (
              <Card key={profile._id} className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => fetchProfileDetails(profile._id)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: 'var(--accent-color)' }}>
                        {profile.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{profile.fullName}</h3>
                        <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); openAssignModal(profile); }}
                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="Assign Workers">
                        <Users className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(profile); }}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete Profile">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{profile.state}, {profile.country}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <UserIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{profile.accountBearerName}</span>
                    </div>
                    <div className="flex items-start gap-2 pt-1">
                      <Users className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {primaryName || secondaryName ? (
                          <>
                            {primaryName && <span className="block">{primaryName} (primary)</span>}
                            {secondaryName && <span className="block">{secondaryName} (secondary)</span>}
                          </>
                        ) : <span>No workers assigned</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Created {formatDate(profile.createdAt)}</span>
                    <span className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--accent-color)' }}>
                      View Details <Eye className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg transition-colors disabled:opacity-50" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg transition-colors disabled:opacity-50" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── Profile Details Modal ─────────────────────────────────────────── */}
      <Modal isOpen={!!selectedProfile && !deleteConfirm && !assignWorker}
        onClose={() => { setSelectedProfile(null); setProfileStats(null); }}
        title="Profile Details" size="xl">
        {loadingDetails ? (
          <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
        ) : selectedProfile && (
          <div className="space-y-6">
            {/* Profile header */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: 'var(--accent-color)' }}>
                {selectedProfile.profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedProfile.profile.fullName}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedProfile.profile.email}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {selectedProfile.profile.state}, {selectedProfile.profile.country} · {selectedProfile.profile.accountBearerName}
                </p>
              </div>
            </div>

            {profileStats && (
              <>
                {/* Weekly + Lifetime stat boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />This Week
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <StatBox icon={Clock} label="Hours" value={formatTime(profileStats.weekly.hours)} colorClass="text-blue-500" />
                        <StatBox icon={Award} label="Avg Quality" value={formatPercentage(profileStats.weekly.quality)} colorClass="text-green-500" />
                        <StatBox icon={BarChart2} label="Entries" value={String(profileStats.weekly.entries)} colorClass="text-purple-500" />
                        <StatBox icon={DollarSign} label="Est. Earnings" value={formatCurrency(profileStats.weekly.earnings)} colorClass="text-emerald-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-purple-500" />All Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <StatBox icon={Clock} label="Total Hours" value={formatTime(profileStats.lifetime.hours)} colorClass="text-blue-500" />
                        <StatBox icon={Award} label="Avg Quality" value={formatPercentage(profileStats.lifetime.quality)} colorClass="text-green-500" />
                        <StatBox icon={BarChart2} label="Total Entries" value={String(profileStats.lifetime.entries)} colorClass="text-purple-500" />
                        <StatBox icon={DollarSign} label="Est. Earnings" value={formatCurrency(profileStats.lifetime.earnings)} colorClass="text-emerald-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance graph */}
                {profileStats.chartData.length > 1 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
                          Performance History (last 30 days — approved entries only)
                        </CardTitle>
                        <div className="flex rounded-lg overflow-hidden border text-xs" style={{ borderColor: 'var(--border-color)' }}>
                          {(['hours', 'quality'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveChart(tab)}
                              className="px-3 py-1.5 font-medium transition-colors"
                              style={{
                                backgroundColor: activeChart === tab ? 'var(--accent-color)' : 'var(--bg-secondary)',
                                color: activeChart === tab ? 'white' : 'var(--text-secondary)',
                                borderRight: tab === 'hours' ? '1px solid var(--border-color)' : undefined,
                              }}>
                              {tab === 'hours' ? 'Hours' : 'Quality %'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={profileStats.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradQuality" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" style={{ fontSize: '11px' }}
                            tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                          <YAxis stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '0.5rem', fontSize: '12px',
                            }}
                            formatter={(value: any) =>
                              activeChart === 'hours' ? [`${value}h`, 'Hours'] : [`${value}%`, 'Quality']
                            }
                          />
                          {activeChart === 'hours' ? (
                            <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2}
                              fill="url(#gradHours)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          ) : (
                            <Area type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2}
                              fill="url(#gradQuality)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Assigned Workers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Assigned Workers (up to 2)</h4>
                <button onClick={() => openAssignModal(selectedProfile.profile)}
                  className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--accent-color)' }}>
                  <Edit className="w-4 h-4" />Change Workers
                </button>
              </div>
              <div className="space-y-2">
                {(['defaultWorker', 'secondWorker'] as const).map((slot, i) => {
                  const w = selectedProfile.profile[slot];
                  const label = i === 0 ? 'Primary' : 'Secondary';
                  return (
                    <div key={slot} className="p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: w ? 'var(--accent-color)' : 'var(--bg-secondary)' }}>
                        {w ? (typeof w === 'string' ? 'W' : w.name?.charAt(0)?.toUpperCase() || 'W') : '—'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {w ? (typeof w === 'string' ? `Worker ID: ${w}` : w.name) : 'Not assigned'}
                        </p>
                        {w && typeof w !== 'string' && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{w.email}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Entries */}
            {selectedProfile.entries?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Recent Entries ({selectedProfile.entries.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedProfile.entries.slice(0, 10).map((entry: Entry) => (
                    <div key={entry._id} className="p-3 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(entry.date)}</p>
                          <Badge variant={entry.adminApproved ? 'success' : 'warning'}>
                            {entry.adminApproved ? 'Approved' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {typeof entry.worker === 'object' ? entry.worker.name : 'Worker'} · {entry.notes || 'No notes'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {formatTime(entry.adminTime ?? entry.time)}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatPercentage(entry.adminQuality ?? entry.quality)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <Button variant="danger" onClick={() => setDeleteConfirm(selectedProfile.profile)} className="flex-1">
                <Trash2 className="w-4 h-4" />Delete Profile
              </Button>
              <Button variant="outline" onClick={() => { setSelectedProfile(null); setProfileStats(null); }} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Assign Workers Modal ──────────────────────────────────────────── */}
      <Modal isOpen={!!assignWorker} onClose={() => setAssignWorker(null)} title="Assign Workers" size="sm">
        {assignWorker && (() => {
          const primaryOptions = workers.filter((w) => w._id !== assignWorker.secondWorkerId);
          const secondaryOptions = workers.filter((w) => w._id !== assignWorker.defaultWorkerId);
          const sameError = assignWorker.defaultWorkerId && assignWorker.secondWorkerId &&
            assignWorker.defaultWorkerId === assignWorker.secondWorkerId;
          return (
            <div className="space-y-5">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Assigning workers to <strong style={{ color: 'var(--text-primary)' }}>{assignWorker.profile.fullName}</strong>.
              </p>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Primary Worker</label>
                <select value={assignWorker.defaultWorkerId}
                  onChange={(e) => setAssignWorker({ ...assignWorker, defaultWorkerId: e.target.value })}
                  className="input">
                  <option value="">No primary worker</option>
                  {primaryOptions.map((w) => <option key={w._id} value={w._id}>{w.name} ({w.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Secondary Worker <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <select value={assignWorker.secondWorkerId}
                  onChange={(e) => setAssignWorker({ ...assignWorker, secondWorkerId: e.target.value })}
                  className="input">
                  <option value="">No secondary worker</option>
                  {secondaryOptions.map((w) => <option key={w._id} value={w._id}>{w.name} ({w.email})</option>)}
                </select>
                {sameError && <p className="error-text mt-1">Primary and secondary workers must be different.</p>}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAssignWorker} isLoading={assigningWorker} disabled={!!sameError} className="flex-1">
                  Save Assignment
                </Button>
                <Button variant="outline" onClick={() => setAssignWorker(null)} className="flex-1">Cancel</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Profile" size="sm">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="text-center">
            <p style={{ color: 'var(--text-primary)' }}>Delete <strong>{deleteConfirm?.fullName}</strong>?</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              This cannot be undone. All associated entries will also be deleted.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} isLoading={deleting} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}