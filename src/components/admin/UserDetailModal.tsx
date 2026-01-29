// e.g., src/components/admin/UserDetailModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Clock, Award, DollarSign, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api/client'; // your axios instance

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDetailModal({ userId, isOpen, onClose }: UserDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchStats();
    }
  }, [isOpen, userId]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/admin/users/${userId}/stats`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Performance Details" size="lg">
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Spinner size="lg" />
        </div>
      )}

      {error && <Alert type="error" message={error} className="mb-6" />}

      {data && (
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium">{data.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium">{data.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                <Badge variant={data.user.role === 'admin' ? 'warning' : 'primary'}>
                  {data.user.role.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <Badge variant={data.user.isApproved ? 'success' : 'danger'}>
                  {data.user.isApproved ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly */}
            <div className="border rounded-lg p-5">
              <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> This Week
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Hours:</span>
                  <span className="font-medium">{data.weekly.totalHours || 0} h</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Quality:</span>
                  <span className="font-medium">{data.weekly.avgQuality?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Entries:</span>
                  <span className="font-medium">{data.weekly.entryCount || 0}</span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Earnings:</span>
                  <span>₦{(data.weekly.totalEarnings || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Lifetime */}
            <div className="border rounded-lg p-5">
              <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" /> Lifetime
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Hours:</span>
                  <span className="font-medium">{data.lifetime.totalHours || 0} h</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Quality:</span>
                  <span className="font-medium">{data.lifetime.avgQuality?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Entries:</span>
                  <span className="font-medium">{data.lifetime.entryCount || 0}</span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Total Earnings:</span>
                  <span>₦{(data.lifetime.totalEarnings || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}