'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin.api';
import { Entry } from '@/types';
import { formatDate, formatTime, formatPercentage } from '@/lib/utils/format';
import {
  CheckCircle, Clock, Award, Calendar, FileText,
  Search, ChevronLeft, ChevronRight, Trash2, AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function AdminEntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [vetData, setVetData] = useState({ adminTime: '', adminQuality: '', adminNotes: '' });
  const [vetting, setVetting] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Delete state ────────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchEntries(); }, [page, filter]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const approved = filter === 'all' ? undefined : filter === 'approved';
      const response = await adminApi.getAllEntries(page, 20, approved);
      if (response.success && response.data) {
        setEntries(response.data);
        if (response.pagination) setTotalPages(response.pagination.pages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleVetEntry = (entry: Entry) => {
    setSelectedEntry(entry);
    setVetData({ adminTime: entry.time.toString(), adminQuality: entry.quality.toString(), adminNotes: '' });
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
      setSuccess('Entry approved successfully');
      fetchEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to vet entry');
    } finally {
      setVetting(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await adminApi.deleteEntry(deleteConfirm._id);
      setEntries((prev) => prev.filter((e) => e._id !== deleteConfirm._id));
      setDeleteConfirm(null);
      setSuccess('Entry deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete entry');
    } finally {
      setDeleting(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const workerName = typeof entry.worker === 'object' ? entry.worker.name : '';
    const profileName = typeof entry.profile === 'object' ? entry.profile.fullName : '';
    const q = searchQuery.toLowerCase();
    return workerName.toLowerCase().includes(q) || profileName.toLowerCase().includes(q);
  });

  const pendingCount = entries.filter((e) => !e.adminApproved).length;

  if (loading && entries.length === 0) {
    return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Entries</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Review and approve worker entries</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by worker or profile…" leftIcon={<Search className="w-5 h-5" />} />
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
            {(['pending', 'approved', 'all'] as const).map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: filter === f ? 'var(--accent-color)' : 'var(--bg-secondary)',
                  color: filter === f ? 'white' : 'var(--text-secondary)',
                  borderRight: f !== 'all' ? '1px solid var(--border-color)' : undefined,
                }}>
                {f === 'pending' ? `Pending (${pendingCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

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
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(entry.date)}</p>
                      <Badge variant={entry.adminApproved ? 'success' : 'warning'}>
                        {entry.adminApproved ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {/* Worker & Profile */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Worker</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {typeof entry.worker === 'object' ? entry.worker.name : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Profile</p>
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
                          {formatTime(entry.adminTime ?? entry.time)}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hours</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Award className="w-4 h-4 text-green-500" />
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatPercentage(entry.adminQuality ?? entry.quality)}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quality</p>
                    </div>
                  </div>

                  {/* Actions — vet button + delete button */}
                  <div className="flex items-center gap-2 lg:w-auto">
                    <div className="lg:w-32">
                      {!entry.adminApproved ? (
                        <Button onClick={() => handleVetEntry(entry)} className="w-full" size="sm">
                          <CheckCircle className="w-4 h-4" />
                          Vet
                        </Button>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Approved by</p>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {typeof entry.approvedBy === 'object' ? (entry.approvedBy as any).name : 'Admin'}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Delete — always visible regardless of approval status */}
                    <button
                      onClick={() => setDeleteConfirm(entry)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

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

      {/* ── Vet Modal ──────────────────────────────────────────────────────── */}
      <Modal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} title="Vet Entry" size="md">
        {selectedEntry && (
          <form onSubmit={handleSubmitVet} className="space-y-5">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Date</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedEntry.date)}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Worker</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {typeof selectedEntry.worker === 'object' ? selectedEntry.worker.name : 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Submitted Time</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatTime(selectedEntry.time)}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Submitted Quality</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatPercentage(selectedEntry.quality)}</p>
                </div>
              </div>
              {selectedEntry.notes && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Worker Notes</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedEntry.notes}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Verified Time (hours)</label>
                <input type="number" value={vetData.adminTime}
                  onChange={(e) => setVetData({ ...vetData, adminTime: e.target.value })}
                  className="input" required step="0.01" min="0" max="24" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Verified Quality (%)</label>
                <input type="number" value={vetData.adminQuality}
                  onChange={(e) => setVetData({ ...vetData, adminQuality: e.target.value })}
                  className="input" required min="0" max="100" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Admin Notes (Optional)</label>
              <textarea value={vetData.adminNotes}
                onChange={(e) => setVetData({ ...vetData, adminNotes: e.target.value })}
                rows={3} className="input resize-none" placeholder="Add notes about this entry…" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={vetting} className="flex-1">
                <CheckCircle className="w-4 h-4" />Approve Entry
              </Button>
              <Button type="button" variant="outline" onClick={() => setSelectedEntry(null)} className="flex-1">Cancel</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Entry" size="sm">
        <div className="space-y-5">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Delete this entry?</p>
            {deleteConfirm && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {typeof deleteConfirm.worker === 'object' ? deleteConfirm.worker.name : 'Worker'} ·{' '}
                {formatDate(deleteConfirm.date)} ·{' '}
                {formatTime(deleteConfirm.adminTime ?? deleteConfirm.time)}
              </p>
            )}
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              This cannot be undone. If already approved, the worker's weekly payment totals may change.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDeleteEntry} isLoading={deleting} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}