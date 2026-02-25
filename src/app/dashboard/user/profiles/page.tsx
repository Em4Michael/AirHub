'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/lib/api/user.api';
import { Profile } from '@/types';
import {
  Briefcase, MapPin, Mail, User, Calendar, CreditCard,
  Building2, Camera, Trash2, Upload, Phone, Edit2, Check, X,
} from 'lucide-react';

export default function UserProfilesPage() {
  const { user, refreshUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bank details state
  const [editingBank, setEditingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankData, setBankData] = useState({ bankName: '', accountName: '', accountNumber: '' });

  // Phone state
  const [editingPhone, setEditingPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  // Name state
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Photo state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfiles();
    if (user?.bankDetails) {
      setBankData({
        bankName: user.bankDetails.bankName || '',
        accountName: user.bankDetails.accountName || '',
        accountNumber: user.bankDetails.accountNumber || '',
      });
    }
    if (user?.phone) setPhoneInput(user.phone);
    if (user?.name)  setNameInput(user.name);
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const response = await userApi.getAssignedProfiles();
      if (response.success && response.data) setProfiles(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async () => {
    setSavingBank(true); setError(''); setSuccess('');
    try {
      await userApi.updateBankDetails(bankData);
      await refreshUser();
      setEditingBank(false);
      setSuccess('Bank details updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update bank details');
    } finally { setSavingBank(false); }
  };

  const handleSavePhone = async () => {
    setSavingPhone(true); setError(''); setSuccess('');
    try {
      await userApi.updateProfile({ phone: phoneInput });
      await refreshUser();
      setEditingPhone(false);
      setSuccess('Phone number updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update phone number');
    } finally { setSavingPhone(false); }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) { setError('Name cannot be empty'); return; }
    setSavingName(true); setError(''); setSuccess('');
    try {
      await userApi.updateProfile({ name: nameInput.trim() });
      await refreshUser();
      setEditingName(false);
      setSuccess('Name updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update name');
    } finally { setSavingName(false); }
  };

  const handleCancelPhone = () => { setPhoneInput(user?.phone || ''); setEditingPhone(false); };
  const handleCancelName  = () => { setNameInput(user?.name   || ''); setEditingName(false);  };

  const getUserInitials = () => {
    if (!user?.name) return '?';
    const names = user.name.split(' ');
    return names.length >= 2
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : user.name[0].toUpperCase();
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return; }

    setUploadingPhoto(true); setError(''); setSuccess('');
    try {
      await userApi.uploadProfilePhoto(file);
      await refreshUser();
      setSuccess('Profile photo updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) return;
    setDeletingPhoto(true); setError(''); setSuccess('');
    try {
      await userApi.deleteProfilePhoto();
      await refreshUser();
      setSuccess('Profile photo deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete photo');
    } finally { setDeletingPhoto(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;

  const hasBankDetails =
    user?.bankDetails &&
    (user.bankDetails.bankName || user.bankDetails.accountName || user.bankDetails.accountNumber);

  // Reusable inline-edit row ─────────────────────────────────────────────────
  const InlineEditField = ({
    icon, label, value, editing, saving,
    input, onInputChange, onSave, onEdit, onCancel, placeholder = '',
    inputType = 'text',
  }: {
    icon: React.ReactNode; label: string; value?: string | null;
    editing: boolean; saving: boolean; input: string;
    onInputChange: (v: string) => void;
    onSave: () => void; onEdit: () => void; onCancel: () => void;
    placeholder?: string; inputType?: string;
  }) => (
    <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      <div className="mt-0.5" style={{ color: 'var(--accent-color)' }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type={inputType}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={placeholder}
              className="input text-sm flex-1"
              style={{ padding: '4px 8px' }}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
            />
            <button
              onClick={onSave}
              disabled={saving}
              className="p-1 rounded text-green-600 hover:bg-green-50 disabled:opacity-50"
              title="Save"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                : <Check className="w-4 h-4" />}
            </button>
            <button onClick={onCancel} className="p-1 rounded text-red-500 hover:bg-red-50" title="Cancel">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="font-medium truncate" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {value || 'Not set'}
            </p>
            <button
              onClick={onEdit}
              className="p-1 rounded flex-shrink-0 transition-colors"
              style={{ color: 'var(--accent-color)' }}
              title={`Edit ${label.toLowerCase()}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-6" style={{ minHeight: '100vh' }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your personal information and assigned profiles
        </p>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError('')}   />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {user && (
        <div
          className="card overflow-hidden"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          {/* Header banner */}
          <div
            className="p-6 border-b"
            style={{
              background:
                'linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 70%, #000) 100%)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg overflow-hidden">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white">{getUserInitials()}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  {uploadingPhoto
                    ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera className="w-6 h-6 text-white" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-white/80 mt-1">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user.role === 'superadmin' ? 'danger' : user.role === 'admin' ? 'warning' : 'primary'}>
                    {user.role.toUpperCase()}
                  </Badge>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    {user.profilePhoto ? 'Change' : 'Upload'}
                  </button>
                  {user.profilePhoto && (
                    <button
                      onClick={handleDeletePhoto}
                      disabled={deletingPhoto}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personal info grid */}
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">

              {/* Name — editable */}
              <InlineEditField
                icon={<User className="w-5 h-5" />}
                label="Full Name"
                value={user.name}
                editing={editingName}
                saving={savingName}
                input={nameInput}
                onInputChange={setNameInput}
                onSave={handleSaveName}
                onEdit={() => { setNameInput(user.name || ''); setEditingName(true); }}
                onCancel={handleCancelName}
                placeholder="Enter your full name"
              />

              {/* Email — read-only */}
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Mail className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Email Address</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
                </div>
              </div>

              {/* Phone — editable */}
              <InlineEditField
                icon={<Phone className="w-5 h-5" />}
                label="Phone Number"
                value={user.phone}
                editing={editingPhone}
                saving={savingPhone}
                input={phoneInput}
                onInputChange={setPhoneInput}
                onSave={handleSavePhone}
                onEdit={() => { setPhoneInput(user.phone || ''); setEditingPhone(true); }}
                onCancel={handleCancelPhone}
                placeholder="+234 800 000 0000"
                inputType="tel"
              />

              {/* Joined — read-only */}
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Calendar className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Member Since</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Status — read-only */}
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Briefcase className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Account Status</p>
                  <Badge variant={user.isApproved ? 'success' : 'warning'}>
                    {user.isApproved ? 'Approved' : 'Pending Approval'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Banking section */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Banking Information</h3>
                {!editingBank && (
                  <Button variant="outline" size="sm" onClick={() => setEditingBank(true)}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {hasBankDetails ? 'Update' : 'Add'} Bank Details
                  </Button>
                )}
              </div>

              {editingBank ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Bank Name" type="text" value={bankData.bankName}
                      onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                      placeholder="Enter bank name" leftIcon={<Building2 className="w-5 h-5" />} />
                    <Input label="Account Name" type="text" value={bankData.accountName}
                      onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
                      placeholder="Account holder name" leftIcon={<User className="w-5 h-5" />} />
                    <Input label="Account Number" type="text" value={bankData.accountNumber}
                      onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                      placeholder="Account number" leftIcon={<CreditCard className="w-5 h-5" />} />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSaveBankDetails} isLoading={savingBank} loadingText="Saving...">
                      Save Bank Details
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEditingBank(false);
                      if (user.bankDetails) {
                        setBankData({
                          bankName:      user.bankDetails.bankName      || '',
                          accountName:   user.bankDetails.accountName   || '',
                          accountNumber: user.bankDetails.accountNumber || '',
                        });
                      }
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : hasBankDetails ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {user.bankDetails?.bankName && (
                    <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <Building2 className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                      <div>
                        <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Bank Name</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.bankDetails.bankName}</p>
                      </div>
                    </div>
                  )}
                  {user.bankDetails?.accountName && (
                    <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <User className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                      <div>
                        <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Account Name</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.bankDetails.accountName}</p>
                      </div>
                    </div>
                  )}
                  {user.bankDetails?.accountNumber && (
                    <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <CreditCard className="w-5 h-5 mt-0.5" style={{ color: 'var(--accent-color)' }} />
                      <div>
                        <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Account Number</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          ••••••{user.bankDetails.accountNumber.slice(-4)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <CreditCard className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No bank details added yet</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditingBank(true)}>
                    Add Bank Details
                  </Button>
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
          <div className="card p-12 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <Briefcase className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No profiles assigned yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div key={profile._id} className="card hover:shadow-lg transition-all group"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{profile.fullName}</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{profile.accountBearerName}</p>
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