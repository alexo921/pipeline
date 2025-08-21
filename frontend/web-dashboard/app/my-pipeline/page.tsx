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
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in and is an employer OR admin
  useEffect(() => {
    // Wait a bit for auth to load
    const timer = setTimeout(() => {
      if (user === null) {
        // User is still loading, don't redirect yet
        return;
      }
      
      if (!user) {
        // User is not logged in
        router.push('/jobs');
        return;
      }
      
      // Allow access if user is employer OR admin
      if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
        router.push('/your-pipeline');
        return;
      }
      
      // User is authorized, stop loading
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [user, router]);

  // Show loading while checking user role or if still loading
  if (isLoading || !user || (user.role !== 'EMPLOYER' && user.role !== 'ADMIN')) {
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

  const analyticsData = {
    metrics: [
      { value: "77/100", label: "Environment Score", color: "blue" },
      { value: "64/100", label: "Continuity of Care Index", color: "blue" },
      { value: "86%", label: "Strong Matches", color: "blue" },
      { value: "+34%", label: "Pulse Trends", color: "green", showTrend: true, trendValue: "+34%" }
    ],
    insights: [
      { label: "Work Environment Score", percentage: 75, color: "blue" },
      { label: "High Retention Forecast", percentage: 80, color: "green" },
      { label: "Telemedicine Fill Rate", percentage: 50, color: "yellow" },
      { label: "Work Performance Score", percentage: 60, color: "blue" },
      { label: "Culture Fit Average", percentage: 80, color: "green" }
    ]
  };

  return (
    <BaseLayout>
      {/* Admin Navigation - Only show for admin users */}
      {user.role === 'ADMIN' && <AdminDashboardNav />}

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">MyPipeline</h1>
            <p className="text-xl text-gray-600">St. Mary's Hospital</p>
            {user.role === 'ADMIN' && (
              <p className="text-sm text-blue-600 font-medium">Admin Access - Employer Dashboard</p>
            )}
          </div>
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

        {/* Analytics Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h2>
          
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {analyticsData.metrics.map((metric, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                {metric.showTrend && metric.trendValue ? (
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <h3 className={`text-2xl font-bold ${metric.color === 'green' ? 'text-green-600' : 'text-blue-600'}`}>
                      {metric.value}
                    </h3>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <h3 className={`text-2xl font-bold ${metric.color === 'green' ? 'text-green-600' : 'text-blue-600'}`}>
                    {metric.value}
                  </h3>
                )}
                <p className="text-gray-600 text-sm">{metric.label}</p>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
            <div className="space-y-3">
              {analyticsData.insights.map((insight, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{insight.label}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-3 bg-gray-200 rounded-full">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          insight.color === 'blue' ? 'bg-blue-500' : 
                          insight.color === 'green' ? 'bg-green-500' : 
                          insight.color === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${insight.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{insight.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-2 border-red-500 p-4">
          {/* Open Jobs Section - Left Column */}
          <div className="lg:col-span-1 bg-blue-50 rounded-lg shadow-sm border p-6">
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

          {/* Right Column - Matches and Applicants */}
          <div className="lg:col-span-2 space-y-8 bg-green-50 p-4">
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
      </main>
    </BaseLayout>
  );
};

export default MyPipelinePage;
