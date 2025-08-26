"use client";

import React, { useState } from 'react';
import { 
  Bell, 
  Edit3, 
  User,
  Download,
  Maximize2,
  CheckCircle,
  Info
} from 'lucide-react';
import BaseLayout from '../components/layout/BaseLayout';
import AdminDashboardNav from '../components/AdminDashboardNav';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const YourPipelinePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);

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
      router.push('/');
      return;
    }

    // Check if user is authorized for this dashboard
    if (user.role !== 'EMPLOYER') {
      setIsAuthorized(true);
    } else {
      // User is an employer, redirect to employer dashboard
      router.push('/my-pipeline');
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
            YourPipeline
          </h1>
          {user.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium text-center lg:text-left mt-2">Admin Access - Employee/User Dashboard</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Main Company Container - Wraps both Analytics/Insights and Jobs/Matches/Applicants */}
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative">
          
          {/* Company Header and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 font-baloo">
                St. Mary's Health Center
              </h2>
              {user.role === 'ADMIN' && (
                <p className="text-sm text-blue-600 font-medium mt-1">Admin Access - Employee/User Dashboard</p>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2 transition-colors shadow-sm relative">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">4</span>
              </button>
            </div>
          </div>
          
          {/* Analytics Container - Holds both Metrics and Insights */}
          <div className="bg-[rgba(244,244,244,0.6)] rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Analytics</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Expand to full screen"
                >
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Download data">
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {/* Data Cards Section */}
              <div className="rounded-lg shadow-sm border p-6">
                
                {/* Analytics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <h3 className="text-2xl font-bold text-blue-600">77/100</h3>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm">Environment Score</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <h3 className="text-2xl font-bold text-green-600">64/100</h3>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm">Continuity of Care Index</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <h3 className="text-2xl font-bold text-purple-600">86%</h3>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm">Strong Matches</p>
                    {/* Small line graph */}
                    <div className="flex items-end justify-center space-x-1 mt-2 h-8">
                      <div className="w-1 bg-blue-400 h-2"></div>
                      <div className="w-1 bg-blue-400 h-4"></div>
                      <div className="w-1 bg-blue-400 h-6"></div>
                      <div className="w-1 bg-blue-400 h-3"></div>
                      <div className="w-1 bg-blue-400 h-5"></div>
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <h3 className="text-2xl font-bold text-orange-600">+34%</h3>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm">Pulse Trends</p>
                    {/* Small line graph */}
                    <div className="flex items-end justify-center space-x-1 mt-2 h-8">
                      <div className="w-1 bg-green-400 h-3"></div>
                      <div className="w-1 bg-green-400 h-5"></div>
                      <div className="w-1 bg-green-400 h-7"></div>
                      <div className="w-1 bg-green-400 h-4"></div>
                      <div className="w-1 bg-green-400 h-6"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights Section */}
              <div className="rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Insights</h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Expand to full screen"
                    >
                      <Maximize2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Download data">
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Work Environment Score</span>
                      <span className="text-sm text-gray-600">74%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '74%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">High Retention Forecast</span>
                      <span className="text-sm text-gray-600">52%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '52%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Behavioral Risk Flags</span>
                      <span className="text-sm text-gray-600">36%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '36%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Culture Fit Alignment</span>
                      <span className="text-sm text-gray-600">36%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '36%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Jobs/Matches/Applicants Container - Stacked below */}
          <div className="bg-[rgba(244,244,244,0.6)] rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Open Jobs Section - Left Side (Full Height) */}
              <div className="bg-white rounded-lg shadow-sm border p-6" style={{ minWidth: '300px' }}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Open Jobs</h2>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">Registered Nurse</h4>
                            <Edit3 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                          </div>
                          <p className="text-gray-600 text-sm">St. Mary's Health Center, New Haven, CT</p>
                          <p className="text-gray-500 text-sm">75k/yr - 85k/yr</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">4 Applicants</span>
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          View Applicants
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">2</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">3</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">Next &gt;</button>
                </div>
              </div>

              {/* Right Side - Matches and Applicants Stacked */}
              <div className="space-y-6" style={{ minWidth: '300px' }}>
                {/* Matches Section - Top Right (Half Height) */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Matches</h2>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Download data">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Expand to full screen">
                        <Maximize2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2].map((item) => (
                      <div key={item} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">Marvin Grant</h4>
                            <p className="text-gray-600 text-xs">5+ years experience</p>
                            <p className="text-gray-500 text-xs">New Haven, CT</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 text-xs font-medium">Matched ✔</span>
                          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Applicants Section - Bottom Right (Half Height) */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Applicants</h2>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Download data">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Expand to full screen">
                        <Maximize2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2].map((item) => (
                      <div key={item} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">Marvin Grant</h4>
                            <p className="text-gray-600 text-xs">5+ years experience</p>
                            <p className="text-gray-500 text-xs">New Haven, CT</p>
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
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
      </div>
    </BaseLayout>
  );
};

export default YourPipelinePage;
