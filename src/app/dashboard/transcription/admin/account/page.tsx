'use client';

// Route: /dashboard/transcription/admin/account/page.tsx
// Paginated accounts list for admin with search + status filter.

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { transcriptionApi } from '@/lib/api/transcription.api';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Search, ChevronLeft, ChevronRight, Briefcase, ChevronRight as Arrow } from 'lucide-react';

const STATUS_FILTERS = ['all', 'available', 'claimed'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function TranscriptionAccountsPage() {
  const [accounts, setAccounts]   = useState<any[]>([]);
  const [page,     setPage]       = useState(1);
  const [pages,    setPages]      = useState(1);
  const [total,    setTotal]      = useState(0);
  const [search,   setSearch]     = useState('');
  const [dSearch,  setDSearch]    = useState('');
  const [status,   setStatus]     = useState<StatusFilter>('all');
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setDSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transcriptionApi.getAccounts({
        page,
        limit:  25,
        search: dSearch || undefined,
        status: status === 'all' ? undefined : status,
      });
      if (res.success) {
        setAccounts((res.data as any[]) ?? []);
        setPages(res.pagination?.pages ?? 1);
        setTotal(res.pagination?.total ?? 0);
      }
    } catch { setError('Failed to load accounts'); }
    finally { setLoading(false); }
  }, [page, dSearch, status]);

  useEffect(() => { load(); }, [load]);

  const fieldStyle = { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Transcription Accounts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{total} total accounts</p>
        </div>
        <Link href="/dashboard/transcription/admin"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
          ← Admin hub
        </Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, bearer or email…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm" style={fieldStyle} />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => { setStatus(f); setPage(1); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
              style={{ backgroundColor: status === f ? 'var(--accent-color)' : 'var(--bg-secondary)', color: status === f ? '#fff' : 'var(--text-secondary)', border: `1px solid ${status === f ? 'transparent' : 'var(--border-color)'}` }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : accounts.length === 0 ? (
          <div className="py-14 text-center">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No accounts match your filters</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {accounts.map((a: any) => {
              const holder = typeof a.currentHolder === 'object' ? a.currentHolder as any : null;
              return (
                <Link key={a._id} href={`/dashboard/transcription/admin/account/${a._id}`}
                  className="flex items-center justify-between px-5 py-4 gap-4 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--bg-primary)', display: 'flex' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold"
                      style={{ backgroundColor: 'var(--accent-color)' }}>
                      {a.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{a.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.accountBearerName}{a.email ? ` · ${a.email}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {holder
                      ? <Badge variant="warning">Held by {holder.name?.split(' ')[0]}</Badge>
                      : <Badge variant="success">Available</Badge>}
                    {a.isTerminated && <Badge variant="danger">Terminated</Badge>}
                    <Arrow className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
              <ChevronLeft className="w-4 h-4" />Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
              Next<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}