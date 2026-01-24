'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { adminApi } from '@/lib/api/admin.api';
import { User } from '@/types';
import { ArrowLeft, Building, Mail, Lock, MapPin, User as UserIcon, Users } from 'lucide-react';

export default function CreateProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [workers, setWorkers] = useState<User[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    state: '',
    country: '',
    accountBearerName: '',
    defaultWorker: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await adminApi.getAllUsers(1, 100);
      if (response.success && response.data) {
        // Filter only approved users
        const approvedWorkers = response.data.filter(
          (user: User) => user.status === 'approved' && user.role === 'user'
        );
        setWorkers(approvedWorkers);
      }
    } catch (err) {
      console.error('Failed to load workers');
    } finally {
      setLoadingWorkers(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }

    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }

    if (!formData.accountBearerName.trim()) {
      errors.accountBearerName = 'Account bearer name is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (fieldErrors[name]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[name];
      setFieldErrors(newErrors);
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await adminApi.createProfile(formData);
      if (response.success) {
        router.push('/admin/profiles');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/profiles">
          <button className="p-2 rounded-lg transition-colors hover:bg-opacity-80" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Create Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Add a new client profile
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Full Name / Company Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`input pl-12 ${fieldErrors.fullName ? 'input-error' : ''}`}
                  placeholder="Acme Corporation"
                />
              </div>
              {fieldErrors.fullName && (
                <p className="error-text">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input pl-12 ${fieldErrors.email ? 'input-error' : ''}`}
                  placeholder="client@example.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="error-text">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pl-12 ${fieldErrors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              {fieldErrors.password && (
                <p className="error-text">{fieldErrors.password}</p>
              )}
              <p className="helper-text">Minimum 6 characters</p>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  State
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`input pl-12 ${fieldErrors.state ? 'input-error' : ''}`}
                    placeholder="California"
                  />
                </div>
                {fieldErrors.state && (
                  <p className="error-text">{fieldErrors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`input ${fieldErrors.country ? 'input-error' : ''}`}
                  placeholder="United States"
                />
                {fieldErrors.country && (
                  <p className="error-text">{fieldErrors.country}</p>
                )}
              </div>
            </div>

            {/* Account Bearer Name */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Account Bearer Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="text"
                  name="accountBearerName"
                  value={formData.accountBearerName}
                  onChange={handleChange}
                  className={`input pl-12 ${fieldErrors.accountBearerName ? 'input-error' : ''}`}
                  placeholder="John Doe"
                />
              </div>
              {fieldErrors.accountBearerName && (
                <p className="error-text">{fieldErrors.accountBearerName}</p>
              )}
            </div>

            {/* Default Worker */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Assign to Worker (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Users className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                {loadingWorkers ? (
                  <div className="input pl-12 flex items-center">
                    <Spinner size="sm" />
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>Loading workers...</span>
                  </div>
                ) : (
                  <select
                    name="defaultWorker"
                    value={formData.defaultWorker}
                    onChange={handleChange}
                    className="input pl-12"
                  >
                    <option value="">Select a worker</option>
                    {workers.map((worker) => (
                      <option key={worker._id} value={worker._id}>
                        {worker.name} ({worker.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="helper-text">You can assign a worker later</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={loading} className="flex-1">
                Create Profile
              </Button>
              <Link href="/admin/profiles" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}