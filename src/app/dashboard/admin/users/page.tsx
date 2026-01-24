'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin.api';
import { User, Profile } from '@/types';
import { formatDate, formatTime, formatPercentage, formatCurrency } from '@/lib/utils/format';
import { 
  Search, ChevronLeft, ChevronRight, User as UserIcon, Mail, 
  Calendar, Building, CreditCard, Briefcase, Clock, Award,
  X, ExternalLink, DollarSign
} from 'lucide-react';

interface UserWithDetails extends User {
  assignedProfiles?: Profile[];
  totalHours?: number;
  avgQuality?: number;
  entriesCount?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllUsers(page, 20);
      if (response.success && response.data) {
        setUsers(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const response = await adminApi.getUserById(userId);
      if (response.success && response.data) {
        setSelectedUser(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user as UserWithDetails);
    fetchUserDetails(user._id);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
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

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Users
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Manage all users and view their details
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full md:w-64"
          />
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Bank Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr 
                      key={user._id} 
                      onClick={() => handleUserClick(user)}
                      className="cursor-pointer transition-colors hover:bg-opacity-50"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {user.name}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getRoleColor(user.role) as any}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusColor(user.status) as any}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {user.bankDetails ? (
                          <Badge variant="success">Added</Badge>
                        ) : (
                          <Badge variant="warning">Missing</Badge>
                        )}
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

      {/* User Details Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        size="lg"
      >
        {loadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : selectedUser && (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: 'var(--accent-color)' }}>
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedUser.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={getRoleColor(selectedUser.role) as any}>
                    {selectedUser.role.toUpperCase()}
                  </Badge>
                  <Badge variant={getStatusColor(selectedUser.status) as any}>
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats Grid - This Week */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Clock className="w-5 h-5" />
                This Week&apos;s Performance
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatTime((selectedUser as any).weeklyHours || selectedUser.totalHours || 0)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hours</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <Award className="w-5 h-5 mx-auto mb-2 text-green-500" />
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatPercentage((selectedUser as any).weeklyQuality || selectedUser.avgQuality || 0)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Quality</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <Briefcase className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedUser.assignedProfiles?.length || 0}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Profiles</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {(selectedUser as any).weeklyEntries || selectedUser.entriesCount || 0}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Entries</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)', borderLeft: '3px solid #10b981' }}>
                  <DollarSign className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency((selectedUser as any).weeklyEarnings || ((selectedUser as any).weeklyHours || 0) * 2000)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Earnings</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CreditCard className="w-5 h-5" />
                Bank Details
              </h4>
              {selectedUser.bankDetails ? (
                <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Bank Name</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedUser.bankDetails.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Account Name</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedUser.bankDetails.accountName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Account Number</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedUser.bankDetails.accountNumber}
                    </span>
                  </div>
                  {selectedUser.bankDetails.routingNumber && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>Routing Number</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {selectedUser.bankDetails.routingNumber}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No bank details provided</p>
                </div>
              )}
            </div>

            {/* Assigned Profiles */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Briefcase className="w-5 h-5" />
                Assigned Profiles
              </h4>
              {selectedUser.assignedProfiles && selectedUser.assignedProfiles.length > 0 ? (
                <div className="space-y-2">
                  {selectedUser.assignedProfiles.map((profile) => (
                    <div 
                      key={profile._id}
                      className="p-3 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {profile.fullName}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {profile.email}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No profiles assigned</p>
                </div>
              )}
            </div>

            {/* Extra Bonus */}
            {(selectedUser.extraBonus !== undefined && selectedUser.extraBonus > 0) && (
              <div>
                <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Extra Bonus
                </h4>
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedUser.extraBonus)}
                  </p>
                  {selectedUser.extraBonusReason && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Reason: {selectedUser.extraBonusReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Account Info */}
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Account Created</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatDate(selectedUser.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span style={{ color: 'var(--text-muted)' }}>Last Updated</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatDate(selectedUser.updatedAt)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}