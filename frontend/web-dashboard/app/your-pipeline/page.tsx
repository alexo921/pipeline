"use client";

import React, { useState } from 'react';
import { 
  Bell, 
  Edit3, 
  User,
  Download,
  Maximize2,
  CheckCircle,
  Info,
  Briefcase,
  TrendingUp,
  MapPin,
  Users,
  MessageSquare,
  Phone,
  Plus,
  ChevronRight
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
  const [notifications, setNotifications] = useState(4);
  const [showNotification, setShowNotification] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Check authentication and authorization only once
  useEffect(() => {
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

    if (user.role !== 'EMPLOYER') {
      setIsAuthorized(true);
    } else {
      router.push('/my-pipeline');
    }
  }, [user, router, authChecked]);

  const handleNotificationClick = () => {
    setShowNotification(!showNotification);
    setNotifications(0);
  };

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
          <p className="text-[#7691A4] text-lg">Redirecting...</p>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      {/* Admin Navigation - Only show for admin users */}
      {user.role === 'ADMIN' && <AdminDashboardNav />}

      {/* Page Header */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-[76.6971px] font-bold leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            YourPipeline
          </h1>
          {user.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium text-center lg:text-left mt-2">Admin Access - Employee/User Dashboard</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Main Company Container */}
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative">
          
          {/* Company Header and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[30px] font-black leading-[154%] text-[#01253F] font-avenir">
                St. Mary's Health Center
              </h2>
              {user.role === 'ADMIN' && (
                <p className="text-sm text-blue-600 font-medium mt-1">Admin Access - Employee/User Dashboard</p>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <button className="bg-white text-[#01253F] px-5 py-3.5 rounded-full font-avenir font-extrabold text-[25px] leading-[115%] flex items-center gap-2.5 shadow-sm hover:bg-gray-50 transition-colors">
                <Plus className="w-6 h-6" />
                Post Job
              </button>
              
              <button className="bg-white text-[#2466D0] px-8.5 py-2.5 rounded-full font-avenir font-extrabold text-[42.6px] leading-[115%] flex items-center gap-4.5 shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-[#2466D0] rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">P</span>
                </div>
                Pipeline
              </button>
              
              <button className="bg-white text-[#7691A4] px-8.5 py-2.5 rounded-full font-avenir font-extrabold text-[25px] leading-[115%] flex items-center gap-3 shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                <Plus className="w-5 h-5" />
                New Job Post
              </button>
              
              <button 
                onClick={handleNotificationClick}
                className="bg-white text-[#7691A4] px-8.5 py-2.5 rounded-full font-avenir font-extrabold text-[25px] leading-[115%] flex items-center gap-3 shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                Notifications
                <span className="absolute -top-1.5 -right-1.5 bg-[#01253F] text-white text-xs rounded-full w-7.5 h-7.5 flex items-center justify-center font-avenir font-extrabold text-[15.3px] leading-[100%]">
                  {notifications}
                </span>
              </button>
            </div>
          </div>
          
          {/* Analytics Container */}
          <div className="bg-[rgba(244,244,244,0.6)] rounded-[20px] shadow-[0px_0px_30px_rgba(0,0,0,0.1)] border-2 p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[25px] font-black leading-[154%] text-[#01253F] font-avenir">Analytics</h2>
              <div className="flex items-center space-x-2">
                <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                  <Maximize2 className="w-4 h-4 text-[#7691A4]" />
                </button>
                <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                  <Download className="w-6 h-6 text-[#7691A4]" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Data Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 rounded-[35px] bg-white shadow-[0px_8.8px_35.4px_rgba(0,0,0,0.05)] border-[1.77px] border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-[#01253F]">77</h3>
                    <span className="text-gray-400 text-base">/100</span>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Measures the overall workplace environment quality and employee satisfaction
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-avenir">Environment Score</p>
                </div>
                <div className="text-center p-6 rounded-[35px] bg-white shadow-[0px_8.8px_35.4px_rgba(0,0,0,0.05)] border-[1.77px] border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-[#01253F]">64</h3>
                    <span className="text-gray-400 text-base">/100</span>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Tracks how consistently patients receive care from the same healthcare providers
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-avenir">Continuity of Care Index</p>
                </div>
                <div className="text-center p-6 rounded-[35px] bg-white shadow-[0px_8.8px_35.4px_rgba(0,0,0,0.05)] border-[1.77px] border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-[#01253F]">86%</h3>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Percentage of job candidates with high compatibility scores
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-avenir">Strong Matches</p>
                </div>
                <div className="text-center p-6 rounded-[35px] bg-white shadow-[0px_8.8px_35.4px_rgba(0,0,0,0.05)] border-[1.77px] border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-[#01253F]">+34%</h3>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Positive trend in overall organizational performance and engagement
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-avenir">Pulse Trends</p>
                </div>
              </div>

              {/* Insights Section */}
              <div className="bg-white rounded-[35px] shadow-[0px_8.8px_35.4px_rgba(0,0,0,0.05)] border-[1.77px] border-gray-200 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-[25px] font-medium leading-[34px] text-[#01253F] font-avenir">Insights</h2>
                  <div className="flex items-center space-x-2">
                    <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                      <Maximize2 className="w-4 h-4 text-[#7691A4]" />
                    </button>
                    <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                      <Download className="w-6 h-6 text-[#7691A4]" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-medium text-[#01253F] font-avenir">Work Environment Score</span>
                      <span className="text-lg font-medium text-[#01253F] font-avenir">74%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-[144px] h-[14px]">
                      <div className="h-[14px] rounded-[144px]" style={{ width: '74%', background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-medium text-[#01253F] font-avenir">High Retention Forecast</span>
                      <span className="text-lg font-medium text-[#01253F] font-avenir">52%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-[144px] h-[14px]">
                      <div className="h-[14px] rounded-[144px]" style={{ width: '52%', background: 'linear-gradient(115.61deg, #EB9FDA 0%, #7B84D6 100%)' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-medium text-[#01253F] font-avenir">Behavioral Risk Flags</span>
                      <span className="text-lg font-medium text-[#01253F] font-avenir">36%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-[144px] h-[14px]">
                      <div className="h-[14px] rounded-[144px]" style={{ width: '36%', background: 'linear-gradient(115.61deg, #EB9FDA 0%, #7B84D6 100%)' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-medium text-[#01253F] font-avenir">Culture Fit Alignment</span>
                      <span className="text-lg font-medium text-[#01253F] font-avenir">36%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-[144px] h-[14px]">
                      <div className="h-[14px] rounded-[144px]" style={{ width: '36%', background: 'linear-gradient(115.61deg, #EB9FDA 0%, #7B84D6 100%)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Jobs/Matches/Applicants Container */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Open Jobs Section */}
              <div className="bg-[rgba(244,244,244,0.6)] rounded-[20px] shadow-[0px_0px_30px_rgba(0,0,0,0.1)] border-2 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-[25px] font-black leading-[154%] text-[#01253F] font-avenir">Open Jobs</h2>
                  <div className="flex items-center space-x-2">
                    <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4 text-[#7691A4]" />
                    </button>
                    <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                      <Maximize2 className="w-4 h-4 text-[#7691A4]" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Job Card */}
                  <div className="bg-white rounded-[20px] border-2 p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-black text-[25px] leading-[154%] text-[#2466D0] font-avenir mb-2">Registered Nurse</h4>
                        <p className="text-[#01253F] text-lg font-bold leading-[29px] font-avenir mb-2">St. Mary's Health Center</p>
                        <p className="text-[#01253F] text-lg font-bold leading-[29px] font-avenir mb-2">New Haven, CT</p>
                        <p className="text-[#01253F] text-lg font-bold leading-[29px] font-avenir">75k/yr - 85k/yr</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button className="w-13 h-13 bg-gray-100 rounded-full flex items-center justify-center">
                          <Edit3 className="w-5 h-5 text-[#7691A4]" />
                        </button>
                        <button className="bg-[#2CB3BF] text-white px-5 py-2.5 rounded-lg font-avenir font-black text-xl leading-[115%]">
                          View Applicants
                        </button>
                        <span className="bg-[#01253F] text-white text-sm rounded-full w-7.5 h-7.5 flex items-center justify-center font-avenir font-extrabold text-[15.3px] leading-[100%]">
                          4
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* More job cards would go here */}
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-center space-x-4 mt-8">
                  <button className="w-12 h-12 bg-[#01253F] text-white rounded-full flex items-center justify-center font-avenir font-extrabold text-[25px] leading-[115%]">
                    1
                  </button>
                  <button className="w-12 h-12 bg-white text-[#01253F] rounded-full flex items-center justify-center font-avenir font-extrabold text-[25px] leading-[115%] border-2 border-gray-200">
                    2
                  </button>
                  <button className="w-12 h-12 bg-white text-[#01253F] rounded-full flex items-center justify-center font-avenir font-extrabold text-[25px] leading-[115%] border-2 border-gray-200">
                    3
                  </button>
                  <button className="bg-white text-[#7691A4] px-6 py-3 rounded-full font-avenir font-extrabold text-[25px] leading-[115%] flex items-center gap-2 border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                    Next
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Right Side - Matches and Applicants */}
              <div className="space-y-8">
                {/* Matches Section */}
                <div className="bg-[rgba(244,244,244,0.6)] rounded-[20px] shadow-[0px_0px_30px_rgba(0,0,0,0.1)] border-2 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[25px] font-black leading-[154%] text-[#2466D0] font-avenir">Matches</h2>
                      <div className="w-8 h-8 bg-[#2466D0] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4 text-[#7691A4]" />
                      </button>
                      <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                        <Maximize2 className="w-4 h-4 text-[#7691A4]" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Match Card */}
                    <div className="bg-white rounded-[20px] border-2 p-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="w-26 h-26 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="font-black text-[25px] leading-[154%] text-[#01253F] font-avenir mb-2">Marvin Grant</h4>
                            <p className="font-bold text-[#01253F] text-lg leading-[32px] font-avenir mb-2">5+ years experience</p>
                            <p className="text-gray-500 text-lg">New Haven, CT</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-4">
                          <div className="bg-gray-100 text-[#2466D0] px-4 py-2 rounded-[40px] flex items-center gap-2 font-avenir font-extrabold text-lg leading-[100%]">
                            <span>Matched</span>
                            <div className="w-2.5 h-2.5 bg-[#2466D0] rounded-full flex items-center justify-center">
                              <CheckCircle className="w-1.5 h-1.5 text-white" />
                            </div>
                          </div>
                          <button className="bg-[#2CB3BF] text-white px-5 py-2.5 rounded-lg font-avenir font-black text-lg leading-[115%]">
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* More match cards would go here */}
                  </div>
                </div>

                {/* Applicants Section */}
                <div className="bg-[rgba(244,244,244,0.6)] rounded-[20px] shadow-[0px_0px_30px_rgba(0,0,0,0.1)] border-2 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[25px] font-black leading-[154%] text-[#01253F] font-avenir">Applicants</h2>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)]">
                        <Download className="w-4 h-4 text-[#7691A4]" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4 text-[#7691A4]" />
                      </button>
                      <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0px_0px_30px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors">
                        <Maximize2 className="w-4 h-4 text-[#7691A4]" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Applicant Card */}
                    <div className="bg-white rounded-[20px] border-2 p-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="w-26 h-26 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="font-black text-[25px] leading-[154%] text-[#01253F] font-avenir mb-2">Marvin Grant</h4>
                            <p className="font-bold text-[#01253F] text-lg leading-[32px] font-avenir mb-2">5+ years experience</p>
                            <p className="text-gray-500 text-lg">New Haven, CT</p>
                          </div>
                        </div>
                        <button className="bg-[#2CB3BF] text-white px-5 py-2.5 rounded-lg font-avenir font-black text-lg leading-[115%]">
                          View Profile
                        </button>
                      </div>
                    </div>
                    
                    {/* More applicant cards would go here */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>All notifications cleared!</span>
          </div>
        </div>
      )}
    </BaseLayout>
  );
};

export default YourPipelinePage;
