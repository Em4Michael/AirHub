'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/lib/api/user.api';
import { Profile } from '@/types';
import { Briefcase, MapPin, Mail, User, Calendar, CreditCard, Building2, Globe, Phone } from 'lucide-react';
import Link from 'next/link';

export default function UserProfilesPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await userApi.getAssignedProfiles();
      if (response.success && response.data) {
        setProfiles(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
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
    <div className="space-y-6 pb-20 lg:pb-6" style={{ minHeight: '100vh' }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          My Profile
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your personal information and assigned profiles
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Personal Information Card */}
      {user && (
        <div 
          className="card overflow-hidden"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div 
            className="p-6 border-b"
            style={{ 
              background: `linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 70%, #000) 100%)`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-white/80 mt-1">{user.email}</p>
                <div className="mt-2">
                  <Badge variant={user.role === 'superadmin' ? 'danger' : user.role === 'admin' ? 'warning' : 'primary'}>
                    {user.role.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Personal Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <User className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Full Name
                  </p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Mail className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Email Address
                  </p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Calendar className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Member Since
                  </p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Briefcase className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Account Status
                  </p>
<Badge variant={user.isApproved ? 'success' : 'warning'}>
  {user.isApproved ? 'Approved' : 'Pending Approval'}
</Badge>
                </div> 
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Banking Information
                </h3>
                <Link href="/dashboard/user/bank">
                  <Button variant="outline" size="sm">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Bank Details
                  </Button>
                </Link>
              </div>
              
              {user.bankDetails ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <Building2 className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                    <div>
                      <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                        Bank Name
                      </p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {user.bankDetails.bankName || 'Not set'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <User className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                    <div>
                      <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                        Account Name
                      </p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {user.bankDetails.accountName || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <CreditCard className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No bank details added yet</p>
                  <Link href="/dashboard/user/bank">
                    <Button variant="outline" size="sm" className="mt-4">
                      Add Bank Details
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assigned Profiles */}
      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Assigned Profiles ({profiles.length})
        </h2>

        {profiles.length === 0 ? (
          <div 
            className="card p-12 text-center"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <Briefcase className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No profiles assigned yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div 
                key={profile._id} 
                className="card hover:shadow-lg transition-all group"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold group-hover:text-opacity-80 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {profile.fullName}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {profile.accountBearerName}
                      </p>
                    </div>
                    <Badge variant="primary">Active</Badge>
                  </div>
                </div>
                
                <div className="p-5 space-y-3">
                  <div className="flex items-center text-sm gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  <div className="flex items-center text-sm gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{profile.state}, {profile.country}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}