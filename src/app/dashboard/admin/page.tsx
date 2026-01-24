'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { adminApi } from '@/lib/api/admin.api';
import { formatTime, formatPercentage, formatDate } from '@/lib/utils/format';
import { 
  Users, Briefcase, FileText, TrendingUp, Trophy, Clock, 
  Award, UserCheck, CheckCircle, Plus, ArrowRight, Activity,
  AlertTriangle, Star
} from 'lucide-react';

interface WorkerRanking {
  _id: string;
  name: string;
  email: string;
  totalTime: number;
  avgQuality: number;
  overallScore: number;
  entriesCount: number;
  trend?: 'up' | 'down' | 'stable';
}

interface DashboardStats {
  totalUsers: number;
  totalProfiles: number;
  pendingEntries: number;
  pendingUsers: number;
  activeWorkers: number;
  totalHoursThisWeek: number;
  avgQualityThisWeek: number;
}

interface RecentActivity {
  _id: string;
  type: 'entry' | 'user' | 'profile';
  description: string;
  timestamp: string;
  user?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rankings, setRankings] = useState<WorkerRanking[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, rankingsRes] = await Promise.all([
        adminApi.getWorkerStats(),
        adminApi.getRankedProfiles(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (rankingsRes.success && rankingsRes.data) {
        setRankings(rankingsRes.data);
      }

      // Mock recent activity - replace with actual API call
      setRecentActivity([
        { _id: '1', type: 'entry', description: 'John Worker submitted entry for Profile A', timestamp: new Date().toISOString(), user: 'John Worker' },
        { _id: '2', type: 'user', description: 'New user registration: Jane Doe', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { _id: '3', type: 'profile', description: 'Profile "Client XYZ" was updated', timestamp: new Date(Date.now() - 7200000).toISOString() },
      ]);
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
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Monitor worker performance and manage operations
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/profiles/new">
            <button className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Create Profile
            </button>
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stats Cards */}
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
                  {stats?.activeWorkers || 0} active this week
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
                  {stats?.pendingEntries || 0}
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
                  {stats?.pendingUsers || 0}
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

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Total Hours This Week
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatTime(stats?.totalHoursThisWeek || 0)}
                </p>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div 
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${Math.min((stats?.totalHoursThisWeek || 0) / 200 * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Target: 200 hours/week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Average Quality Score
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatPercentage(stats?.avgQualityThisWeek || 0)}
                </p>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div 
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${stats?.avgQualityThisWeek || 0}%` }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Target: 85% quality
            </p>
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
            <Link href="/admin/pending" className="block">
              <div className="p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors border-2 border-orange-200 hover:border-orange-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">Approve Users</p>
                      <p className="text-sm text-orange-700">{stats?.pendingUsers || 0} pending</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </Link>

            <Link href="/admin/entries" className="block">
              <div className="p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors border-2 border-yellow-200 hover:border-yellow-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-900">Vet Entries</p>
                      <p className="text-sm text-yellow-700">{stats?.pendingEntries || 0} to review</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </Link>

            <Link href="/admin/profiles/new" className="block">
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

            <Link href="/admin/users" className="block">
              <div className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors border-2 border-blue-200 hover:border-blue-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Manage Users</p>
                      <p className="text-sm text-blue-700">{stats?.totalUsers || 0} users</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-500" />
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
              <Link href="/admin/rankings" className="text-sm font-medium hover:underline" style={{ color: 'var(--accent-color)' }}>
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
                        {worker.name}
                      </p>
                      <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                        {worker.email}
                      </p>
                    </div>

                    {/* Stats */}
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

                    {/* Overall Score */}
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

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-opacity-50"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'entry' ? 'bg-blue-100' :
                    activity.type === 'user' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {activity.type === 'entry' ? (
                      <FileText className="w-4 h-4 text-blue-600" />
                    ) : activity.type === 'user' ? (
                      <Users className="w-4 h-4 text-green-600" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {activity.description}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}