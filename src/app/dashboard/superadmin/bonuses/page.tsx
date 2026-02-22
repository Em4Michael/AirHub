'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin.api';
import { superadminApi } from '@/lib/api/superadmin.api';
import { User } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  DollarSign, Plus, Search, Star, RotateCcw,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle,
} from 'lucide-react';

interface BonusForm { amount: string; reason: string; }

export default function SuperadminBonusesPage() {
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [bonusTarget, setBonusTarget] = useState<User | null>(null);
  const [bonusForm, setBonusForm]     = useState<BonusForm>({ amount: '', reason: '' });
  const [savingBonus, setSavingBonus] = useState(false);

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetting, setResetting]     = useState(false);

  useEffect(() => { fetchUsers(); }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllUsers(page, 20);
      if (response.success && response.data) {
        const flat = Array.isArray(response.data)
          ? (response.data.flat(Infinity) as User[])
          : [];
        const workerUsers = flat.filter(
          (u) => u.role === 'user' && (u.status === 'approved' || u.isApproved)
        );
        setUsers(workerUsers);
        if (response.pagination) setTotalPages(response.pagination.pages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBonus = async () => {
    if (!bonusTarget) return;
    const amount = parseFloat(bonusForm.amount);
    if (isNaN(amount) || amount <= 0) { setError('Please enter a valid bonus amount'); return; }
    if (!bonusForm.reason.trim()) { setError('Please provide a reason for the bonus'); return; }
    setSavingBonus(true);
    setError('');
    try {
      await superadminApi.addExtraBonus(bonusTarget._id, { amount, reason: bonusForm.reason.trim() });
      setSuccess(`Bonus of ${formatCurrency(amount)} added to ${bonusTarget.name}`);
      setBonusTarget(null);
      setBonusForm({ amount: '', reason: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add bonus');
    } finally { setSavingBonus(false); }
  };

  const handleResetBonus = async () => {
    if (!resetTarget) return;
    setResetting(true);
    setError('');
    try {
      await superadminApi.resetExtraBonus(resetTarget._id);
      setSuccess(`Bonus reset for ${resetTarget.name}`);
      setResetTarget(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset bonus');
    } finally { setResetting(false); }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalBonusAmount = filtered.reduce((sum, u) => sum + (u.extraBonus || 0), 0);
  const usersWithBonus   = filtered.filter((u) => u.extraBonus && u.extraBonus > 0);

  if (loading && users.length === 0) {
    return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Bonus Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Add or reset extra bonuses for approved workers
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search workers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full md:w-64"
          />
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Summary banner */}
      {usersWithBonus.length > 0 && (
        <div className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3"
          style={{ backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}>
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-700">
              {usersWithBonus.length} worker{usersWithBonus.length !== 1 ? 's' : ''} have pending bonuses
            </p>
            <p className="text-sm text-green-600">
              Total outstanding: <strong>{formatCurrency(totalBonusAmount)}</strong> — these will be included in the next payment run
            </p>
          </div>
        </div>
      )}

      {/* Worker cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center">
                <p style={{ color: 'var(--text-muted)' }}>No approved workers found.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filtered.map((user) => {
            const hasBonus = user.extraBonus && user.extraBonus > 0;
            return (
              <Card key={user._id} className={`hover:shadow-lg transition-shadow ${hasBonus ? 'ring-2 ring-green-200' : ''}`}>
                <CardContent className="p-5">
                  {/* User info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: 'var(--accent-color)' }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                      <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                    <Badge variant="primary">WORKER</Badge>
                  </div>

                  {/* Bonus display */}
                  <div className={`p-3 rounded-xl mb-4 ${hasBonus ? 'bg-green-50 border-2 border-green-200' : 'border'}`}
                    style={{ borderColor: hasBonus ? undefined : 'var(--border-color)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className={`w-4 h-4 ${hasBonus ? 'text-green-600' : 'text-gray-400'}`} />
                      <p className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: hasBonus ? '#166534' : 'var(--text-muted)' }}>
                        Extra Bonus
                      </p>
                      {hasBonus && <Badge variant="success" className="ml-auto text-xs">Pending Payment</Badge>}
                    </div>
                    <p className={`text-2xl font-bold ${hasBonus ? 'text-green-600' : ''}`}
                      style={{ color: hasBonus ? undefined : 'var(--text-muted)' }}>
                      {hasBonus ? formatCurrency(user.extraBonus!) : '₦0 — No bonus'}
                    </p>
                    {hasBonus && user.extraBonusReason && (
                      <p className="text-xs mt-1 text-green-700 italic">"{user.extraBonusReason}"</p>
                    )}
                    {hasBonus && (
                      <p className="text-xs mt-2 text-green-600">
                        Will be included in next payment run
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setBonusTarget(user);
                        setBonusForm({ amount: '', reason: '' });
                        setError('');
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      {hasBonus ? 'Update Bonus' : 'Add Bonus'}
                    </Button>
                    {hasBonus && (
                      <Button size="sm" variant="outline" onClick={() => setResetTarget(user)} title="Reset bonus to zero">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
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

      {/* ── Add / Update Bonus Modal ─────────────────────────────── */}
      <Modal isOpen={!!bonusTarget} onClose={() => setBonusTarget(null)} title="Add Extra Bonus" size="sm">
        {bonusTarget && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: 'var(--accent-color)' }}>
                {bonusTarget.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{bonusTarget.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{bonusTarget.email}</p>
              </div>
            </div>

            {bonusTarget.extraBonus && bonusTarget.extraBonus > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  Current bonus: <strong>{formatCurrency(bonusTarget.extraBonus)}</strong>.
                  The new amount will be <strong>added</strong> to the existing bonus.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Bonus Amount (₦)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  value={bonusForm.amount}
                  onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })}
                  className="input pl-10"
                  placeholder="5000"
                  min="1"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Reason <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(required)</span>
              </label>
              <textarea
                value={bonusForm.reason}
                onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })}
                rows={3}
                className="input resize-none"
                placeholder="e.g. Outstanding performance in Q1…"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddBonus} isLoading={savingBonus} className="flex-1">
                <Star className="w-4 h-4" />Add Bonus
              </Button>
              <Button variant="outline" onClick={() => setBonusTarget(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reset Confirm Modal ───────────────────────────────────── */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Bonus" size="sm">
        <div className="space-y-5">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="text-center">
            <p style={{ color: 'var(--text-primary)' }}>
              Reset bonus for <strong>{resetTarget?.name}</strong>?
            </p>
            {resetTarget?.extraBonus && (
              <p className="text-sm font-semibold text-orange-600 mt-1">
                {formatCurrency(resetTarget.extraBonus)} will be cleared
              </p>
            )}
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              This sets their extra bonus to ₦0. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleResetBonus} isLoading={resetting} className="flex-1">
              Reset to ₦0
            </Button>
            <Button variant="outline" onClick={() => setResetTarget(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}