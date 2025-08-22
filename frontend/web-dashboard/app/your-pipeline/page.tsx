"use client";

import React from 'react';
import { 
  Building2, 
  CheckCircle, 
  User,
  Edit3
} from 'lucide-react';
import BaseLayout from '../components/layout/BaseLayout';
import AdminDashboardNav from '../components/AdminDashboardNav';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const YourPipelinePage = () => {
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
  const profileData = {
    name: "Marvin Grant",
    location: "New Haven, CT",
    bio: "Community Focused, Care Driven, And Something Health.",
    skills: ["Leadership", "Safety", "Adaptability"],
    experience: [
      "Registered Nurse (St. Mary's, 3yrs)",
      "Registered Nurse (St. Mary's, 3yrs)",
      "Registered Nurse (St. Mary's, 3yrs)"
    ],
    completionPercentage: 100
  };

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Profile</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-600 font-medium">
                {profileData.completionPercentage}% Complete
              </span>
              <div className="w-24 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${profileData.completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex space-x-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-600" />
              </div>
              <div className="text-center mt-3">
                <h3 className="font-semibold text-gray-900">{profileData.name}</h3>
                <p className="text-gray-600 text-sm">{profileData.location}</p>
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Bio</h4>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-700 mb-4">{profileData.bio}</p>
              
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Skills</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Experience</h4>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <ul className="space-y-2">
                {profileData.experience.map((exp, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Matches Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Matches</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">St. Mary's Hospital</h4>
                      <p className="text-gray-600 text-sm">Registered Nurse</p>
                      <p className="text-gray-500 text-sm">New Haven, CT</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                      View Employer
                    </button>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Jobs Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recommended Jobs</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Registered Nurse</h4>
                      <p className="text-gray-600 text-sm">St. Mary's Hospital</p>
                      <p className="text-gray-500 text-sm">New Haven, CT</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                      View Job
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded">Full-Time</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded">Entry Level</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expressed Interest Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Expressed Interest</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">St. Mary's Hospital</h4>
                      <p className="text-gray-600 text-sm">Registered Nurse</p>
                      <p className="text-gray-500 text-sm">New Haven, CT</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    View Employer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Applications Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Applications</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-900 font-medium">St. Mary's</span>
                    <span className="text-gray-600">Registered Nurse</span>
                    <span className="text-gray-500 text-sm">08/14/25</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </BaseLayout>
  );
};

export default YourPipelinePage;
