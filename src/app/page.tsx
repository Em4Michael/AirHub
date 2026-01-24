'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ROLE_ROUTES } from '@/lib/constants/routes';
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle2, 
  Shield, 
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck,
  Award
} from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(ROLE_ROUTES[user.role]);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                AIRhub
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="outline" className="hidden sm:inline-flex">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-24 px-4 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
        
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Simplified Workforce
              <span className="block bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent mt-2">
                Management Platform
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Empower your remote workers and streamline admin operations with our comprehensive platform for time tracking, performance management, and seamless payroll processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                  Sign In
                </Button>
              </Link>
            </div>
            
          </div>
        </div>
      </section>

      {/* For Workers Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">For Workers</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Work Smarter, Get Paid Faster
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to track your work, manage your time, and get compensated accurately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                <Clock className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Easy Time Logging
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Log your daily work hours with a simple interface. Track time spent on different profiles and submit entries for approval with just a few clicks.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-5">
                <BarChart3 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Performance Dashboard
              </h3>
              <p className="text-gray-600 leading-relaxed">
                View your performance metrics, quality scores, and earnings at a glance. Stay motivated with real-time feedback and achievement tracking.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center mb-5">
                <DollarSign className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Transparent Payments
              </h3>
              <p className="text-gray-600 leading-relaxed">
                See exactly how much you've earned with detailed breakdowns. Update your bank details securely and get paid on time, every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Admins Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-teal-600 uppercase tracking-wide">For Admins</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Manage Teams Effortlessly
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful tools to oversee workers, verify entries, and maintain operational excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Worker Management
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Approve new workers, assign them to profiles, and manage reassignments. Keep your workforce organized with intuitive admin controls.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-5">
                <CheckCircle2 className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Entry Verification
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Review and approve time entries, quality assessments, and bonuses. Ensure accuracy before entries are finalized for payroll processing.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Comprehensive Reports
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Generate detailed reports on worker performance, time utilization, and quality metrics. Make data-driven decisions with ease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything in One Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              All the tools you need for efficient remote workforce management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
              <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Performance Tracking</h4>
              <p className="text-sm text-gray-600">Monitor quality scores and productivity metrics in real-time</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
              <Shield className="w-8 h-8 text-green-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Role-Based Access</h4>
              <p className="text-sm text-gray-600">Secure permissions for workers, admins, and super admins</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
              <UserCheck className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Approval Workflow</h4>
              <p className="text-sm text-gray-600">Streamlined entry verification and approval process</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
              <Award className="w-8 h-8 text-orange-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Bonus System</h4>
              <p className="text-sm text-gray-600">Reward excellence with performance-based bonuses</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-teal-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Streamline Your Workforce?
          </h2>
          <p className="text-xl text-blue-50 mb-10 leading-relaxed">
            Join teams who have transformed their remote work management with AIRhub. Start your free trial today.
          </p>
          <Link href="/auth/signup">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-50 px-10 text-lg h-14 shadow-xl"
            >
              Get Started Free
            </Button>
          </Link>
          
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-white">AIRhub</span>
            </div>
            <p className="mb-2 text-gray-400">AI Remote Hub - Workforce Management Platform</p>
            <p className="text-sm text-gray-500">© 2026 AIRhub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}