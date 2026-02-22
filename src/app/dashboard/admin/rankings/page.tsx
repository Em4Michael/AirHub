'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { adminApi } from '@/lib/api/admin.api';
import { formatTime, formatPercentage, formatCurrency } from '@/lib/utils/format';
import { Trophy, TrendingUp, TrendingDown, Star, Award, Clock, Target, DollarSign, Wallet } from 'lucide-react';

interface WorkerRanking {
  _id: string;
  name: string;
  email: string;
  totalTime: number;
  avgQuality: number;
  overallScore: number;
  entryCount: number;
  weeklyEarnings: number; // now only paid
  trend?: 'up' | 'down' | 'stable';
}

interface WorkerPerformance {
  totalHours: number;
  avgQuality: number;
  entryCount: number;
  totalEarnings: number; // now only paid
}

interface WorkerEarnings {
  weekly: WorkerPerformance;
  lifetime: WorkerPerformance;
}

export default function AdminRankingsPage() {
  const [rankings, setRankings] = useState<WorkerRanking[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [workerEarnings, setWorkerEarnings] = useState<WorkerEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const response = await adminApi.getRankedProfiles();
      if (response.success && response.data) {
        // Ensure only paid earnings are shown
        const rankedData = (Array.isArray(response.data) ? response.data : []).map((worker: any) => ({
          ...worker,
          weeklyEarnings: worker.weeklyEarnings || 0,
        }));
        setRankings(rankedData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerEarnings = async (workerId: string) => {
    try {
      setLoadingEarnings(true);
      const response = await adminApi.getUserStats(workerId);
      if (response.success && response.data) {
        // Only use paid earnings
        setWorkerEarnings({
          weekly: {
            ...response.data.weekly,
            totalEarnings: response.data.weekly.totalEarnings || 0,
          },
          lifetime: {
            ...response.data.lifetime,
            totalEarnings: response.data.lifetime.totalEarnings || 0,
          },
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch worker earnings:', err);
    } finally {
      setLoadingEarnings(false);
    }
  };

  const handleWorkerClick = (workerId: string) => {
    if (selectedWorker === workerId) {
      setSelectedWorker(null);
      setWorkerEarnings(null);
    } else {
      setSelectedWorker(workerId);
      fetchWorkerEarnings(workerId);
    }
  };

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-500';
    if (index === 2) return 'bg-gradient-to-br from-amber-600 to-amber-800';
    return 'bg-gradient-to-br from-blue-500 to-blue-700';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTierBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'success' as const };
    if (score >= 70) return { label: 'Good', variant: 'info' as const };
    if (score >= 60) return { label: 'Average', variant: 'warning' as const };
    return { label: 'Below Target', variant: 'danger' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalPaidWeeklyEarnings = rankings.reduce((sum, r) => sum + (r.weeklyEarnings || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Performance Rankings
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
          Top performing workers based on earnings and quality scores
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Stats - Only Paid */}
      {rankings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Top Performer</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {rankings[0]?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Hours</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatTime(rankings.reduce((sum, r) => sum + (r.totalTime || 0), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Avg Quality</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatPercentage(rankings.reduce((sum, r) => sum + (r.avgQuality || 0), 0) / rankings.length)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Earnings</p>
                  <p className="font-bold text-emerald-600">
                    {formatCurrency(totalPaidWeeklyEarnings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold mb-2">No ranking data available</p>
              <p className="text-sm">Entries will appear here once processed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((worker, index) => (
                <div key={worker._id}>
                  <div
                    onClick={() => handleWorkerClick(worker._id)}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md cursor-pointer"
                    style={{ backgroundColor: selectedWorker === worker._id ? 'var(--bg-secondary)' : 'var(--bg-tertiary)' }}
                  >
                    {/* Rank Badge */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${getRankBadgeColor(index)}`}>
                      {index < 3 ? (
                        <Star className="w-7 h-7" fill="currentColor" />
                      ) : (
                        <span className="text-xl">#{index + 1}</span>
                      )}
                    </div>

                    {/* Worker Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                          {worker.name || 'Unknown Worker'}
                        </p>
                        {index === 0 && (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Top
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                        {worker.email || 'N/A'}
                      </p>
                    </div>

                    {/* Stats - Only paid */}
                    <div className="hidden md:grid grid-cols-4 gap-3">
                      <div className="text-center px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Hours</p>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {formatTime(worker.totalTime || 0)}
                        </p>
                      </div>
                      <div className="text-center px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Quality</p>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {formatPercentage(worker.avgQuality || 0)}
                        </p>
                      </div>
                      <div className="text-center px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Entries</p>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {worker.entryCount || 0}
                        </p>
                      </div>
                      <div className="text-center px-3 py-2 rounded-lg bg-emerald-50">
                        <p className="text-xs font-medium mb-1 text-emerald-700">Paid</p>
                        <p className="font-bold text-sm text-emerald-600">
                          {formatCurrency(worker.weeklyEarnings || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Score & Tier */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <p className={`text-2xl font-bold ${getScoreColor(worker.overallScore || 0)}`}>
                          {worker.overallScore?.toFixed(1) || '0.0'}
                        </p>
                        {worker.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {worker.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
                      </div>
                      <Badge variant={getTierBadge(worker.overallScore || 0).variant}>
                        {getTierBadge(worker.overallScore || 0).label}
                      </Badge>
                    </div>
                  </div>

                  {/* Expanded Earnings Details - Only Paid */}
                  {selectedWorker === worker._id && (
                    <div className="mt-2 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      {loadingEarnings ? (
                        <div className="flex items-center justify-center py-4">
                          <Spinner size="sm" />
                        </div>
                      ) : workerEarnings ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Weekly Paid */}
                          <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <DollarSign className="w-5 h-5 text-blue-600" />
                              <h4 className="font-bold text-blue-900">Weekly Performance</h4>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-blue-700">Hours Worked:</span>
                                <span className="font-semibold text-blue-900">{formatTime(workerEarnings.weekly.totalHours)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-blue-700">Avg Quality:</span>
                                <span className="font-semibold text-blue-900">{formatPercentage(workerEarnings.weekly.avgQuality)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-blue-700">Entries:</span>
                                <span className="font-semibold text-blue-900">{workerEarnings.weekly.entryCount}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t-2 border-blue-300">
                                <span className="text-sm font-bold text-blue-700">Earnings:</span>
                                <span className="font-bold text-lg text-emerald-600">
                                  {formatCurrency(workerEarnings.weekly.totalEarnings)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Lifetime Paid */}
                          <div className="p-4 rounded-lg bg-purple-50 border-2 border-purple-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Wallet className="w-5 h-5 text-purple-600" />
                              <h4 className="font-bold text-purple-900">Lifetime  Performance</h4>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-purple-700">Total Hours:</span>
                                <span className="font-semibold text-purple-900">{formatTime(workerEarnings.lifetime.totalHours)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-purple-700">Avg Quality:</span>
                                <span className="font-semibold text-purple-900">{formatPercentage(workerEarnings.lifetime.avgQuality)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-purple-700">Total Entries:</span>
                                <span className="font-semibold text-purple-900">{workerEarnings.lifetime.entryCount}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t-2 border-purple-300">
                                <span className="text-sm font-bold text-purple-700">Total  Earnings:</span>
                                <span className="font-bold text-lg text-emerald-600">
                                  {formatCurrency(workerEarnings.lifetime.totalEarnings)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                          Failed to load earnings data
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Distribution - unchanged */}
      {rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-green-50">
                <p className="text-3xl font-bold text-green-600">
                  {rankings.filter(r => (r.overallScore || 0) >= 80).length}
                </p>
                <p className="text-sm font-medium text-green-700 mt-1">Excellent (≥80%)</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-50">
                <p className="text-3xl font-bold text-blue-600">
                  {rankings.filter(r => (r.overallScore || 0) >= 70 && (r.overallScore || 0) < 80).length}
                </p>
                <p className="text-sm font-medium text-blue-700 mt-1">Good (70-79%)</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-yellow-50">
                <p className="text-3xl font-bold text-yellow-600">
                  {rankings.filter(r => (r.overallScore || 0) >= 60 && (r.overallScore || 0) < 70).length}
                </p>
                <p className="text-sm font-medium text-yellow-700 mt-1">Average (60-69%)</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-red-50">
                <p className="text-3xl font-bold text-red-600">
                  {rankings.filter(r => (r.overallScore || 0) < 60).length}
                </p>
                <p className="text-sm font-medium text-red-700 mt-1">Below (&lt;60%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}