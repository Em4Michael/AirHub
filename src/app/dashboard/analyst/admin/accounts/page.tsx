'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { analystApi } from '@/lib/api/analyst.api';
import { AccountListRow } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Search, Briefcase, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

type StatusFilter = '' | 'available' | 'claimed';

export default function AnalystAccountsListPage() {
  const [rows, setRows] = useState<AccountListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 25;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await analystApi.getAccounts({
        page,
        limit,
        search: debounced || undefined,
        status: status || undefined,
      });

      if (res.success) {
        setRows(res.data ?? []);
        setPages(res.pagination?.pages ?? 1);
        setTotal(res.pagination?.total ?? 0);
      } else {
        setError(res.message || 'Failed to load accounts');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [page, debounced, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
            >
              <Briefcase className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              Accounts
            </h1>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {total} account{total === 1 ? '' : 's'} · tap any to see production and per-worker hours
          </p>
        </div>

        <Link
          href="/dashboard/analyst/admin/production"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
        >
          <BarChart2 className="w-4 h-4" /> Production dashboard
        </Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, bearer or email…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex gap-2">
          {[
            ['', 'All'],
            ['available', 'Available'],
            ['claimed', 'Claimed'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => {
                setStatus(val as StatusFilter);
                setPage(1);
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: status === val ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color: status === val ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${status === val ? 'transparent' : 'var(--border-color)'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : rows.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No accounts match your filters</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {rows.map((a) => (
              <Link
                key={a._id}
                href={`/dashboard/analyst/admin/accounts/${a._id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{
                      backgroundColor: a.isTerminated ? '#9ca3af' : 'var(--accent-color)',
                    }}
                  >
                    {a.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {a.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {a.accountBearerName}
                      {a.state ? ` · ${a.state}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={a.currentHolder ? 'danger' : 'success'}>
                    {a.currentHolder ? 'Claimed' : 'Available'}
                  </Badge>
                  {a.isTerminated && <Badge variant="danger">Terminated</Badge>}
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl disabled:opacity-30"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-semibold px-3" style={{ color: 'var(--text-secondary)' }}>
            Page {page} of {pages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2 rounded-xl disabled:opacity-30"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}