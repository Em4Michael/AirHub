'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { adminApi } from '@/lib/api/admin.api';
import { superadminApi } from '@/lib/api/superadmin.api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils/format';
import {
  Search, ChevronLeft, ChevronRight, ExternalLink,
  ArrowUp, ArrowDown, ShieldOff, Shield,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminApi.getAllUsers(page, 500);
      if (response.success && response.data) {
        const flat = Array.isArray(response.data)
          ? (response.data.flat(Infinity) as User[])
          : [];
        setUsers(flat);
        if (response.pagination?.pages) setTotalPages(response.pagination.pages);
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

  const handlePromote = async (userId: string) => {
    setActionLoading(userId);
    try {
      await superadminApi.promoteToAdmin(userId);
      setSuccess('User promoted to admin');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to promote user');
    } finally { setActionLoading(null); }
  };

  const handleDemote = async (userId: string) => {
    setActionLoading(userId);
    try {
      await superadminApi.demoteToUser(userId);
      setSuccess('Admin demoted to user');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to demote user');
    } finally { setActionLoading(null); }
  };

  const handleRevoke = async (userId: string) => {
    setActionLoading(userId);
    try {
      await superadminApi.revokeAccess(userId);
      setSuccess('Access revoked');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke access');
    } finally { setActionLoading(null); }
  };

  const handleRestore = async (userId: string) => {
    setActionLoading(userId);
    try {
      await superadminApi.restoreAccess(userId);
      setSuccess('Access restored');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to restore access');
    } finally { setActionLoading(null); }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'revoked': return 'danger';
      default: return 'primary';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'danger';
      case 'admin': return 'warning';
      default: return 'primary';
    }
  };

  const getUserInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  if (loading && users.length === 0) {
    return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            User Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Manage users, roles, access, and permissions
          </p>
        </div>
        <div className="relative">
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
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <tr>
                  {['User', 'Role', 'Status', 'Joined', 'Bank', 'Role Actions', 'Details'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider"
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
                    <td colSpan={7} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* User */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: user.profilePhoto ? 'transparent' : 'var(--accent-color)' }}
                          >
                            {user.profilePhoto
                              ? <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                              : <span>{getUserInitials(user.name)}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        <Badge variant={getRoleColor(user.role) as any}>{user.role.toUpperCase()}</Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <Badge variant={getStatusColor(user.status) as any}>{user.status}</Badge>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Bank */}
                      <td className="px-4 py-4">
                        {user.bankDetails ? (
                          <Badge variant="success">Added</Badge>
                        ) : (
                          <Badge variant="warning">Missing</Badge>
                        )}
                      </td>

                      {/* Role Actions — promote / demote / revoke / restore */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {user.role === 'user' && (user.status === 'approved' || user.isApproved) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePromote(user._id)}
                              isLoading={actionLoading === user._id}
                              title="Promote to Admin"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                          )}
                          {user.role === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDemote(user._id)}
                              isLoading={actionLoading === user._id}
                              title="Demote to User"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          )}
                          {user.status === 'approved' && user.role !== 'superadmin' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleRevoke(user._id)}
                              isLoading={actionLoading === user._id}
                              title="Revoke Access"
                            >
                              <ShieldOff className="w-3 h-3" />
                            </Button>
                          )}
                          {user.status === 'revoked' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleRestore(user._id)}
                              isLoading={actionLoading === user._id}
                              title="Restore Access"
                            >
                              <Shield className="w-3 h-3" />
                            </Button>
                          )}
                          {user.role === 'superadmin' && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* View Details */}
                      <td className="px-4 py-4">
                        <Link href={`/dashboard/superadmin/users/${user._id}`}>
                          <button
                            className="text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--accent-color)', backgroundColor: 'var(--bg-tertiary)' }}
                          >
                            Details
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}