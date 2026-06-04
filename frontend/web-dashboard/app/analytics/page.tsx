"use client";

import React from 'react';
import BaseLayout from '../components/layout/BaseLayout';
import { AnalyticsWorkspace } from '../components/analytics/AnalyticsWorkspace';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const company = useCompany();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // For demo purposes, bypass authentication check
    setAuthChecked(true);
    setIsAuthorized(true);
  }, [user, router, authChecked]);

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
          <div className="flex justify-start flex-col ml-14">
            <h1 className="text-[70px] font-bold leading-[115%] text-[#01253F] font-baloo">
              Analytics
            </h1>
            {company.id !== 'default' && (
              <p className="text-xl text-[#7691A4] font-medium mt-1">
                {company.name}
              </p>
            )}
          </div>
          {user?.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium mt-2 ml-6">Admin Access - Analytics Dashboard</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', zIndex: 1 }}>
        <AnalyticsWorkspace facilityId={company.facilityId} facilityName={company.name} />
      </div>
    </BaseLayout>
  );
};

export default AnalyticsPage;
