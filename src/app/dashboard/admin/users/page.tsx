'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { adminApi } from '@/lib/api/admin.api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils/format';
import { Search, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';

const PAGE_SIZE = 25;

const AVATAR_COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
  '#d97706', '#059669', '#0891b2', '#2563eb',
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const getUserInitials = (name: string) => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
};

const Avatar = ({ name }: { name: string }) => (
  <div
    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm select-none"
    style={{ backgroundColor: avatarColor(name) }}
  >
    {getUserInitials(name)}
  </div>
);

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchUsers(); }, [page]);
  useEffect(() => { setPage(1); }, [searchQuery]);

  const fetchUsers = async (attempt = 1) => {
    try {
      setLoading(true);
      setError('');
      if (attempt > 1) setError(`Server is waking up… retrying (${attempt}/3)`);

      const response = await adminApi.getAllUsers(page, PAGE_SIZE);

      if (response.success && response.data) {
        const flatUsers = Array.isArray(response.data)
          ? (response.data.flat(Infinity) as User[])
          : [];
        setUsers(flatUsers);
        if (response.pagination?.pages) setTotalPages(response.pagination.pages);
        if (response.pagination?.total) setTotalUsers(response.pagination.total);
        setError('');
      } else {
        setUsers([]);
      }
      setLoading(false);
    } catch (err: any) {
      if (attempt < 3) {
        setTimeout(() => fetchUsers(attempt + 1), 5000);
      } else {
        setError(
          err.response?.data?.message ||
          'Failed to load users. The server may be offline — please refresh.'
        );
        setLoading(false);
      }
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending':  return 'warning';
      case 'revoked':  return 'danger';
      default:         return 'primary';
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'danger';
      case 'admin':      return 'warning';
      default:           return 'primary';
    }
  };

  const startRecord = (page - 1) * PAGE_SIZE + 1;
  const endRecord   = Math.min(page * PAGE_SIZE, totalUsers);

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const getPages = () => {
      const pages: (number | '...')[] = [];
      const left  = Math.max(2, page - 2);
      const right = Math.min(totalPages - 1, page + 2);
      pages.push(1);
      if (left > 2) pages.push('...');
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
      return pages;
    };
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <p className="text-sm order-2 sm:order-1" style={{ color: 'var(--text-muted)' }}>
          Showing <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{startRecord}–{endRecord}</span>{' '}
          of <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{totalUsers}</span> users
        </p>
        <div className="flex items-center gap-1 order-1 sm:order-2">
          <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded-lg transition-colors disabled:opacity-30" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronsLeft className="w-4 h-4" /></button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg transition-colors disabled:opacity-30" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft className="w-4 h-4" /></button>
          <div className="flex items-center gap-1">
            {getPages().map((pg, idx) =>
              pg === '...' ? (
                <span key={`e-${idx}`} className="px-1 text-sm" style={{ color: 'var(--text-muted)' }}>…</span>
              ) : (
                <button key={pg} onClick={() => setPage(pg as number)}
                  className="min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: pg === page ? 'var(--accent-color)' : 'var(--bg-tertiary)', color: pg === page ? '#fff' : 'var(--text-secondary)' }}>
                  {pg}
                </button>
              )
            )}
          </div>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg transition-colors disabled:opacity-30" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg transition-colors disabled:opacity-30" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronsRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  if (loading && users.length === 0) {
    return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Users</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage all users and view their details ({totalUsers} total)
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search this page..." leftIcon={<Search className="w-5 h-5" />} />
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading && users.length > 0 && (
        <div className="flex items-center justify-center py-4 gap-2" style={{ color: 'var(--text-muted)' }}>
          <Spinner size="sm" /><span className="text-sm">Loading page {page}…</span>
        </div>
      )}

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No users found</p>
        ) : filteredUsers.map((user, idx) => (
          <div key={user._id} className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono w-6 text-center flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{startRecord + idx}</span>
              <Avatar name={user.name} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
              <Link href={`/dashboard/admin/users/${user._id}`} className="flex-shrink-0">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: 'var(--accent-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                  Details <ExternalLink className="w-3 h-3" />
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <Badge variant={getRoleVariant(user.role) as any}>{user.role.toUpperCase()}</Badge>
              <Badge variant={getStatusVariant(user.status) as any}>{user.status}</Badge>
              {user.bankDetails ? <Badge variant="success">Bank added</Badge> : <Badge variant="warning">No bank</Badge>}
              <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(user.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <tr>
                  {['#', 'User', 'Role', 'Status', 'Joined', 'Bank Details', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>No users found</td></tr>
                ) : filteredUsers.map((user, idx) => (
                  <tr key={user._id} className="transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td className="px-6 py-4 text-sm w-10" style={{ color: 'var(--text-muted)' }}>{startRecord + idx}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} />
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge variant={getRoleVariant(user.role) as any}>{user.role.toUpperCase()}</Badge></td>
                    <td className="px-6 py-4"><Badge variant={getStatusVariant(user.status) as any}>{user.status}</Badge></td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4">{user.bankDetails ? <Badge variant="success">Added</Badge> : <Badge variant="warning">Missing</Badge>}</td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/admin/users/${user._id}`}>
                        <button className="text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors" style={{ color: 'var(--accent-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                          View Details <ExternalLink className="w-4 h-4" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Pagination />
    </div>
  );
}