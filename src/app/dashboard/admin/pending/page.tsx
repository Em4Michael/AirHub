'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { adminApi } from '@/lib/api/admin.api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils/format';
import { CheckCircle, XCircle, UserCheck, Clock, Mail, Calendar, Users } from 'lucide-react';

export default function PendingUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await adminApi.getPendingUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    setApproving(userId);
    setError('');
    try {
      await adminApi.approveUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      setSuccess(`${userName} has been approved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve user');
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Pending Users
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Review and approve new user registrations
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <Clock className="w-5 h-5 text-orange-500" />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {users.length} pending
          </span>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Empty State */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              All caught up!
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              No pending users to approve at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Users Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                {/* User Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ backgroundColor: 'var(--accent-color)' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Mail className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Awaiting Approval
                    </span>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>

                {/* Registration Date */}
                <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="w-4 h-4" />
                  <span>Registered {formatDate(user.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(user._id, user.name)}
                    isLoading={approving === user._id}
                    className="flex-1"
                    variant="success"
                  >
                    <UserCheck className="w-4 h-4" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk Actions (if multiple users) */}
      {users.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {users.length} users waiting for approval
                </span>
              </div>
              <Button
                onClick={async () => {
                  setApproving('all');
                  try {
                    // Approve all users one by one
                    for (const user of users) {
                      await adminApi.approveUser(user._id);
                    }
                    setUsers([]);
                    setSuccess('All users have been approved!');
                    setTimeout(() => setSuccess(''), 3000);
                  } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to approve all users');
                  } finally {
                    setApproving(null);
                  }
                }}
                isLoading={approving === 'all'}
                variant="success"
              >
                <CheckCircle className="w-4 h-4" />
                Approve All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}