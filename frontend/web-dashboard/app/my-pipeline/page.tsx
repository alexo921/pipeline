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
import { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';

const MyPipelinePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRendered, setIsRendered] = useState(false);
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null);

  // Add CSS styles for forced desktop layout
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .force-desktop-layout {
        display: grid !important;
        grid-template-columns: 1fr 2fr !important;
        gap: 2rem !important;
        width: 100% !important;
      }
      .force-left-col {
        grid-column: 1 / 2 !important;
        width: 100% !important;
      }
      .force-right-col {
        grid-column: 2 / 3 !important;
        width: 100% !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  // Mark component as rendered
  useEffect(() => {
    setIsRendered(true);
  }, []);

  // Force grid layout on desktop when grid element is available
  useEffect(() => {
    if (!isRendered || !gridElement) return;
    
    console.log('Grid layout effect running, window width:', window.innerWidth);
    console.log('Grid element available:', !!gridElement);
    console.log('Component rendered:', isRendered);
    
    if (gridElement && window.innerWidth >= 1024) {
      console.log('Forcing desktop grid layout');
      
      // Add CSS class to force desktop layout
      gridElement.classList.add('force-desktop-layout');
      
      // Force the grid layout
      gridElement.style.display = 'grid';
      gridElement.style.gridTemplateColumns = '1fr 2fr';
      gridElement.style.gap = '2rem';
      gridElement.style.width = '100%';
      
      // Also force the column spans
      const leftCol = gridElement.querySelector('[data-col="left"]') as HTMLElement;
      const rightCol = gridElement.querySelector('[data-col="right"]') as HTMLElement;
      
      if (leftCol) {
        leftCol.style.gridColumn = '1 / 2';
        leftCol.style.width = '100%';
        leftCol.classList.add('force-left-col');
      }
      
      if (rightCol) {
        rightCol.style.gridColumn = '2 / 3';
        rightCol.style.width = '100%';
        rightCol.classList.add('force-right-col');
      }
      
      console.log('Grid layout applied:', gridElement.style.display, gridElement.style.gridTemplateColumns);
    } else {
      console.log('Not desktop or grid element not found. Width:', window.innerWidth, 'Element:', !!gridElement, 'Rendered:', isRendered);
    }
  }, [isRendered, gridElement]); // Run when either changes

  // Callback ref to capture the grid element
  const gridRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log('Grid ref callback triggered, element:', !!node);
      setGridElement(node);
    }
  }, []);

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
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">77/100</div>
              <div className="text-sm text-gray-600">Environment Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">64/100</div>
              <div className="text-sm text-gray-600">Continuity of Care Index</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">86%</div>
              <div className="text-sm text-gray-600">Strong Matches</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-green-600 font-medium">
              <span className="text-lg">+34%</span>
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-2 border-red-500 p-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' }}>
          {/* Open Jobs Section - Left Column */}
          <div data-col="left" className="lg:col-span-1 bg-blue-50 rounded-lg shadow-sm border p-6" style={{ gridColumn: 'span 1 / span 1' }}>
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
          <div data-col="right" className="lg:col-span-2 space-y-8 bg-green-50 p-4" style={{ gridColumn: 'span 2 / span 2' }}>
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
