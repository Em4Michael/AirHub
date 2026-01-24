'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { userApi } from '@/lib/api/user.api';
import { authApi } from '@/lib/api/auth.api';
import { BankDetails } from '@/types';
import { Save, CreditCard } from 'lucide-react';

export default function BankDetailsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<BankDetails>({
    bankName: '',
    accountNumber: '',
    accountName: '',
    routingNumber: '',
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data?.bankDetails) {
        setFormData(response.data.bankDetails);
      }
    } catch (err) {
      console.error('Failed to load bank details');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await userApi.updateBankDetails(formData);
      if (response.success) {
        setSuccess('Bank details updated successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem 1rem' }}>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Bank Details
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your payment information
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div 
        className="card p-6"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-color)', opacity: 0.1 }}
          >
            <CreditCard className="w-6 h-6" style={{ color: 'var(--accent-color)' }} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Payment Information
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Bank Name"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            required
            placeholder="e.g., Chase Bank"
          />

          <Input
            label="Account Number"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            required
            placeholder="1234567890"
          />

          <Input
            label="Account Name"
            name="accountName"
            value={formData.accountName}
            onChange={handleChange}
            required
            placeholder="John Doe"
          />

          <Input
            label="Routing Number (Optional)"
            name="routingNumber"
            value={formData.routingNumber}
            onChange={handleChange}
            placeholder="123456789"
          />

          <div className="pt-4">
            <Button type="submit" isLoading={loading} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              Save Bank Details
            </Button>
          </div>
        </form>

        {/* Security Notice */}
        <div 
          className="mt-6 p-4 rounded-lg"
          style={{ 
            backgroundColor: 'var(--bg-tertiary)',
            borderLeft: '4px solid var(--accent-color)'
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            🔒 Your banking information is encrypted and stored securely. We never share your details with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}