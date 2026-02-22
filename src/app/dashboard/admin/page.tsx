'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { adminApi } from '@/lib/api/admin.api';
import { formatTime, formatPercentage, formatCurrency } from '@/lib/utils/format';
import { 
  Users, Briefcase, FileText, Clock, Award, UserCheck, 
  Plus, ArrowRight, Activity, AlertTriangle, Star, Trophy,
  DollarSign, TrendingUp, Wallet
} from 'lucide-react';

interface WorkerRanking {
  _id: string;
  name: string;
  email: string;
  totalTime: number;
  avgQuality: number;
  overallScore: number;
  entryCount: number;
  weeklyEarnings: number;
}

interface DashboardStats {
  totalUsers: number;
  totalProfiles: number;
  pendingEntries: number;
  pendingUsers: number;
  activeWorkers: number;
  totalHoursThisWeek: number;
  avgQualityThisWeek: number;
  weeklyEarnings: number;
  lifetimeEarnings: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProfiles: 0,
    pendingEntries: 0,
    pendingUsers: 0,
    activeWorkers: 0,
    totalHoursThisWeek: 0,
    avgQualityThisWeek: 0,
    weeklyEarnings: 0,
    lifetimeEarnings: 0,
  });
  const [rankings, setRankings] = useState<WorkerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, rankingsRes] = await Promise.allSettled([
        adminApi.getWorkerStats(),
        adminApi.getRankedProfiles(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success && statsRes.value.data) {
        setStats(statsRes.value.data);
      }

      if (rankingsRes.status === 'fulfilled' && rankingsRes.value.success && rankingsRes.value.data) {
        // Filter to only include paid earnings in rankings
        const rankedData = (Array.isArray(rankingsRes.value.data) ? rankingsRes.value.data : [])
          .map((worker: any) => ({
            ...worker,
            weeklyEarnings: worker.weeklyEarnings || 0, // already filtered on backend if correct
          }));
        setRankings(rankedData);
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return 'bg-yellow-500';
    if (index === 1) return 'bg-gray-400';
    if (index === 2) return 'bg-amber-600';
    return 'bg-blue-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate total paid earnings across all workers (only paid weeks)
  const totalPaidEarnings = rankings.reduce((sum, r) => sum + (r.weeklyEarnings || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Monitor worker performance and manage operations
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Users</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stats.totalUsers}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {stats.activeWorkers} active this week
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Profiles</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stats.totalProfiles}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Client accounts managed
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pending Entries</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stats.pendingEntries}
                </p>
                <p className="text-xs mt-1 text-yellow-600 font-medium">
                  Awaiting review
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center">
                <FileText className="w-7 h-7 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pending Users</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stats.pendingUsers}
                </p>
                <p className="text-xs mt-1 text-orange-600 font-medium">
                  Awaiting approval
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
                <UserCheck className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings & Performance Overview - Only Paid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Earnings (This Week)
                </p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(stats.weeklyEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Lifetime Earnings
                </p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(stats.lifetimeEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Paid Hours (This Week)
                </p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatTime(stats.totalHoursThisWeek)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Avg Paid Quality
                </p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatPercentage(stats.avgQualityThisWeek)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/admin/pending" className="block">
              <div className="p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors border-2 border-orange-200 hover:border-orange-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">Approve Users</p>
                      <p className="text-sm text-orange-700">{stats.pendingUsers} pending</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/admin/entries" className="block">
              <div className="p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors border-2 border-yellow-200 hover:border-yellow-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-900">Vet Entries</p>
                      <p className="text-sm text-yellow-700">{stats.pendingEntries} to review</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/admin/profiles/new" className="block">
              <div className="p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors border-2 border-green-200 hover:border-green-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Create Profile</p>
                      <p className="text-sm text-green-700">Add new client</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/admin/users" className="block">
              <div className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors border-2 border-blue-200 hover:border-blue-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Manage Users</p>
                      <p className="text-sm text-blue-700">{stats.totalUsers} users</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Worker Leaderboard - Only paid earnings */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Worker Leaderboard (Paid Earnings)
              </CardTitle>
              <Link href="/dashboard/admin/rankings" className="text-sm font-medium hover:underline" style={{ color: 'var(--accent-color)' }}>
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {rankings.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No ranking data available yet</p>
                <p className="text-sm mt-2">Workers will appear here once paid entries are processed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankings.slice(0, 5).map((worker, index) => (
                  <div
                    key={worker._id}
                    className="flex items-center gap-4 p-3 rounded-xl transition-all hover:shadow-md"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    {/* Rank Badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getRankBadgeColor(index)}`}>
                      {index < 3 ? (
                        <Star className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Worker Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {worker.name || 'Unknown Worker'}
                      </p>
                      <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                        {worker.email || 'N/A'}
                      </p>
                    </div>

                    {/* Stats - Only paid */}
                    <div className="hidden lg:flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatTime(worker.totalTime)}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatPercentage(worker.avgQuality)}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">Quality</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-600">
                          {formatCurrency(worker.weeklyEarnings)}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">Paid Earnings</p>
                      </div>
                    </div>

                    {/* Overall Score */}
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getScoreColor(worker.overallScore || 0)}`}>
                        {worker.overallScore?.toFixed(1) || '0.0'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Score</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}