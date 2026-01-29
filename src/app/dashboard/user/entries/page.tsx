// ========================================
// FILE: src/app/user/entries/page.tsx
// My Entries Page with 70/30 Performance & Themed UI
// ========================================

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { userApi } from '@/lib/api/user.api';
import { Entry } from '@/types';
import { formatDate, formatTime, formatPercentage } from '@/lib/utils/format';
import { Plus, CheckCircle, Clock, Calendar, Briefcase, Info } from 'lucide-react';

export default function MyEntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEntries();
  }, [page]);

  const fetchEntries = async () => {
    try {
      const response = await userApi.getMyEntries(page, 20);
      if (response.success && response.data) {
        setEntries(response.data);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  // Calculate performance score (70% quality + 30% time normalized to 100)
  const calculatePerformanceScore = (entry: Entry): number => {
    // Normalize time to a 0-100 scale (assuming 8 hours = 100%)
    const timeNormalized = Math.min((entry.time / 8) * 100, 100);
    // Quality is already 0-100
    return (entry.quality * 0.7) + (timeNormalized * 0.3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6" style={{ minHeight: '100vh' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Entries
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            View and manage your work entries
          </p>
        </div>
        <Link href="/dashboard/user/entries/new">
          <Button className="btn-primary w-full sm:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            New Entry
          </Button>
        </Link>
      </div>

      {/* Performance Info Banner */}
      <div 
        className="card p-4 flex items-start gap-3"
        style={{ 
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: 'var(--accent-color)'
        }}
      >
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-color)' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Performance Calculation: 70% Quality + 30% Time
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Your overall score emphasizes quality (70%) while considering productivity (30%)
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Desktop Table View */}
      <div 
        className="hidden lg:block card overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Time (30%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Quality (70%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Overall
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p>No entries found. Create your first entry!</p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const performanceScore = calculatePerformanceScore(entry);
                  return (
                    <tr 
                      key={entry._id} 
                      className="transition-colors hover:bg-opacity-50"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(entry.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {typeof entry.profile === 'object' ? entry.profile.fullName : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatTime(entry.time)}
                        </div>
                        {entry.adminTime && entry.adminTime !== entry.time && (
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Admin: {formatTime(entry.adminTime)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatPercentage(entry.quality)}
                        </div>
                        {entry.adminQuality && entry.adminQuality !== entry.quality && (
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Admin: {formatPercentage(entry.adminQuality)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-12 h-2 rounded-full"
                            style={{ 
                              backgroundColor: 'var(--bg-tertiary)',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(performanceScore, 100)}%`,
                                backgroundColor: 
                                  performanceScore >= 80 ? '#10b981' :
                                  performanceScore >= 70 ? '#3b82f6' :
                                  performanceScore >= 60 ? '#f59e0b' : '#ef4444'
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {performanceScore.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.adminApproved ? (
                          <Badge variant="success">
                            <CheckCircle className="w-3 h-3 mr-1 inline" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="warning">
                            <Clock className="w-3 h-3 mr-1 inline" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {entry.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {entries.length === 0 ? (
          <div 
            className="card p-12 text-center"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <Briefcase className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No entries found. Create your first entry!</p>
          </div>
        ) : (
          entries.map((entry) => {
            const performanceScore = calculatePerformanceScore(entry);
            return (
              <div
                key={entry._id}
                className="card p-4"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  {entry.adminApproved ? (
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Profile:</span>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {typeof entry.profile === 'object' ? entry.profile.fullName : 'N/A'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Time (30%):</span>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatTime(entry.time)}</p>
                      {entry.adminTime && entry.adminTime !== entry.time && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Admin: {formatTime(entry.adminTime)}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Quality (70%):</span>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(entry.quality)}</p>
                      {entry.adminQuality && entry.adminQuality !== entry.quality && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Admin: {formatPercentage(entry.adminQuality)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div>
                    <span className="text-xs uppercase font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
                      Overall Performance:
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="flex-1 h-3 rounded-full"
                        style={{ 
                          backgroundColor: 'var(--bg-tertiary)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(performanceScore, 100)}%`,
                            backgroundColor: 
                              performanceScore >= 80 ? '#10b981' :
                              performanceScore >= 70 ? '#3b82f6' :
                              performanceScore >= 60 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {performanceScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {entry.notes && (
                    <div>
                      <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Notes:</span>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{entry.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            size="sm"
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}