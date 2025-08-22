"use client";

import React from 'react';
import { 
  Building2, 
  CheckCircle, 
  User,
  Plus,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import BaseLayout from '../components/layout/BaseLayout';
import AdminDashboardNav from '../components/AdminDashboardNav';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const MyPipelinePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check authentication and authorization only once
  useEffect(() => {
    // Don't do anything until we have a definitive user state
    if (user === null) {
      // Still loading, wait
      return;
    }

    // Only check once
    if (authChecked) {
      return;
    }

    setAuthChecked(true);

    if (!user) {
      // User is not logged in, redirect to home
      router.push('/jobs');
      return;
    }

    // Check if user is authorized for this dashboard
    if (user.role === 'EMPLOYER' || user.role === 'ADMIN') {
      setIsAuthorized(true);
    } else {
      // User is not authorized, redirect to appropriate dashboard
      router.push('/your-pipeline');
    }
  }, [user, router, authChecked]);

  // Show loading while checking authentication
  if (!authChecked || user === null) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
            <p className="text-[#7691A4] text-lg">Loading...</p>
          </div>
        </div>
      </BaseLayout>
    );
  }

  // Show loading if user is not authorized (will redirect)
  if (!isAuthorized) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
            <p className="text-[#7691A4] text-lg">Redirecting...</p>
          </div>
        </div>
      </BaseLayout>
    );
  }

  // User is authorized, show the dashboard
  return (
    <BaseLayout>
      {/* Admin Navigation - Only show for admin users */}
      {user.role === 'ADMIN' && <AdminDashboardNav />}

      {/* Page Header */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[76px] font-black leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            MyPipeline
          </h1>
          <p className="text-xl text-gray-600 text-center lg:text-left mt-2">St. Mary's Hospital</p>
          {user.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium text-center lg:text-left mt-1">Admin Access - Employer Dashboard</p>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', zIndex: 1 }}>
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative">
          
          {/* Page Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 font-medium transition-colors">
                Notifications
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Job Post</span>
              </button>
            </div>
          </div>

          {/* Main Dashboard Container - Similar to /jobs layout */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8 items-start w-full" style={{ alignItems: 'flex-start' }}>
            
            {/* Left Column - Analytics */}
            <div className="w-full lg:flex-1 lg:min-w-0">
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h2>
                
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-blue-600">77/100</h3>
                    <p className="text-gray-600 text-sm">Environment Score</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-green-600">64/100</h3>
                    <p className="text-gray-600 text-sm">Continuity of Care Index</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-purple-600">86%</h3>
                    <p className="text-gray-600 text-sm">Strong Matches</p>
                  </div>
                </div>

                {/* Trend Indicator */}
                <div className="text-center">
                  <div className="inline-flex items-center text-green-600 font-medium">
                    <span className="text-lg">+34%</span>
                    <TrendingUp className="w-5 h-5 ml-1" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Pulse Trends</p>
                </div>
              </div>

              {/* Open Jobs Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Open Jobs</h2>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Registered Nurse</h4>
                          <p className="text-gray-600 text-sm">St. Mary's Hospital, New York, NY</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{75 + item * 5} Applicants</span>
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          View Applicants
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">1</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">2</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">3</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">Next &gt;</button>
                </div>
              </div>
            </div>

            {/* Right Column - Matches and Applicants */}
            <div className="w-full lg:flex-1 lg:min-w-0 space-y-6">
              {/* Matches Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Matches</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Marvin Grant</h4>
                          <p className="text-gray-600 text-sm">5+ years experience</p>
                          <p className="text-gray-500 text-sm">New York, NY</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                          View Profile
                        </button>
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Applicants Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Applicants</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Marvin Grant</h4>
                          <p className="text-gray-600 text-sm">5+ years experience</p>
                          <p className="text-gray-500 text-sm">New York, NY</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};

export default MyPipelinePage;
