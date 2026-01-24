'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { superadminApi } from '@/lib/api/superadmin.api';
import { adminApi } from '@/lib/api/admin.api';
import { formatTime, formatPercentage, formatDate, formatCurrency } from '@/lib/utils/format';
import { 
  Users, Briefcase, FileText, TrendingUp, Trophy, Clock, 
  Award, UserCheck, CheckCircle, Plus, ArrowRight, Activity,
  AlertTriangle, Star, Settings, Shield, DollarSign, BarChart3
} from 'lucide-react';

interface WorkerRanking {
  _id: string;
  name: string;
  email: string;
  totalTime: number;
  avgQuality: number;
  overallScore: number;
  entriesCount: number;
}

interface SystemStats {
  totalUsers: number;
  totalProfiles: number;
  pendingEntries: number;
  pendingUsers: number;
  activeWorkers: number;
  totalHoursThisWeek: number;
  avgQualityThisWeek: number;
  activeBenchmarks: number;
  totalBonuses: number;
  totalAdmins: number;
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [rankings, setRankings] = useState<WorkerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [systemStatsRes, workerStatsRes, rankingsRes] = await Promise.all([
        superadminApi.getSystemStats(),
        adminApi.getWorkerStats(),
        adminApi.getRankedProfiles(),
      ]);

      // Combine stats
      const combinedStats: SystemStats = {
        totalUsers: systemStatsRes.data?.totalUsers || workerStatsRes.data?.totalUsers || 0,
        totalProfiles: workerStatsRes.data?.totalProfiles || 0,
        pendingEntries: workerStatsRes.data?.pendingEntries || 0,
        pendingUsers: workerStatsRes.data?.pendingUsers || 0,
        activeWorkers: workerStatsRes.data?.activeWorkers || 0,
        totalHoursThisWeek: workerStatsRes.data?.totalHoursThisWeek || 0,
        avgQualityThisWeek: workerStatsRes.data?.avgQualityThisWeek || 0,
        activeBenchmarks: systemStatsRes.data?.activeBenchmarks || 0,
        totalBonuses: systemStatsRes.data?.totalBonuses || 0,
        totalAdmins: systemStatsRes.data?.totalAdmins || 0,
      };
      setStats(combinedStats);

      if (rankingsRes.success && rankingsRes.data) {
        setRankings(rankingsRes.data);
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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Superadmin Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            System overview and complete management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="danger" className="px-3 py-1.5">
            <Shield className="w-4 h-4 mr-1" />
            SUPERADMIN
          </Badge>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* System Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Users</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stats?.totalUsers || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {stats?.totalAdmins || 0} admins
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
                  {stats?.totalProfiles || 0}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Client accounts
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
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Active Benchmarks</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {stats?.activeBenchmarks || 0}
                </p>
                <p className="text-xs mt-1 text-green-600 font-medium">
                  Performance targets
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Bonuses</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(stats?.totalBonuses || 0)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Extra bonuses paid
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pending Users</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {stats?.pendingUsers || 0}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pending Entries</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {stats?.pendingEntries || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hours This Week</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatTime(stats?.totalHoursThisWeek || 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Avg Quality</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatPercentage(stats?.avgQualityThisWeek || 0)}
                </p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
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
              <Settings className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
              System Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/superadmin/benchmarks" className="block">
              <div className="p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors border-2 border-purple-200 hover:border-purple-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold text-purple-900">Manage Benchmarks</p>
                      <p className="text-sm text-purple-700">Set performance targets</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </Link>

            <Link href="/superadmin/bonuses" className="block">
              <div className="p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors border-2 border-yellow-200 hover:border-yellow-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-900">Manage Bonuses</p>
                      <p className="text-sm text-yellow-700">Add extra bonuses</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </Link>

            <Link href="/superadmin/pending" className="block">
              <div className="p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors border-2 border-orange-200 hover:border-orange-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">Pending Users</p>
                      <p className="text-sm text-orange-700">{stats?.pendingUsers || 0} awaiting</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </Link>

            <Link href="/superadmin/users" className="block">
              <div className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors border-2 border-blue-200 hover:border-blue-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">All Users</p>
                      <p className="text-sm text-blue-700">Manage & promote</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </Link>

            <Link href="/superadmin/entries" className="block">
              <div className="p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors border-2 border-green-200 hover:border-green-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">All Entries</p>
                      <p className="text-sm text-green-700">Review & vet</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Worker Leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Worker Leaderboard
              </CardTitle>
              <Link href="/superadmin/rankings" className="text-sm font-medium hover:underline" style={{ color: 'var(--accent-color)' }}>
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {rankings.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No ranking data available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankings.slice(0, 5).map((worker, index) => (
                  <div
                    key={worker._id}
                    className="flex items-center gap-4 p-3 rounded-xl transition-all hover:shadow-md"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getRankBadgeColor(index)}`}>
                      {index < 3 ? (
                        <Star className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {worker.name}
                      </p>
                      <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                        {worker.email}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatTime(worker.totalTime)}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatPercentage(worker.avgQuality)}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>Quality</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getScoreColor(worker.overallScore)}`}>
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

      {/* System Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-2xl font-bold text-green-600">Active</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>System Status</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>1.0.0</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Version</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>99.9%</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Uptime</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Production</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Environment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}