'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({});
  
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const reset = searchParams.get('reset');

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validateForm = (): boolean => {
    const errors: {email?: string; password?: string} = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('not found')) {
        setFieldErrors({ email: 'Email not found' });
      } else if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('incorrect')) {
        setFieldErrors({ password: 'Incorrect password' });
      }
    } finally {
      setLoading(false);
    }
  };

  const clearEmailError = () => {
    if (fieldErrors.email) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
    setError('');
  };

  const clearPasswordError = () => {
    if (fieldErrors.password) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
    setError('');
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">
        Welcome Back! 👋
      </h2>
      <p className="text-center mb-6 text-gray-600">
        Sign in to continue to AIRhub
      </p>

      {/* Success Messages */}
      {registered && (
        <div className="mb-4 p-4 rounded-xl bg-green-50 border-2 border-green-200 animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">Registration successful!</p>
              <p className="text-sm text-green-700 mt-1">
                Please wait for admin approval before logging in.
              </p>
            </div>
          </div>
        </div>
      )}

      {reset && (
        <div className="mb-4 p-4 rounded-xl bg-green-50 border-2 border-green-200 animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">Password reset successful!</p>
              <p className="text-sm text-green-700 mt-1">
                You can now log in with your new password.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Message */}
      {error && !fieldErrors.email && !fieldErrors.password && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border-2 border-red-200 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Login Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <Input
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onClearError={clearEmailError}
          error={fieldErrors.email}
          placeholder="you@example.com"
          disabled={loading}
          autoComplete="email"
          leftIcon={<Mail className="w-5 h-5" />}
          required
        />

        {/* Password Field */}
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onClearError={clearPasswordError}
          error={fieldErrors.password}
          placeholder="••••••••"
          disabled={loading}
          autoComplete="current-password"
          leftIcon={<Lock className="w-5 h-5" />}
          required
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
              Remember me
            </label>
          </div>
          <Link 
            href="/auth/forgot-password" 
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          isLoading={loading}
          loadingText="Signing in..."
          fullWidth
        >
          Sign In
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don&apos;t have an account?{' '}
          <Link 
            href="/auth/signup" 
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}