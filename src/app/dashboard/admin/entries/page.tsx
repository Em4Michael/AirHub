'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin.api';
import { Entry } from '@/types';
import { formatDate, formatTime, formatPercentage } from '@/lib/utils/format';
import { 
  CheckCircle, Clock, Award, Calendar, User, FileText, 
  Filter, Search, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';

export default function AdminEntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [vetData, setVetData] = useState({
    adminTime: '',
    adminQuality: '',
    adminNotes: '',
  });
  const [vetting, setVetting] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEntries();
  }, [page, filter]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const approved = filter === 'all' ? undefined : filter === 'approved';
      const response = await adminApi.getAllEntries(page, 20, approved);
      if (response.success && response.data) {
        setEntries(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleVetEntry = (entry: Entry) => {
    setSelectedEntry(entry);
    setVetData({
      adminTime: entry.time.toString(),
      adminQuality: entry.quality.toString(),
      adminNotes: '',
    });
  };

  const handleSubmitVet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    setVetting(true);
    try {
      await adminApi.vetEntry({
        entryId: selectedEntry._id,
        adminTime: parseFloat(vetData.adminTime),
        adminQuality: parseFloat(vetData.adminQuality),
        adminNotes: vetData.adminNotes,
      });
      setSelectedEntry(null);
      fetchEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to vet entry');
    } finally {
      setVetting(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const workerName = typeof entry.worker === 'object' ? entry.worker.name : '';
    const profileName = typeof entry.profile === 'object' ? entry.profile.fullName : '';
    return workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           profileName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const pendingCount = entries.filter(e => !e.adminApproved).length;

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Entries
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Review and approve worker entries
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>

          {/* Filter */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => { setFilter('pending'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'pending' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: filter === 'pending' ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color: filter === 'pending' ? 'white' : 'var(--text-secondary)'
              }}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => { setFilter('approved'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-r`}
              style={{ 
                backgroundColor: filter === 'approved' ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color: filter === 'approved' ? 'white' : 'var(--text-secondary)',
                borderColor: 'var(--border-color)'
              }}
            >
              Approved
            </button>
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors`}
              style={{ 
                backgroundColor: filter === 'all' ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color: filter === 'all' ? 'white' : 'var(--text-secondary)'
              }}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>
              {filter === 'pending' ? 'No pending entries to review' : 'No entries found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Card key={entry._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Date & Status */}
                  <div className="flex items-center gap-4 lg:w-48">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <Calendar className="w-6 h-6" style={{ color: 'var(--accent-color)' }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(entry.date)}
                      </p>
                      <Badge variant={entry.adminApproved ? 'success' : 'warning'}>
                        {entry.adminApproved ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {/* Worker & Profile */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                        Worker
                      </p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {typeof entry.worker === 'object' ? entry.worker.name : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                        Profile
                      </p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {typeof entry.profile === 'object' ? entry.profile.fullName : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatTime(entry.adminTime || entry.time)}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hours</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Award className="w-4 h-4 text-green-500" />
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatPercentage(entry.adminQuality || entry.quality)}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quality</p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="lg:w-32">
                    {!entry.adminApproved ? (
                      <Button 
                        onClick={() => handleVetEntry(entry)}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Vet
                      </Button>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Approved by
                        </p>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {typeof entry.adminApprovedBy === 'object' 
                            ? entry.adminApprovedBy.name 
                            : 'Admin'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {(entry.notes || entry.adminNotes) && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    {entry.notes && (
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <strong>Worker Notes:</strong> {entry.notes}
                      </p>
                    )}
                    {entry.adminNotes && (
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        <strong>Admin Notes:</strong> {entry.adminNotes}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Vet Entry Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Vet Entry"
        size="md"
      >
        {selectedEntry && (
          <form onSubmit={handleSubmitVet} className="space-y-5">
            {/* Entry Summary */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Date</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(selectedEntry.date)}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Worker</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {typeof selectedEntry.worker === 'object' ? selectedEntry.worker.name : 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Submitted Time</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatTime(selectedEntry.time)}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Submitted Quality</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatPercentage(selectedEntry.quality)}
                  </p>
                </div>
              </div>
              {selectedEntry.notes && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Notes</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedEntry.notes}</p>
                </div>
              )}
            </div>

            {/* Admin Values */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Verified Time (hours)
                </label>
                <input
                  type="number"
                  value={vetData.adminTime}
                  onChange={(e) => setVetData({ ...vetData, adminTime: e.target.value })}
                  className="input"
                  required
                  step="0.01"
                  min="0"
                  max="24"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Verified Quality (%)
                </label>
                <input
                  type="number"
                  value={vetData.adminQuality}
                  onChange={(e) => setVetData({ ...vetData, adminQuality: e.target.value })}
                  className="input"
                  required
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Admin Notes (Optional)
              </label>
              <textarea
                value={vetData.adminNotes}
                onChange={(e) => setVetData({ ...vetData, adminNotes: e.target.value })}
                rows={3}
                className="input resize-none"
                placeholder="Add notes about this entry..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={vetting} className="flex-1">
                <CheckCircle className="w-4 h-4" />
                Approve Entry
              </Button>
              <Button type="button" variant="outline" onClick={() => setSelectedEntry(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}