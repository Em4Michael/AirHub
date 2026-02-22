'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { userApi } from '@/lib/api/user.api';
import { Profile } from '@/types';
import { FileText, ArrowLeft } from 'lucide-react';

// Build today's date string from LOCAL components — not toISOString() which
// converts to UTC first and rolls back one day for UTC+ timezones at midnight.
const getTodayLocalDateString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function NewEntryPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    profileId: '',
    date: getTodayLocalDateString(), // ← FIXED: uses local date, not UTC
    time: '',
    quality: '',
    notes: '',
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await userApi.getAssignedProfiles();
      if (response.success && response.data) {
        setProfiles(response.data);
      }
    } catch (err) {
      setError('Failed to load profiles');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await userApi.createEntry({
        profileId: formData.profileId,
        date: formData.date, // already "YYYY-MM-DD" — safe to send as-is
        time: parseFloat(formData.time),
        quality: parseFloat(formData.quality),
        notes: formData.notes,
      });

      if (response.success) {
        setSuccess('Entry created successfully!');
        setTimeout(() => router.push('/dashboard/user/entries'), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
          style={{ 
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)' 
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Create Entry
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Log your daily work
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div 
        className="card p-4 sm:p-6"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 80%, #000) 100%)' 
            }}
          >
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Entry Details
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Profile"
            name="profileId"
            value={formData.profileId}
            onChange={handleChange}
            required
            options={[
              { value: '', label: 'Select a profile' },
              ...profiles.map((p) => ({ value: p._id, label: p.fullName })),
            ]}
          />

          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <Input
            label="Time (hours)"
            type="number"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            step="0.01"
            min="0"
            max="24"
            helperText="Enter hours worked (e.g., 8.5)"
          />

          <Input
            label="Quality Score (%)"
            type="number"
            name="quality"
            value={formData.quality}
            onChange={handleChange}
            required
            min="0"
            max="100"
            helperText="Enter quality score from 0-100"
          />

          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border transition-all resize-none focus:outline-none focus:ring-2 focus:ring-opacity-20"
              placeholder="Add any notes about your work..."
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-color)',
                '--tw-ring-color': 'var(--accent-color)'
              } as React.CSSProperties}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              isLoading={loading} 
              className="btn-primary flex-1"
            >
              Create Entry
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}