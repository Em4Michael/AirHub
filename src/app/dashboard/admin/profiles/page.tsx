'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin.api';
import { Profile, User, Entry } from '@/types';
import { formatDate, formatTime, formatPercentage, formatCurrency } from '@/lib/utils/format';
import { 
  Plus, Search, Trash2, Eye, Clock, Award, Calendar, 
  MapPin, User as UserIcon, Mail, Building, ChevronLeft, ChevronRight,
  AlertTriangle, Edit, DollarSign, Wallet, TrendingUp
} from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface ProfileStats {
  weekly: {
    hours: number;
    quality: number;
    entries: number;
    earnings: number;
  };
  lifetime: {
    hours: number;
    quality: number;
    entries: number;
    earnings: number;
  };
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [assignWorker, setAssignWorker] = useState<{ profile: Profile; currentWorker?: string } | null>(null);
  const [assigningWorker, setAssigningWorker] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  useEffect(() => {
    fetchProfiles();
    fetchWorkers();
  }, [page]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllProfiles(page, 20);
      if (response.success && response.data) {
        setProfiles(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await adminApi.getAllUsers(1, 200);
      console.log('Workers API response:', response);
      
      if (response.success && response.data) {
        console.log('Total users received:', response.data.length);
        
        const approvedWorkers = response.data.filter(
          (user: User) => {
            console.log('Checking user:', user.name, 'Role:', user.role, 'isApproved:', user.isApproved, 'status:', user.status);
            // Check both isApproved and status fields, only include role === 'user'
            return user.role === 'user' && (user.isApproved === true || user.status === 'approved');
          }
        );
        
        console.log('Approved workers found:', approvedWorkers.length);
        setWorkers(approvedWorkers);
      }
    } catch (err: any) {
      console.error('Failed to load workers:', err);
    }
  };

  const fetchProfileDetails = async (profileId: string) => {
    setLoadingDetails(true);
    try {
      const response = await adminApi.getProfileById(profileId);
      if (response.success && response.data) {
        setSelectedProfile(response.data);
        
        // Calculate stats from entries
        const entries = response.data.entries || [];
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const weeklyEntries = entries.filter((e: Entry) => new Date(e.date) >= oneWeekAgo);
        const lifetimeEntries = entries;
        
        const weeklyStats = {
          hours: weeklyEntries.reduce((sum: number, e: Entry) => sum + (e.adminTime || e.time), 0),
          quality: weeklyEntries.length > 0 
            ? weeklyEntries.reduce((sum: number, e: Entry) => sum + (e.adminQuality || e.quality), 0) / weeklyEntries.length 
            : 0,
          entries: weeklyEntries.length,
          earnings: 0
        };
        
        const lifetimeStats = {
          hours: lifetimeEntries.reduce((sum: number, e: Entry) => sum + (e.adminTime || e.time), 0),
          quality: lifetimeEntries.length > 0 
            ? lifetimeEntries.reduce((sum: number, e: Entry) => sum + (e.adminQuality || e.quality), 0) / lifetimeEntries.length 
            : 0,
          entries: lifetimeEntries.length,
          earnings: 0
        };
        
        // Calculate earnings
        weeklyStats.earnings = weeklyStats.hours * 2000;
        lifetimeStats.earnings = lifetimeStats.hours * 2000;
        
        setProfileStats({ weekly: weeklyStats, lifetime: lifetimeStats });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleProfileClick = (profile: Profile) => {
    fetchProfileDetails(profile._id);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setDeleting(true);
    try {
      await adminApi.deleteProfile(deleteConfirm._id);
      setProfiles(profiles.filter(p => p._id !== deleteConfirm._id));
      setDeleteConfirm(null);
      setSelectedProfile(null);
      setSuccess('Profile deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete profile');
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignWorker = async () => {
    if (!assignWorker || !selectedWorkerId) return;
    
    setAssigningWorker(true);
    try {
      await adminApi.reassignWorker({
        profileId: assignWorker.profile._id,
        newWorkerId: selectedWorkerId,
        permanent: true
      });
      
      setSuccess('Worker assigned successfully');
      setAssignWorker(null);
      setSelectedWorkerId('');
      fetchProfiles();
      
      if (selectedProfile && selectedProfile.profile._id === assignWorker.profile._id) {
        fetchProfileDetails(assignWorker.profile._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign worker');
    } finally {
      setAssigningWorker(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.accountBearerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && profiles.length === 0) {
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
            Profiles
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Manage client profiles and view performance
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            
          <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      leftIcon={<Search className="w-5 h-5" />}
                    />
          </div>
          <Link href="/dashboard/admin/profiles/new">
            <Button>
              <Plus className="w-5 h-5" />
              Create Profile
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No profiles found</p>
            <Link href="/dashboard/admin/profiles/new">
              <Button className="mt-4">
                <Plus className="w-5 h-5" />
                Create First Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => (
            <Card 
              key={profile._id}
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => handleProfileClick(profile)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: 'var(--accent-color)' }}>
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {profile.fullName}
                      </h3>
                      <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignWorker({ 
                          profile, 
                          currentWorker: typeof profile.defaultWorker === 'string' 
                            ? profile.defaultWorker 
                            : (profile.defaultWorker as any)?._id 
                        });
                        setSelectedWorkerId(
                          typeof profile.defaultWorker === 'string' 
                            ? profile.defaultWorker 
                            : (profile.defaultWorker as any)?._id || ''
                        );
                      }}
                      className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                      title="Assign Worker"
                    >
                      <UserIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(profile);
                      }}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{profile.state}, {profile.country}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <UserIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{profile.accountBearerName}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Created {formatDate(profile.createdAt)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProfileClick(profile);
                    }}
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    View Details
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      {/* Profile Details Modal */}
      <Modal
        isOpen={!!selectedProfile && !deleteConfirm && !assignWorker}
        onClose={() => {
          setSelectedProfile(null);
          setProfileStats(null);
        }}
        title="Profile Details"
        size="xl"
      >
        {loadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : selectedProfile && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: 'var(--accent-color)' }}>
                {selectedProfile.profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedProfile.profile.fullName}
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedProfile.profile.email}</p>
              </div>
            </div>

            {/* Performance Stats */}
            {profileStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weekly Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Hours Worked</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatTime(profileStats.weekly.hours)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Avg Quality</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatPercentage(profileStats.weekly.quality)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Entries</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {profileStats.weekly.entries}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Earnings</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(profileStats.weekly.earnings)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Lifetime Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-purple-500" />
                      All Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Hours</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatTime(profileStats.lifetime.hours)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Avg Quality</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatPercentage(profileStats.lifetime.quality)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Entries</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {profileStats.lifetime.entries}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Total Earnings</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(profileStats.lifetime.earnings)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Profile Information */}
            <div>
              <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Profile Information
              </h4>
              <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Location</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedProfile.profile.state}, {selectedProfile.profile.country}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Account Bearer</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedProfile.profile.accountBearerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Created</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(selectedProfile.profile.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Worker */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Assigned Worker
                </h4>
                <button
                  onClick={() => {
                    setAssignWorker({ 
                      profile: selectedProfile.profile,
                      currentWorker: typeof selectedProfile.profile.defaultWorker === 'string'
                        ? selectedProfile.profile.defaultWorker
                        : selectedProfile.profile.defaultWorker?._id
                    });
                    setSelectedWorkerId(
                      typeof selectedProfile.profile.defaultWorker === 'string'
                        ? selectedProfile.profile.defaultWorker
                        : selectedProfile.profile.defaultWorker?._id || ''
                    );
                  }}
                  className="text-sm font-medium flex items-center gap-1"
                  style={{ color: 'var(--accent-color)' }}
                >
                  <Edit className="w-4 h-4" />
                  Change Worker
                </button>
              </div>
              {selectedProfile.profile.defaultWorker ? (
                <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>
                    {(typeof selectedProfile.profile.defaultWorker === 'string' 
                      ? 'W' 
                      : selectedProfile.profile.defaultWorker.name?.charAt(0) || 'W').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {typeof selectedProfile.profile.defaultWorker === 'string'
                        ? 'Worker ID: ' + selectedProfile.profile.defaultWorker
                        : selectedProfile.profile.defaultWorker.name}
                    </p>
                    {typeof selectedProfile.profile.defaultWorker !== 'string' && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {selectedProfile.profile.defaultWorker.email}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No worker assigned</p>
                  <button
                    onClick={() => {
                      setAssignWorker({ profile: selectedProfile.profile });
                      setSelectedWorkerId('');
                    }}
                    className="mt-2 text-sm font-medium"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    Assign a worker
                  </button>
                </div>
              )}
            </div>

            {/* Recent Entries */}
            {selectedProfile.entries && selectedProfile.entries.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Recent Entries
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedProfile.entries.slice(0, 10).map((entry: Entry) => (
                    <div 
                      key={entry._id}
                      className="p-3 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(entry.date)}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {entry.notes || 'No notes'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatTime(entry.adminTime || entry.time)}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {formatPercentage(entry.adminQuality || entry.quality)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <Button
                variant="danger"
                onClick={() => {
                  setDeleteConfirm(selectedProfile.profile);
                }}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProfile(null);
                  setProfileStats(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Worker Modal */}
      <Modal
        isOpen={!!assignWorker}
        onClose={() => {
          setAssignWorker(null);
          setSelectedWorkerId('');
        }}
        title="Assign Worker"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Select Worker
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="input"
            >
              <option value="">No worker assigned</option>
              {workers.map((worker) => (
                <option key={worker._id} value={worker._id}>
                  {worker.name} ({worker.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAssignWorker}
              isLoading={assigningWorker}
              disabled={!selectedWorkerId}
              className="flex-1"
            >
              Assign Worker
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAssignWorker(null);
                setSelectedWorkerId('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Profile"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="text-center">
            <p style={{ color: 'var(--text-primary)' }}>
              Are you sure you want to delete{' '}
              <strong>{deleteConfirm?.fullName}</strong>?
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              This action cannot be undone. All entries associated with this profile will also be deleted.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}