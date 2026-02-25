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
import { Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminApi.getAllUsers(1, 500);
      if (response.success && response.data) {
        const flatUsers = Array.isArray(response.data)
          ? (response.data.flat(Infinity) as User[])
          : [];
        setUsers(flatUsers);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
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

  const getUserInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  const Avatar = ({ user }: { user: User }) => (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0"
      style={{ backgroundColor: user.profilePhoto ? 'transparent' : 'var(--accent-color)' }}
    >
      {user.profilePhoto
        ? <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
        : <span className="text-sm">{getUserInitials(user.name)}</span>}
    </div>
  );

  if (loading && users.length === 0) {
    return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Users</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage all users and view their details ({users.length} total)
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* ── Mobile cards (hidden on md+) ── */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No users found</p>
        ) : filteredUsers.map((user) => (
          <div
            key={user._id}
            className="rounded-xl border p-4 space-y-3"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            {/* Avatar + name/email + details button */}
            <div className="flex items-center gap-3">
              <Avatar user={user} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
              <Link href={`/dashboard/admin/users/${user._id}`} className="flex-shrink-0">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ color: 'var(--accent-color)', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  Details <ExternalLink className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {/* Badges + date */}
            <div
              className="flex flex-wrap items-center gap-2 pt-3 border-t"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Badge variant={getRoleVariant(user.role) as any}>{user.role.toUpperCase()}</Badge>
              <Badge variant={getStatusVariant(user.status) as any}>{user.status}</Badge>
              {user.bankDetails
                ? <Badge variant="success">Bank added</Badge>
                : <Badge variant="warning">No bank</Badge>}
              <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table (hidden below md) ── */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <tr>
                  {['User', 'Role', 'Status', 'Joined', 'Bank Details', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                      No users found
                    </td>
                  </tr>
                ) : filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRoleVariant(user.role) as any}>{user.role.toUpperCase()}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(user.status) as any}>{user.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {user.bankDetails
                        ? <Badge variant="success">Added</Badge>
                        : <Badge variant="warning">Missing</Badge>}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/admin/users/${user._id}`}>
                        <button
                          className="text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--accent-color)', backgroundColor: 'var(--bg-tertiary)' }}
                        >
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
    </div>
  );
}