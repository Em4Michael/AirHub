'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { adminApi } from '@/lib/api/admin.api';
import { formatDate, formatTime, formatPercentage, formatCurrency } from '@/lib/utils/format';
import {
  ArrowLeft,
  Clock,
  Award,
  DollarSign,
  CreditCard,
  Mail,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Wallet,
  Check,
  FileText,
} from 'lucide-react';
import { BankDetails, WeeklyPayment } from '@/types';

interface UserStats {
  lifetime: {
    totalHours: number;
    avgQuality: number;
    entryCount: number;
    totalEarnings: number;
  };
  weekly: {
    totalHours: number;
    avgQuality: number;
    entryCount: number;
    totalEarnings: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status?: string;
    isApproved: boolean;
    profilePhoto?: string | null;
    createdAt?: string;
    updatedAt?: string;
    bankDetails?: BankDetails;
    [key: string]: any;
  };
}

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params?.id as string;

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [weeklyPayments, setWeeklyPayments] = useState<WeeklyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Get user stats (weekly data)
      const statsRes = await adminApi.getUserStats(userId);
      if (!statsRes.success || !statsRes.data) {
        throw new Error('Failed to load user stats');
      }

      // 2. Get full user profile (bankDetails + profilePhoto)
      let mergedUser = statsRes.data.user as UserStats['user'];
      
      try {
        const fullUserRes = await adminApi.getUserById(userId);
        if (fullUserRes.success && fullUserRes.data) {
          mergedUser = {
            ...mergedUser,
            ...fullUserRes.data,
            profilePhoto: fullUserRes.data.profilePhoto ?? mergedUser.profilePhoto,
            bankDetails: fullUserRes.data.bankDetails ?? mergedUser.bankDetails,
          };
        }
      } catch (err) {
        console.warn('Could not fetch full user profile:', err);
      }

      setUserStats({
        ...statsRes.data,
        user: mergedUser,
      });

      // 3. Get weekly payments
      await fetchWeeklyPayments();
      
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyPayments = async () => {
    let payments: WeeklyPayment[] = [];
    
    // Method 1: Try getUserWeeklyPayments
    try {
      const res1 = await adminApi.getUserWeeklyPayments(userId);
      if (res1.success && res1.data && Array.isArray(res1.data)) {
        payments = res1.data;
        console.log('✅ Fetched payments via getUserWeeklyPayments:', payments.length);
      }
    } catch (err) {
      console.warn('⚠️ getUserWeeklyPayments failed:', err);
    }

    // Method 2: Try getWeeklyPayments if Method 1 failed
    if (payments.length === 0) {
      try {
        const res2 = await adminApi.getWeeklyPayments(userId, 1, 100);
        if (res2.success && res2.data) {
          // Handle different response structures
          if (Array.isArray(res2.data)) {
            payments = res2.data.flat(Infinity) as WeeklyPayment[];
          } else if (res2.data && typeof res2.data === 'object') {
            // Maybe it's paginated
            payments = (res2.data as any).data || [];
          }
          console.log('✅ Fetched payments via getWeeklyPayments:', payments.length);
        }
      } catch (err) {
        console.warn('⚠️ getWeeklyPayments failed:', err);
      }
    }

    // Sort by most recent first
    if (payments.length > 0) {
      payments.sort((a, b) =>
        new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
      );
      
      console.log('📊 Payment summary:', {
        total: payments.length,
        paid: payments.filter(p => p.paid || p.status === 'paid').length,
        pending: payments.filter(p => !p.paid && p.status !== 'paid').length,
        sample: payments[0]
      });
    } else {
      console.warn('⚠️ No weekly payments found for user');
    }

    setWeeklyPayments(payments);
  };

  const handleMarkPaid = async (paymentId: string, weekStart: string, weekEnd: string) => {
    setMarkingPaid(paymentId);
    setError('');
    setSuccess('');
    
    try {
      const res = await adminApi.markWeekAsPaid({
        userId,
        weekStart,
        weekEnd,
      });

      if (res.success) {
        // Update local state immediately
        setWeeklyPayments(prev =>
          prev.map(p =>
            p._id === paymentId
              ? { ...p, status: 'paid', paid: true, paidDate: new Date().toISOString() }
              : p
          )
        );
        setSuccess('Payment marked as paid successfully');
        
        // Optionally refresh all data
        setTimeout(() => fetchWeeklyPayments(), 1000);
      } else {
        throw new Error(res.message || 'Failed to mark payment');
      }
    } catch (err: any) {
      console.error('Error marking paid:', err);
      setError(err.response?.data?.message || err.message || 'Failed to mark payment as paid');
    } finally {
      setMarkingPaid(null);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length >= 2
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Alert type="error" message="User not found" />
        <Link href="/dashboard/admin/users">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // CALCULATE LIFETIME STATS FROM PAID PAYMENTS
  // ═══════════════════════════════════════════════════════════════════
  const paidPayments = weeklyPayments.filter(p =>
    (p.paid === true || p.status === 'paid')
  );

  const lifetimePaid = paidPayments.reduce(
    (acc, p) => ({
      totalHours: acc.totalHours + (p.totalHours || 0),
      avgQuality: p.entryCount > 0
        ? acc.avgQuality + ((p.avgQuality || 0) * (p.entryCount || 0))
        : acc.avgQuality,
      entryCount: acc.entryCount + (p.entryCount || 0),
      totalEarnings: acc.totalEarnings + (p.totalEarnings || 0),
    }),
    { totalHours: 0, avgQuality: 0, entryCount: 0, totalEarnings: 0 }
  );

  // Calculate weighted average quality
  lifetimePaid.avgQuality = lifetimePaid.entryCount > 0
    ? lifetimePaid.avgQuality / lifetimePaid.entryCount
    : 0;

  const totalUnpaid = weeklyPayments
    .filter(p => !p.paid && p.status !== 'paid')
    .reduce((sum, p) => sum + (Number(p.totalEarnings) || 0), 0);

  const hasBankDetails =
    userStats.user.bankDetails &&
    (userStats.user.bankDetails.bankName ||
      userStats.user.bankDetails.accountName ||
      userStats.user.bankDetails.accountNumber);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'revoked': return 'danger';
      default: return 'gray';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin': return 'danger';
      case 'admin': return 'warning';
      default: return 'primary';
    }
  };

  const getPaymentStatusBadge = (payment: WeeklyPayment) => {
    if (payment.paid === true || payment.status === 'paid') {
      return { variant: 'success' as const, label: 'Paid', icon: CheckCircle, bgColor: 'bg-green-100' };
    }
    if (payment.status === 'approved') {
      return { variant: 'info' as const, label: 'Approved', icon: AlertCircle, bgColor: 'bg-blue-100' };
    }
    return { variant: 'warning' as const, label: 'Pending', icon: AlertCircle, bgColor: 'bg-orange-100' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/users">
          <button
            className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            User Details
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Complete performance and payment information
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* User Header with Profile Photo */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-md"
              style={{
                backgroundColor: userStats.user.profilePhoto ? 'transparent' : 'var(--accent-color)'
              }}
            >
              {userStats.user.profilePhoto ? (
                <img
                  src={userStats.user.profilePhoto}
                  alt={userStats.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getUserInitials(userStats.user.name || '?')}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {userStats.user.name || '—'}
              </h2>
              <p className="flex items-center gap-2 mt-1" style={{ color: 'var(--text-secondary)' }}>
                <Mail className="w-4 h-4" />
                {userStats.user.email}
              </p>
              <div className="flex gap-2 mt-3">
                <Badge variant={getRoleColor(userStats.user.role)}>
                  {userStats.user.role.toUpperCase()}
                </Badge>
                <Badge variant={getStatusColor(userStats.user.status)}>
                  {userStats.user.status || (userStats.user.isApproved ? 'APPROVED' : 'PENDING')}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Joined</p>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatDate(userStats.user.createdAt || new Date().toISOString())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* This Week's Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              This Week's Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatTime(userStats.weekly.totalHours)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hours Worked</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Award className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatPercentage(userStats.weekly.avgQuality)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Quality</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <FileText className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {userStats.weekly.entryCount}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Entries</p>
              </div>
              <div className="p-4 rounded-xl text-center bg-emerald-50">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(userStats.weekly.totalEarnings)}
                </p>
                <p className="text-xs text-emerald-700">Weekly Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifetime Performance (Paid Only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-500" />
              Lifetime Performance (Paid)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatTime(lifetimePaid.totalHours)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Hours</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Award className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatPercentage(lifetimePaid.avgQuality)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Quality</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <FileText className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {lifetimePaid.entryCount}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Entries</p>
              </div>
              <div className="p-4 rounded-xl text-center bg-purple-50">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(lifetimePaid.totalEarnings)}
                </p>
                <p className="text-xs text-purple-700">Total Paid Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasBankDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userStats.user.bankDetails?.bankName && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Bank Name</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {userStats.user.bankDetails.bankName}
                  </p>
                </div>
              )}
              {userStats.user.bankDetails?.accountName && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Account Name</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {userStats.user.bankDetails.accountName}
                  </p>
                </div>
              )}
              {userStats.user.bankDetails?.accountNumber && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Account Number</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {userStats.user.bankDetails.accountNumber}
                  </p>
                </div>
              )}
              {userStats.user.bankDetails?.routingNumber && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Routing Number</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {userStats.user.bankDetails.routingNumber}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
              <p style={{ color: 'var(--text-primary)' }}>No bank details provided</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                This user has not submitted banking information yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Payment History ({weeklyPayments.length})
            </CardTitle>
            {totalUnpaid > 0 && (
              <Badge variant="warning">
                {formatCurrency(totalUnpaid)} Unpaid
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {weeklyPayments.length === 0 ? (
            <div className="p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
              <p style={{ color: 'var(--text-primary)' }}>No payment records yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Weekly payments will appear here once entries are processed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {weeklyPayments.map((payment) => {
                const statusInfo = getPaymentStatusBadge(payment);
                const StatusIcon = statusInfo.icon;
                const isPaid = payment.paid === true || payment.status === 'paid';
                
                return (
                  <div
                    key={payment._id}
                    className="p-4 rounded-xl flex items-center gap-4 border"
                    style={{
                      backgroundColor: isPaid ? 'var(--bg-tertiary)' : 'rgba(16, 185, 129, 0.05)',
                      borderColor: isPaid ? 'var(--border-color)' : 'rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.bgColor}`}>
                      <StatusIcon className={`w-6 h-6 ${isPaid ? 'text-green-600' : 'text-orange-600'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Week {payment.weekNumber}, {payment.year}
                        </p>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(payment.weekStart, 'MMM d')} – {formatDate(payment.weekEnd, 'MMM d, yyyy')}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(payment.totalHours)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {formatPercentage(payment.avgQuality)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {payment.entryCount || 0} entries
                        </span>
                        {payment.paidDate && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">Paid {formatDate(payment.paidDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(payment.totalEarnings)}
                      </p>
                      {!isPaid && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkPaid(payment._id, payment.weekStart, payment.weekEnd)}
                          isLoading={markingPaid === payment._id}
                          className="mt-2"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}