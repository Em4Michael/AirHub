'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { superadminApi } from '@/lib/api/superadmin.api';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import {
  Award, Plus, Trash2, Edit2, CheckCircle, AlertTriangle, DollarSign,
  ToggleLeft, ToggleRight, TrendingUp,
} from 'lucide-react';

const DEFAULT_HOURLY_RATE = 2000;

// ── Local Benchmark type extends the global one with fields our UI needs ───
// This avoids the "missing properties" TS error when global @/types/Benchmark
// doesn't have earningsMode or isCurrent yet.
interface Benchmark {
  _id: string;
  timeBenchmark: number;
  qualityBenchmark: number;
  startDate: string;
  endDate: string;
  payPerHour: number | null;
  earningsMode: 'flat' | 'score';
  thresholds: { excellent: number; good: number; average: number; minimum: number };
  bonusRates:  { excellent: number; good: number; average: number; minimum: number; below: number };
  isActive: boolean;
  isCurrent: boolean;
  createdBy?: { name: string; email: string };
  notes?: string;
  createdAt: string;
}

interface BenchmarkForm {
  timeBenchmark: string;
  qualityBenchmark: string;
  startDate: string;
  endDate: string;
  payPerHour: string;
  earningsMode: 'flat' | 'score';
  thresholdExcellent: string;
  thresholdGood: string;
  thresholdAverage: string;
  thresholdMinimum: string;
  rateExcellent: string;
  rateGood: string;
  rateAverage: string;
  rateMinimum: string;
  rateBelow: string;
  notes: string;
}

const emptyForm: BenchmarkForm = {
  timeBenchmark: '',
  qualityBenchmark: '',
  startDate: '',
  endDate: '',
  payPerHour: '',
  earningsMode: 'flat',
  thresholdExcellent: '80',
  thresholdGood: '70',
  thresholdAverage: '60',
  thresholdMinimum: '50',
  rateExcellent: '1.2',
  rateGood: '1.1',
  rateAverage: '1.0',
  rateMinimum: '0.9',
  rateBelow: '0.8',
  notes: '',
};

export default function SuperadminBenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Benchmark | null>(null);
  const [form, setForm]             = useState<BenchmarkForm>(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Benchmark | null>(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => { fetchBenchmarks(); }, []);

  const fetchBenchmarks = async () => {
    try {
      setLoading(true);
      const res = await superadminApi.getBenchmarks(1, 50);
      if (res.success && res.data) {
        // Cast to local Benchmark[] — server returns earningsMode/isCurrent
        // which the global @/types Benchmark may not yet declare
        setBenchmarks((Array.isArray(res.data) ? res.data : []) as unknown as Benchmark[]);
      } else {
        setError('Failed to load benchmarks');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load benchmarks');
    } finally { setLoading(false); }
  };

  const openCreate = () => { setForm(emptyForm); setShowCreate(true); setError(''); };
  const openEdit   = (b: Benchmark) => {
    setEditTarget(b);
    setForm({
      timeBenchmark:    String(b.timeBenchmark),
      qualityBenchmark: String(b.qualityBenchmark),
      startDate:        b.startDate.split('T')[0],
      endDate:          b.endDate.split('T')[0],
      payPerHour:       b.payPerHour ? String(b.payPerHour) : '',
      earningsMode:     b.earningsMode || 'flat',
      thresholdExcellent: String(b.thresholds?.excellent ?? 80),
      thresholdGood:      String(b.thresholds?.good      ?? 70),
      thresholdAverage:   String(b.thresholds?.average   ?? 60),
      thresholdMinimum:   String(b.thresholds?.minimum   ?? 50),
      rateExcellent: String(b.bonusRates?.excellent ?? 1.2),
      rateGood:      String(b.bonusRates?.good      ?? 1.1),
      rateAverage:   String(b.bonusRates?.average   ?? 1.0),
      rateMinimum:   String(b.bonusRates?.minimum   ?? 0.9),
      rateBelow:     String(b.bonusRates?.below     ?? 0.8),
      notes:         b.notes || '',
    });
    setError('');
  };

  const handleSave = async () => {
    if (!form.timeBenchmark || !form.qualityBenchmark || !form.startDate || !form.endDate) {
      setError('Please fill in all required fields'); return;
    }
    setSaving(true); setError('');
    try {
      const payload: any = {
        timeBenchmark:    parseFloat(form.timeBenchmark),
        qualityBenchmark: parseFloat(form.qualityBenchmark),
        startDate:  form.startDate,
        endDate:    form.endDate,
        payPerHour: form.payPerHour ? parseFloat(form.payPerHour) : null,
        earningsMode: form.earningsMode,
        notes: form.notes || undefined,
      };

      if (form.earningsMode === 'score') {
        payload.thresholds = {
          excellent: parseFloat(form.thresholdExcellent),
          good:      parseFloat(form.thresholdGood),
          average:   parseFloat(form.thresholdAverage),
          minimum:   parseFloat(form.thresholdMinimum),
        };
        payload.bonusRates = {
          excellent: parseFloat(form.rateExcellent),
          good:      parseFloat(form.rateGood),
          average:   parseFloat(form.rateAverage),
          minimum:   parseFloat(form.rateMinimum),
          below:     parseFloat(form.rateBelow),
        };
      }

      if (editTarget) {
        await superadminApi.updateBenchmark(editTarget._id, payload);
        setSuccess('Benchmark updated'); setEditTarget(null);
      } else {
        await superadminApi.createBenchmark(payload);
        setSuccess('Benchmark created'); setShowCreate(false);
      }
      fetchBenchmarks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save benchmark');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await superadminApi.deleteBenchmark(deleteTarget._id);
      setSuccess('Benchmark deleted'); setDeleteTarget(null); fetchBenchmarks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete benchmark');
    } finally { setDeleting(false); }
  };

  const effectiveRate = (b: Benchmark) =>
    b.payPerHour || parseInt(process.env.NEXT_PUBLIC_HOURLY_RATE || '') || DEFAULT_HOURLY_RATE;

  const previewEarnings = (b: Benchmark) => {
    const rate = effectiveRate(b);
    const hours = 40;
    if (b.earningsMode === 'score') {
      return `${formatCurrency(hours * rate * (b.bonusRates?.excellent || 1.2))} (excellent) – ${formatCurrency(hours * rate * (b.bonusRates?.below || 0.8))} (below)`;
    }
    return formatCurrency(hours * rate);
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Benchmarks</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Set performance targets, hourly pay, and choose how earnings are calculated.
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />New Benchmark</Button>
      </div>

      {/* Default rate notice */}
      <div className="p-4 rounded-xl border flex items-center gap-3"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
        <DollarSign className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Default hourly rate when no benchmark is active:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(parseInt(process.env.NEXT_PUBLIC_HOURLY_RATE || '') || DEFAULT_HOURLY_RATE)}/hr
          </strong>
        </p>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {benchmarks.length === 0 ? (
        <Card>
          {/* FIX: CardContent doesn't accept style prop — wrap content in a div */}
          <CardContent className="py-12 text-center">
            <div style={{ color: 'var(--text-muted)' }}>
              No benchmarks yet. Create one to set performance targets and pay rates.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {benchmarks.map((b) => {
            const rate    = effectiveRate(b);
            const isScore = b.earningsMode === 'score';
            return (
              <Card key={b._id} className={b.isCurrent ? 'ring-2 ring-green-300' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Title row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(b.startDate)} – {formatDate(b.endDate)}
                        </h3>
                        {b.isCurrent && <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>}
                        {!b.isActive && <Badge variant="gray">Inactive</Badge>}
                        <Badge variant={isScore ? 'warning' : 'primary'}>
                          {isScore ? <TrendingUp className="w-3 h-3 mr-1" /> : <DollarSign className="w-3 h-3 mr-1" />}
                          {isScore ? 'Score-Based' : 'Flat Rate'}
                        </Badge>
                        {b.createdBy && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by {b.createdBy.name}</span>}
                      </div>

                      {/* Pay per hour */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                        <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Pay Per Hour</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {formatCurrency(rate)}<span className="text-sm font-normal">/hr</span>
                          </p>
                          {!b.payPerHour && <p className="text-xs text-blue-500 mt-0.5">Using default rate</p>}
                        </div>
                      </div>

                      {/* Earnings mode */}
                      <div className={`p-3 rounded-xl border ${isScore ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isScore ? 'text-amber-700' : 'text-gray-600'}`}>
                          Earnings Calculation
                        </p>
                        {isScore ? (
                          <>
                            <p className="text-sm font-medium text-amber-800">Hours × Rate × Performance Multiplier</p>
                            <div className="mt-2 grid grid-cols-5 gap-1 text-xs text-center">
                              {[
                                { label: 'Excellent', pct: `≥${b.thresholds?.excellent ?? 80}%`, mult: b.bonusRates?.excellent ?? 1.2, color: 'text-green-700 bg-green-100' },
                                { label: 'Good',      pct: `≥${b.thresholds?.good      ?? 70}%`, mult: b.bonusRates?.good      ?? 1.1, color: 'text-blue-700 bg-blue-100' },
                                { label: 'Average',   pct: `≥${b.thresholds?.average   ?? 60}%`, mult: b.bonusRates?.average   ?? 1.0, color: 'text-yellow-700 bg-yellow-100' },
                                { label: 'Minimum',   pct: `≥${b.thresholds?.minimum   ?? 50}%`, mult: b.bonusRates?.minimum   ?? 0.9, color: 'text-orange-700 bg-orange-100' },
                                { label: 'Below',     pct: `<${b.thresholds?.minimum   ?? 50}%`,  mult: b.bonusRates?.below     ?? 0.8, color: 'text-red-700 bg-red-100' },
                              ].map(({ label, pct, mult, color }) => (
                                <div key={label} className={`p-1.5 rounded ${color}`}>
                                  <p className="font-bold">×{mult}</p>
                                  <p>{label}</p>
                                  <p className="opacity-70">{pct}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-gray-700">Hours × Rate (flat — no performance multiplier)</p>
                        )}
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Time Target</p>
                          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{b.timeBenchmark}h</p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quality Target</p>
                          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{b.qualityBenchmark}%</p>
                        </div>
                        <div className="p-3 rounded-lg col-span-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sample: 8h/day × 5 days</p>
                          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{previewEarnings(b)}</p>
                        </div>
                      </div>

                      {b.notes && <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>"{b.notes}"</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                        <Edit2 className="w-4 h-4" />Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(b)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showCreate || !!editTarget}
        onClose={() => { setShowCreate(false); setEditTarget(null); }}
        title={editTarget ? 'Edit Benchmark' : 'Create Benchmark'}
        size="lg"
      >
        <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          {/* Date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Start Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                End Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" />
            </div>
          </div>

          {/* Pay per hour */}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Pay Per Hour (₦)
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                leave blank to use default ({formatCurrency(DEFAULT_HOURLY_RATE)}/hr)
              </span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <input type="number" value={form.payPerHour}
                onChange={(e) => setForm({ ...form, payPerHour: e.target.value })}
                className="input pl-10" placeholder={`${DEFAULT_HOURLY_RATE} (default)`} min="1" step="100" />
            </div>
          </div>

          {/* Time + Quality targets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Time Benchmark (hrs) <span className="text-red-500">*</span>
              </label>
              <input type="number" value={form.timeBenchmark}
                onChange={(e) => setForm({ ...form, timeBenchmark: e.target.value })}
                className="input" placeholder="8" min="0" step="0.5" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Quality Benchmark (%) <span className="text-red-500">*</span>
              </label>
              <input type="number" value={form.qualityBenchmark}
                onChange={(e) => setForm({ ...form, qualityBenchmark: e.target.value })}
                className="input" placeholder="75" min="0" max="100" />
            </div>
          </div>

          {/* Earnings Mode Toggle */}
          <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Earnings Calculation Mode</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Choose how worker earnings are calculated for this benchmark period.
              </p>
            </div>

            {/* FIX: removed invalid `divideColor` from style — use className for Tailwind divide */}
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              {/* Flat mode */}
              <button
                type="button"
                onClick={() => setForm({ ...form, earningsMode: 'flat' })}
                className={`p-4 text-left transition-colors ${form.earningsMode === 'flat' ? 'bg-blue-50' : ''}`}
                style={{ backgroundColor: form.earningsMode === 'flat' ? undefined : 'var(--bg-secondary)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {form.earningsMode === 'flat'
                    ? <ToggleRight className="w-6 h-6 text-blue-600" />
                    : <ToggleLeft className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />}
                  <span className={`font-semibold text-sm ${form.earningsMode === 'flat' ? 'text-blue-700' : ''}`}
                    style={{ color: form.earningsMode === 'flat' ? undefined : 'var(--text-primary)' }}>
                    Flat Rate
                  </span>
                  {form.earningsMode === 'flat' && <Badge variant="primary" className="ml-auto text-xs">Selected</Badge>}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <strong>Hours × Rate</strong><br />
                  Every worker earns the same amount per hour regardless of performance score.
                </p>
              </button>

              {/* Score mode */}
              <button
                type="button"
                onClick={() => setForm({ ...form, earningsMode: 'score' })}
                className={`p-4 text-left transition-colors ${form.earningsMode === 'score' ? 'bg-amber-50' : ''}`}
                style={{ backgroundColor: form.earningsMode === 'score' ? undefined : 'var(--bg-secondary)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {form.earningsMode === 'score'
                    ? <ToggleRight className="w-6 h-6 text-amber-600" />
                    : <ToggleLeft className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />}
                  <span className={`font-semibold text-sm ${form.earningsMode === 'score' ? 'text-amber-700' : ''}`}
                    style={{ color: form.earningsMode === 'score' ? undefined : 'var(--text-primary)' }}>
                    Score-Based
                  </span>
                  {form.earningsMode === 'score' && <Badge variant="warning" className="ml-auto text-xs">Selected</Badge>}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <strong>Hours × Rate × Multiplier</strong><br />
                  Earnings vary by performance tier. High performers earn more.
                </p>
              </button>
            </div>
          </div>

          {/* Score-mode config */}
          {form.earningsMode === 'score' && (
            <div className="space-y-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <p className="font-semibold text-amber-800">Performance Tier Configuration</p>
              </div>
              <p className="text-xs text-amber-700">
                Overall score = Quality × 60% + Time Achievement × 40%.
              </p>

              {/* Thresholds */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Score Thresholds (minimum % to reach each tier)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Excellent ≥', key: 'thresholdExcellent', color: 'text-green-700' },
                    { label: 'Good ≥',      key: 'thresholdGood',      color: 'text-blue-700' },
                    { label: 'Average ≥',   key: 'thresholdAverage',   color: 'text-yellow-700' },
                    { label: 'Minimum ≥',   key: 'thresholdMinimum',   color: 'text-orange-700' },
                  ].map(({ label, key, color }) => (
                    <div key={key}>
                      <label className={`block text-xs font-semibold mb-1 ${color}`}>{label}</label>
                      <div className="relative">
                        <input type="number" value={(form as any)[key]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className="input text-sm pr-6" min="0" max="100" step="1" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multipliers */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Pay Multipliers (× base hourly earnings)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Excellent', key: 'rateExcellent', color: 'text-green-700', hint: '>1 = bonus' },
                    { label: 'Good',      key: 'rateGood',      color: 'text-blue-700',  hint: '>1 = bonus' },
                    { label: 'Average',   key: 'rateAverage',   color: 'text-yellow-700',hint: '1.0 = flat' },
                    { label: 'Minimum',   key: 'rateMinimum',   color: 'text-orange-700',hint: '<1 = reduce' },
                    { label: 'Below',     key: 'rateBelow',     color: 'text-red-700',   hint: '<1 = reduce' },
                  ].map(({ label, key, color, hint }) => (
                    <div key={key}>
                      <label className={`block text-xs font-semibold mb-1 ${color}`}>{label}</label>
                      <input type="number" value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="input text-sm" min="0" max="3" step="0.05" />
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              {form.payPerHour && !isNaN(parseFloat(form.payPerHour)) && (
                <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs">
                  <p className="font-semibold text-amber-800 mb-1">Preview: 8h/day × 5 days</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      { label: 'Excellent', rate: form.rateExcellent, color: 'text-green-700' },
                      { label: 'Good',      rate: form.rateGood,      color: 'text-blue-700' },
                      { label: 'Average',   rate: form.rateAverage,   color: 'text-yellow-700' },
                      { label: 'Minimum',   rate: form.rateMinimum,   color: 'text-orange-700' },
                      { label: 'Below',     rate: form.rateBelow,     color: 'text-red-700' },
                    ].map(({ label, rate, color }) => {
                      const r   = parseFloat(rate) || 1;
                      const amt = 40 * parseFloat(form.payPerHour) * r;
                      return (
                        <div key={label} className="text-center">
                          <p className={`font-bold ${color}`}>{formatCurrency(amt)}</p>
                          <p style={{ color: 'var(--text-muted)' }}>{label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Flat mode preview */}
          {form.earningsMode === 'flat' && form.payPerHour && !isNaN(parseFloat(form.payPerHour)) && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
              <strong>Preview:</strong> 8h/day × 5 days ={' '}
              <strong>{formatCurrency(40 * parseFloat(form.payPerHour))}</strong> for all workers
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Notes <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2} className="input resize-none" placeholder="Any notes about this benchmark period…" />
          </div>

          {error && <Alert type="error" message={error} />}

          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} isLoading={saving} className="flex-1">
              <Award className="w-4 h-4" />{editTarget ? 'Save Changes' : 'Create Benchmark'}
            </Button>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditTarget(null); }} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Benchmark" size="sm">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="text-center">
            <p style={{ color: 'var(--text-primary)' }}>Delete this benchmark?</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Existing payment records will retain their stored earnings — only future calculations are affected.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} isLoading={deleting} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}