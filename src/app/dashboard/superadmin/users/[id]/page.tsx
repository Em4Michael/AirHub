'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin.api';
import { superadminApi } from '@/lib/api/superadmin.api';
import { formatDate, formatTime, formatPercentage, formatCurrency } from '@/lib/utils/format';
import {
  ArrowLeft, Clock, Award, DollarSign, CreditCard,
  Mail, CheckCircle, AlertCircle, TrendingUp, Wallet,
  Check, FileText, XCircle, AlertTriangle,
  ArrowUp, ArrowDown, Shield, ShieldOff, Trash2, Star, Gift, Phone, Calendar,
} from 'lucide-react';
import { BankDetails, WeeklyPayment } from '@/types';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface UserStats {
  lifetime: { totalHours: number; avgQuality: number; entryCount: number; totalEarnings: number };
  weekly:   { totalHours: number; avgQuality: number; entryCount: number; totalEarnings: number };
  user: {
    id: string; name: string; email: string; role: string; status?: string;
    isApproved: boolean; profilePhoto?: string | null; createdAt?: string;
    bankDetails?: BankDetails; extraBonus?: number; extraBonusReason?: string;
    phone?: string | null;
    [key: string]: any;
  };
  dailyData?: Array<{
    _id?: string;
    date: string;
    time?: number;
    quality?: number;
    effectiveTime?: number;
    effectiveQuality?: number;
    adminApproved?: boolean;
    notes?: string;
    profile?: string;
  }>;
}

export default function SuperadminUserDetailsPage() {
  const params = useParams();
  const userId = params?.id as string;

  const [userStats,      setUserStats]      = useState<UserStats | null>(null);
  const [weeklyPayments, setWeeklyPayments] = useState<WeeklyPayment[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [markingPaid,    setMarkingPaid]    = useState<string | null>(null);
  const [markingBonus,   setMarkingBonus]   = useState(false);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [denyTarget,     setDenyTarget]     = useState<WeeklyPayment | null>(null);
  const [denyReason,     setDenyReason]     = useState('');
  const [denying,        setDenying]        = useState(false);

  useEffect(() => { if (userId) fetchUserDetails(); }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true); setError('');
      const statsRes = await adminApi.getUserStats(userId);
      if (!statsRes.success || !statsRes.data) throw new Error('Failed to load user stats');
      let mergedUser = statsRes.data.user as UserStats['user'];
      try {
        const fullRes = await adminApi.getUserById(userId);
        if (fullRes.success && fullRes.data) {
          mergedUser = {
            ...mergedUser, ...fullRes.data,
            profilePhoto:     fullRes.data.profilePhoto     ?? mergedUser.profilePhoto,
            bankDetails:      fullRes.data.bankDetails      ?? mergedUser.bankDetails,
            extraBonus:       fullRes.data.extraBonus       ?? mergedUser.extraBonus,
            extraBonusReason: fullRes.data.extraBonusReason ?? mergedUser.extraBonusReason,
            phone:            fullRes.data.phone            ?? mergedUser.phone,
          };
        }
      } catch {}
      setUserStats({ ...statsRes.data, user: mergedUser, dailyData: statsRes.data.dailyData ?? [] });
      await fetchWeeklyPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load user details');
    } finally { setLoading(false); }
  };

  const fetchWeeklyPayments = async () => {
    let payments: WeeklyPayment[] = [];
    try {
      const res = await adminApi.getUserWeeklyPayments(userId);
      if (res.success && Array.isArray(res.data)) payments = res.data;
    } catch {}
    if (!payments.length) {
      try {
        const res = await adminApi.getWeeklyPayments(userId, 1, 100);
        if (res.success && res.data) {
          payments = Array.isArray(res.data)
            ? (res.data.flat(Infinity) as WeeklyPayment[])
            : ((res.data as any).data ?? []);
        }
      } catch {}
    }
    payments.sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
    setWeeklyPayments(payments);
  };

  const handleMarkPaid = async (paymentId: string, weekStart: string) => {
    setMarkingPaid(paymentId); setError(''); setSuccess('');
    try {
      const res = await adminApi.markWeekAsPaid({ userId, weekStart });
      if (res.success) {
        setWeeklyPayments((prev) =>
          prev.map((p) => p._id === paymentId
            ? { ...p, status: 'paid', paid: true, paidDate: new Date().toISOString() } : p)
        );
        setSuccess('Payment marked as paid');
        setTimeout(fetchUserDetails, 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark payment');
    } finally { setMarkingPaid(null); }
  };

  const handleMarkBonusPaid = async () => {
    setMarkingBonus(true); setError(''); setSuccess('');
    try {
      const res = await (adminApi as any).markBonusPaid(userId);
      if (res?.success) {
        if (res.pending) {
          // Case B: all weeks paid — bonus queued, stays on user, no DB change
          setSuccess(res.message);
        } else {
          setSuccess(res.message || 'Bonus paid successfully');
          await fetchUserDetails();
        }
      } else throw new Error(res?.message || 'Failed');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to mark bonus as paid');
    } finally { setMarkingBonus(false); }
  };

  const handleDenyPayment = async () => {
    if (!denyTarget) return;
    setDenying(true);
    try {
      const res = await adminApi.denyPayment(denyTarget._id, denyReason);
      if (res.success) {
        setWeeklyPayments((prev) =>
          prev.map((p) => p._id === denyTarget._id ? { ...p, status: 'denied', paid: false } : p)
        );
        setDenyTarget(null); setDenyReason('');
        setSuccess('Payment denied');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deny payment');
    } finally { setDenying(false); }
  };

  const doAction = async (action: () => Promise<any>, msg: string) => {
    setActionLoading(true); setError(''); setSuccess('');
    try { await action(); setSuccess(msg); fetchUserDetails(); }
    catch (err: any) { setError(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await superadminApi.deleteUser(userId);
      window.location.href = '/dashboard/superadmin/users';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setDeleting(false);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name[0].toUpperCase();
  };

  const getStatusBadge  = (s?: string) => s === 'approved' ? 'success' : s === 'revoked' ? 'danger' : s === 'pending' ? 'warning' : 'gray';
  const getRoleBadge    = (r: string)  => r === 'superadmin' ? 'danger' : r === 'admin' ? 'warning' : 'primary';
  const getPaymentBadge = (p: WeeklyPayment) => {
    if (p.paid || p.status === 'paid')    return { variant: 'success' as const, label: 'Paid',     Icon: CheckCircle,  iconColor: 'text-green-600',  bgColor: 'bg-green-100' };
    if (p.status === 'denied')            return { variant: 'danger'  as const, label: 'Denied',   Icon: XCircle,      iconColor: 'text-red-600',    bgColor: 'bg-red-100'   };
    if (p.status === 'approved')          return { variant: 'info'    as const, label: 'Approved', Icon: AlertCircle,  iconColor: 'text-blue-600',   bgColor: 'bg-blue-100'  };
    return                                       { variant: 'warning' as const, label: 'Pending',  Icon: AlertCircle,  iconColor: 'text-orange-600', bgColor: 'bg-orange-100'};
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;
  if (!userStats) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Alert type="error" message="User not found" />
        <Link href="/dashboard/superadmin/users"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
      </div>
    );
  }

  const { user } = userStats;
  const isSuperadminUser = user.role === 'superadmin';

  const totals = weeklyPayments.reduce(
    (acc, p) => ({
      totalHours:      acc.totalHours      + (p.totalHours    || 0),
      weightedQuality: acc.weightedQuality + (p.avgQuality    || 0) * (p.entryCount || 0),
      entryCount:      acc.entryCount      + (p.entryCount    || 0),
      totalEarnings:   acc.totalEarnings   + (p.totalEarnings || 0),
      totalBonus:      acc.totalBonus      + (Number(p.extraBonus) || 0),
    }),
    { totalHours: 0, weightedQuality: 0, entryCount: 0, totalEarnings: 0, totalBonus: 0 }
  );
  const lifetimeAvgQuality = totals.entryCount > 0 ? totals.weightedQuality / totals.entryCount : 0;
  const totalUnpaid = weeklyPayments
    .filter((p) => !p.paid && p.status !== 'paid' && p.status !== 'denied')
    .reduce((sum, p) => sum + (Number(p.totalEarnings) || 0), 0);

  const hasBonus       = (user.extraBonus ?? 0) > 0;
  const hasBankDetails = user.bankDetails && (user.bankDetails.bankName || user.bankDetails.accountName || user.bankDetails.accountNumber);

  const pendingBonusRow: WeeklyPayment | null =
    hasBonus && !weeklyPayments.some((p) => !p.paid && Number(p.extraBonus) > 0 && p.paymentType === 'bonus')
      ? {
          _id: 'pending-bonus', user: userId,
          weekStart: new Date().toISOString(), weekEnd: new Date().toISOString(),
          weekNumber: 0, year: new Date().getFullYear(), weekStartDay: 2,
          totalHours: 0, avgQuality: 0, entryCount: 0, hourlyRate: 0,
          baseEarnings: 0, performanceMultiplier: 1, bonusEarnings: 0,
          extraBonus: user.extraBonus!, extraBonusReason: user.extraBonusReason,
          totalEarnings: user.extraBonus!, paymentType: 'bonus',
          status: 'pending', paid: false,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }
      : null;

  const allRows   = pendingBonusRow ? [pendingBonusRow, ...weeklyPayments] : weeklyPayments;
  const chartData = [...weeklyPayments]
    .filter((p) => p.paymentType !== 'bonus')
    .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
    .map((p) => ({
      label:    `W${p.weekNumber}`,
      hours:    Number(p.totalHours) || 0,
      quality:  Number(p.avgQuality) || 0,
      earnings: Number(p.totalEarnings) || 0,
      bonus:    Number(p.extraBonus) || 0,
    }));

  // Daily entries for the table — same source as UserDashboard
  const dailyEntries = (userStats.dailyData ?? [])
    .filter((d) => d.adminApproved)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/superadmin/users">
          <button className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>User Details</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Full performance, payment and role management</p>
        </div>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* User Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-md flex-shrink-0"
              style={{ backgroundColor: user.profilePhoto ? 'transparent' : 'var(--accent-color)' }}>
              {user.profilePhoto
                ? <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                : <span>{getUserInitials(user.name)}</span>}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</h2>
              <p className="flex items-center gap-2 mt-1" style={{ color: 'var(--text-secondary)' }}><Mail className="w-4 h-4" />{user.email}</p>
              {user.phone && <p className="flex items-center gap-2 mt-1" style={{ color: 'var(--text-secondary)' }}><Phone className="w-4 h-4" />{user.phone}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant={getRoleBadge(user.role)}>{user.role.toUpperCase()}</Badge>
                <Badge variant={getStatusBadge(user.status)}>{user.status || (user.isApproved ? 'APPROVED' : 'PENDING')}</Badge>
                {hasBonus && <Badge variant="success"><Star className="w-3 h-3 mr-1" />Bonus: {formatCurrency(user.extraBonus!)}</Badge>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Joined</p>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(user.createdAt || '')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Superadmin Controls */}
      {!isSuperadminUser && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" />Superadmin Controls</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {user.role === 'user' && (user.status === 'approved' || user.isApproved) && (
                <Button variant="outline" isLoading={actionLoading} onClick={() => doAction(() => superadminApi.promoteToAdmin(userId), 'User promoted to admin')}>
                  <ArrowUp className="w-4 h-4" />Promote to Admin
                </Button>
              )}
              {user.role === 'admin' && (
                <Button variant="outline" isLoading={actionLoading} onClick={() => doAction(() => superadminApi.demoteToUser(userId), 'Admin demoted to user')}>
                  <ArrowDown className="w-4 h-4" />Demote to User
                </Button>
              )}
              {(user.status === 'approved' || user.isApproved) && (
                <Button variant="danger" isLoading={actionLoading} onClick={() => doAction(() => superadminApi.revokeAccess(userId), 'Access revoked')}>
                  <ShieldOff className="w-4 h-4" />Revoke Access
                </Button>
              )}
              {user.status === 'revoked' && (
                <Button variant="success" isLoading={actionLoading} onClick={() => doAction(() => superadminApi.restoreAccess(userId), 'Access restored')}>
                  <Shield className="w-4 h-4" />Restore Access
                </Button>
              )}
              <Button variant="danger" onClick={() => setDeleteConfirm(true)}><Trash2 className="w-4 h-4" />Delete User</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bonus Summary */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Bonus Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl ${hasBonus ? 'bg-green-50 border-2 border-green-200' : ''}`}
              style={{ backgroundColor: hasBonus ? undefined : 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Gift className={`w-4 h-4 ${hasBonus ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: hasBonus ? '#166534' : 'var(--text-muted)' }}>Pending Bonus</p>
                {hasBonus && <Badge variant="success" className="ml-auto text-xs">Queued</Badge>}
              </div>
              <p className={`text-2xl font-bold ${hasBonus ? 'text-green-600' : ''}`} style={{ color: hasBonus ? undefined : 'var(--text-muted)' }}>
                {hasBonus ? formatCurrency(user.extraBonus!) : '₦0'}
              </p>
              {hasBonus && user.extraBonusReason && <p className="text-xs mt-1 text-green-700 italic">"{user.extraBonusReason}"</p>}
              {hasBonus && <p className="text-xs mt-2 text-green-600">Will auto-merge into next weekly payment</p>}
            </div>
            {(() => {
              const wb = Number(weeklyPayments[0]?.extraBonus) || 0;
              return (
                <div className={`p-4 rounded-xl ${wb > 0 ? 'bg-blue-50 border-2 border-blue-200' : ''}`}
                  style={{ backgroundColor: wb > 0 ? undefined : 'var(--bg-tertiary)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: wb > 0 ? '#1d4ed8' : 'var(--text-muted)' }}>Latest Week Bonus</p>
                  <p className={`text-2xl font-bold ${wb > 0 ? 'text-blue-600' : ''}`} style={{ color: wb > 0 ? undefined : 'var(--text-muted)' }}>{wb > 0 ? formatCurrency(wb) : '₦0'}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Most recent payment</p>
                </div>
              );
            })()}
            <div className={`p-4 rounded-xl ${totals.totalBonus > 0 ? 'bg-purple-50 border-2 border-purple-200' : ''}`}
              style={{ backgroundColor: totals.totalBonus > 0 ? undefined : 'var(--bg-tertiary)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: totals.totalBonus > 0 ? '#6b21a8' : 'var(--text-muted)' }}>Lifetime Bonuses</p>
              <p className={`text-2xl font-bold ${totals.totalBonus > 0 ? 'text-purple-600' : ''}`} style={{ color: totals.totalBonus > 0 ? undefined : 'var(--text-muted)' }}>
                {totals.totalBonus > 0 ? formatCurrency(totals.totalBonus) : '₦0'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Across all weeks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: "This Week's Performance", Icon: TrendingUp, color: 'text-blue-500',
            rows: [
              { Icon: Clock,    c: 'text-blue-500',   v: formatTime(userStats.weekly.totalHours),       l: 'Hours Worked' },
              { Icon: Award,    c: 'text-green-500',  v: formatPercentage(userStats.weekly.avgQuality),  l: 'Avg Quality'  },
              { Icon: FileText, c: 'text-purple-500', v: String(userStats.weekly.entryCount),            l: 'Entries'      },
            ],
            earn: { v: formatCurrency(userStats.weekly.totalEarnings), l: 'Weekly Earnings', c: 'text-emerald-600', bg: 'bg-emerald-50' } },
          { title: 'Lifetime Performance', Icon: Wallet, color: 'text-purple-500',
            rows: [
              { Icon: Clock,    c: 'text-blue-500',   v: formatTime(totals.totalHours),       l: 'Total Hours'   },
              { Icon: Award,    c: 'text-green-500',  v: formatPercentage(lifetimeAvgQuality), l: 'Avg Quality'   },
              { Icon: FileText, c: 'text-purple-500', v: String(totals.entryCount),            l: 'Total Entries' },
            ],
            earn: { v: formatCurrency(totals.totalEarnings), l: 'Total Earnings', c: 'text-purple-600', bg: 'bg-purple-50' } },
        ].map(({ title, Icon: TitleIcon, color, rows, earn }) => (
          <Card key={title}>
            <CardHeader><CardTitle className="flex items-center gap-2"><TitleIcon className={`w-5 h-5 ${color}`} />{title}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {rows.map(({ Icon: I, c, v, l }) => (
                  <div key={l} className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <I className={`w-6 h-6 mx-auto mb-2 ${c}`} />
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{v}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{l}</p>
                  </div>
                ))}
                <div className={`p-4 rounded-xl text-center ${earn.bg}`}>
                  <DollarSign className={`w-6 h-6 mx-auto mb-2 ${earn.c}`} />
                  <p className={`text-2xl font-bold ${earn.c}`}>{earn.v}</p>
                  <p className={`text-xs ${earn.c}`}>{earn.l}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bank Details */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Bank Details</CardTitle></CardHeader>
        <CardContent>
          {hasBankDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['bankName', 'accountName', 'accountNumber'] as const).filter((k) => (user.bankDetails as any)?.[k]).map((k) => (
                <div key={k} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{k === 'bankName' ? 'Bank Name' : k === 'accountName' ? 'Account Name' : 'Account Number'}</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{(user.bankDetails as any)[k]}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
              <p style={{ color: 'var(--text-primary)' }}>No bank details provided</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500" />Weekly Performance History</CardTitle></CardHeader>
          <CardContent className="space-y-8">
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Hours per Week</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" style={{ fontSize: 12 }} />
                  <YAxis stroke="var(--text-secondary)" style={{ fontSize: 12 }} tickFormatter={(v: number) => `${v}h`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }} formatter={(v?: number) => [`${(v ?? 0).toFixed(1)}h`, 'Hours'] as [string, string]} />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Quality per Week</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" style={{ fontSize: 12 }} />
                  <YAxis stroke="var(--text-secondary)" style={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }} formatter={(v?: number) => [`${(v ?? 0).toFixed(1)}%`, 'Quality'] as [string, string]} />
                  <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Earnings per Week (incl. bonus)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" style={{ fontSize: 12 }} />
                  <YAxis stroke="var(--text-secondary)" style={{ fontSize: 12 }} tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }} formatter={(v?: number, n?: string) => [formatCurrency(v ?? 0), n === 'bonus' ? 'Bonus' : 'Earnings'] as [string, string]} />
                  <Bar dataKey="earnings" fill="#8b5cf6" stackId="a" name="Earnings" />
                  <Bar dataKey="bonus"    fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" name="Bonus" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Approved Entries (mirrors UserDashboard) ────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Recent Approved Entries ({dailyEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyEntries.length === 0 ? (
            <div className="p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No approved entries yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyEntries.map((entry, idx) => {
                const t = entry.effectiveTime    ?? entry.time    ?? 0;
                const q = entry.effectiveQuality ?? entry.quality ?? 0;
                return (
                  <div key={entry._id || idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl hover:shadow-md transition-all gap-3"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Calendar className="w-4 h-4" />
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {entry.notes && (
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{entry.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <Clock className="w-3.5 h-3.5" />{formatTime(t)}
                      </span>
                      <span className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <Award className="w-3.5 h-3.5" />{formatPercentage(q)}
                      </span>
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />Approved
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" />Payment History ({allRows.length})</CardTitle>
            {totalUnpaid > 0 && <Badge variant="warning">{formatCurrency(totalUnpaid)} Unpaid</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {allRows.length === 0 ? (
            <div className="p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
              <p style={{ color: 'var(--text-primary)' }}>No payment records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allRows.map((payment) => {
                const isBonusOnly = payment._id === 'pending-bonus' || payment.paymentType === 'bonus';
                const badge       = getPaymentBadge(payment);
                const isPaid      = payment.paid === true || payment.status === 'paid';
                const isDenied    = payment.status === 'denied';
                const canAct      = !isPaid && !isDenied;
                const payBonus    = Number(payment.extraBonus) || 0;

                return (
                  <div key={payment._id} className="p-4 rounded-xl border"
                    style={{
                      backgroundColor: isBonusOnly ? 'rgba(245,158,11,0.06)' : isPaid ? 'var(--bg-tertiary)' : isDenied ? 'rgba(239,68,68,0.04)' : 'rgba(16,185,129,0.05)',
                      borderColor:     isBonusOnly ? 'rgba(245,158,11,0.3)'  : isPaid ? 'var(--border-color)' : isDenied ? 'rgba(239,68,68,0.2)'  : 'rgba(16,185,129,0.2)',
                    }}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isBonusOnly ? 'bg-yellow-100' : badge.bgColor}`}>
                        {isBonusOnly ? <Star className="w-6 h-6 text-yellow-600" /> : <badge.Icon className={`w-6 h-6 ${badge.iconColor}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isBonusOnly
                            ? <p className="font-semibold text-yellow-700">Pending Bonus Payment</p>
                            : <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Week {payment.weekNumber}, {payment.year}</p>}
                          <Badge variant={isBonusOnly ? 'warning' : badge.variant}>{isBonusOnly ? 'Queued for Next Week' : badge.label}</Badge>
                          {!isBonusOnly && payBonus > 0 && <Badge variant="success"><Star className="w-3 h-3 mr-1" />+{formatCurrency(payBonus)} bonus</Badge>}
                        </div>
                        {isBonusOnly ? (
                          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            {payment.extraBonusReason ? `"${payment.extraBonusReason}" · ` : ''}
                            Will auto-merge into next weekly payment, or merge now if an unpaid week exists.
                          </p>
                        ) : (
                          <>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{formatDate(payment.weekStart)} – {formatDate(payment.weekEnd)}</p>
                            <div className="flex gap-4 mt-2 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(payment.totalHours)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Award className="w-3 h-3" />{formatPercentage(payment.avgQuality)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{payment.entryCount || 0} entries</span>
                              {payment.paidDate && <><span>•</span><span className="text-green-600">Paid {formatDate(payment.paidDate)}</span></>}
                            </div>
                            {payBonus > 0 && payment.extraBonusReason && <p className="text-xs mt-1 text-green-600 italic">Bonus: "{payment.extraBonusReason}"</p>}
                          </>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xl font-bold ${isDenied ? 'text-red-500 line-through' : isBonusOnly ? 'text-yellow-600' : 'text-green-600'}`}>
                          {formatCurrency(payment.totalEarnings)}
                        </p>
                        {canAct && !isBonusOnly && (
                          <div className="flex gap-2 mt-2 justify-end">
                            <Button size="sm" onClick={() => handleMarkPaid(payment._id, payment.weekStart)} isLoading={markingPaid === payment._id}>
                              <Check className="w-4 h-4 mr-1" />Paid
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => { setDenyTarget(payment); setDenyReason(''); }}>
                              <XCircle className="w-4 h-4 mr-1" />Deny
                            </Button>
                          </div>
                        )}
                        {isBonusOnly && (
                          <div className="flex gap-2 mt-2 justify-end">
                            <Button size="sm" onClick={handleMarkBonusPaid} isLoading={markingBonus}>
                              <Check className="w-4 h-4 mr-1" />Merge Now
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deny Modal */}
      <Modal isOpen={!!denyTarget} onClose={() => setDenyTarget(null)} title="Deny Payment" size="sm">
        <div className="space-y-5">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Deny this payment?</p>
            {denyTarget && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Week {denyTarget.weekNumber}, {denyTarget.year} · {formatCurrency(denyTarget.totalEarnings)}
              </p>
            )}
          </div>
          <textarea value={denyReason} onChange={(e) => setDenyReason(e.target.value)} rows={3} className="input resize-none w-full" placeholder="Reason (optional)…" />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDenyPayment} isLoading={denying} className="flex-1"><XCircle className="w-4 h-4" />Deny Payment</Button>
            <Button variant="outline" onClick={() => setDenyTarget(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete User" size="sm">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          </div>
          <div className="text-center">
            <p style={{ color: 'var(--text-primary)' }}>Delete <strong>{user.name}</strong>?</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>This action cannot be undone. All data will be permanently deleted.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} isLoading={deleting} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}