"use client";

import React from 'react';
import BaseLayout from '../components/layout/BaseLayout';
import { AnalyticsWorkspace } from '../components/analytics/AnalyticsWorkspace';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Mock facility ID - in real implementation, this would come from user context or URL params
  const facilityId = 'facility-123';

  // Check authentication and authorization
  useEffect(() => {
    // For demo purposes, bypass authentication check
    setAuthChecked(true);
    setIsAuthorized(true);
    
    // Original authentication logic (commented out for demo)
    /*
    if (user === null) {
      return;
    }

    if (authChecked) {
      return;
    }

    setAuthChecked(true);

    if (!user) {
      router.push('/');
      return;
    }

    // For now, allow all authenticated users to access analytics
    // In production, you'd check for specific roles or permissions
    setIsAuthorized(true);
    */
  }, [user, router, authChecked]);

  // Show loading while checking authentication
  if (!authChecked) {
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

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#01253F] mb-4">Access Denied</h2>
            <p className="text-[#7691A4] text-lg">You don't have permission to access analytics.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-[#2466D0] text-white rounded-lg hover:bg-[#1e5bb8] transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      {/* Page Header */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-start">
            <h1 className="text-[70px] font-bold leading-[115%] text-[#01253F] font-baloo ml-14">
              Analytics
            </h1>
          </div>
          {user?.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium mt-2 ml-6">Admin Access - Analytics Dashboard</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', zIndex: 1 }}>
        <AnalyticsWorkspace facilityId={facilityId} />
      </div>
    </BaseLayout>
  );
};

export default AnalyticsPage;