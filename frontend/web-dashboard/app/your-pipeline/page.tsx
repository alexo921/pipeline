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
  Phone
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
  
  // Demo state
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState(4);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  // Demo data
  const demoJobs = [
    {
      id: 1,
      title: "Registered Nurse",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "75k/yr - 85k/yr",
      applicants: 4,
      status: "Active"
    },
    {
      id: 2,
      title: "Physical Therapist",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "80k/yr - 95k/yr",
      applicants: 7,
      status: "Active"
    },
    {
      id: 3,
      title: "Medical Assistant",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "45k/yr - 55k/yr",
      applicants: 12,
      status: "Active"
    },
    {
      id: 4,
      title: "Respiratory Therapist",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "70k/yr - 85k/yr",
      applicants: 3,
      status: "Active"
    }
  ];

  const demoMatches = [
    {
      id: 1,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT",
      matchScore: 94,
      status: "Matched"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "Physical Therapist",
      experience: "3+ years experience",
      location: "Hartford, CT",
      matchScore: 87,
      status: "Matched"
    },
    {
      id: 3,
      name: "Michael Chen",
      role: "Medical Assistant",
      experience: "2+ years experience",
      location: "Bridgeport, CT",
      matchScore: 92,
      status: "Matched"
    }
  ];

  const demoApplicants = [
    {
      id: 1,
      name: "Emily Rodriguez",
      role: "Registered Nurse",
      experience: "4+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "2 days ago"
    },
    {
      id: 2,
      name: "David Thompson",
      role: "Registered Nurse",
      experience: "6+ years experience",
      location: "Milford, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    },
    {
      id: 3,
      name: "Lisa Park",
      role: "Registered Nurse",
      experience: "3+ years experience",
      location: "West Haven, CT",
      status: "Applied",
      appliedDate: "3 days ago"
    }
  ];

  // Demo functions
  const handleNotificationClick = () => {
    setShowNotification(!showNotification);
    setNotifications(0);
  };

  const handleJobEdit = (job: any) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleViewApplicants = (job: any) => {
    setSelectedJob(job);
    setShowApplicantsModal(true);
  };

  const handleViewProfile = (person: any) => {
    setSelectedMatch(person);
    setShowProfileModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-[76.6971px] font-bold leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            YourPipeline
          </h1>
          {user.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium text-center lg:text-left mt-2">Admin Access - Employee/User Dashboard</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1200px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Main Company Container - Wraps both Analytics/Insights and Jobs/Matches/Applicants */}
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative" style={{ maxWidth: '1200px' }}>
          
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
                                  <button 
                      onClick={handleNotificationClick}
                      className="text-sm font-medium flex items-center transition-colors shadow-sm relative bg-white hover:bg-gray-50 px-4 py-2 rounded-lg border border-gray-200"
                      style={{
                        gap: '8px',
                        fontFamily: 'Avenir'
                      }}
                    >
                      <Bell className="w-4 h-4 text-gray-500 fill-current" />
                      <span className="text-gray-600 font-avenir">Notifications</span>
                      <span className="absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#01253F' }}>
                        {notifications}
                      </span>
                    </button>
            </div>
          </div>
          
          {/* Analytics Container - Holds both Metrics and Insights */}
          <div 
            className="bg-[rgba(244,244,244,0.6)] rounded-lg shadow-sm border p-6 mb-8"
                          style={{
                width: '100%', maxWidth: '1200px', overflow: 'hidden',
                minHeight: 'auto',
                padding: '1rem',
                borderRadius: '20px',
                boxShadow: '0px 0px 20px rgba(0,0,0,0.08)',
                backgroundColor: 'rgba(244,244,244,0.6)',
                border: '1px solid #e5e7eb'
              }}
          >
            <div 
              className="flex items-center justify-between mb-6"
              style={{
                width: '100%', overflow: 'hidden',
                minHeight: '60px',
                padding: '1rem',
                gap: '1.5rem'
              }}
            >
              <h2 
                className="text-[25px] font-medium leading-[34px] text-[#01253F] font-avenir"
                style={{
                  width: 'auto',
                  minHeight: '34px',
                  fontFamily: 'Avenir',
                  fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
                  fontWeight: 500,
                  lineHeight: '1.4',
                  letterSpacing: '0%',
                  textAlign: 'left'
                }}
              >
                Analytics
              </h2>
              <div 
                className="flex items-center space-x-2"
                style={{
                  width: 'auto',
                  minHeight: '40px',
                  gap: '0.5rem'
                }}
              >
                <button 
                  onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Expand to full screen"
                  style={{
                    width: '40px',
                    height: '40px',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded transition-colors" 
                  title="Download data"
                  style={{
                    width: '40px',
                    height: '40px',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              style={{
                width: '100%', overflow: 'hidden',
                minHeight: 'auto',
                gap: '1.5rem',
                maxWidth: '1160px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr'
              }}
            >
              {/* Metrics Grid - Left Side (2x2) */}
              <div 
                className="grid grid-cols-2 gap-4"
                style={{
                  width: '100%', overflow: 'hidden',
                  minHeight: 'auto',
                  gap: '1rem',
                  padding: '1rem',
                  maxWidth: '100%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr'
                }}
              >
                <div 
                  className="text-center p-6 rounded-[35px] bg-white shadow-[0px_8.8px_35.4px_rgba(0,0,0,0.05)] border-[1.77px] border-gray-200"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: '150px',
                    padding: '1rem',
                    borderRadius: '20px',
                    boxShadow: '0px 8px 32px rgba(0,0,0,0.08)',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div 
                    className="flex items-center justify-between mb-2"
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: '40px',
                      gap: '1rem'
                    }}
                  >
                    <h3 
                      className="text-lg font-bold text-[#01253F]"
                      style={{
                        width: 'auto',
                        minHeight: '40px',
                        fontFamily: 'Avenir',
                        fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                        fontWeight: 700,
                        lineHeight: '1.4',
                        letterSpacing: '0%',
                        textAlign: 'left'
                      }}
                    >
                      77
                    </h3>
                    <span 
                      className="text-gray-400 text-sm"
                      style={{
                        width: 'auto',
                        minHeight: '24px',
                        fontFamily: 'Avenir',
                        fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                        fontWeight: 400,
                        lineHeight: '1.5',
                        letterSpacing: '0%',
                        textAlign: 'left',
                        color: '#6b7280'
                      }}
                    >
                      /100
                    </span>
                    <div 
                      className="relative group"
                      style={{
                        width: 'auto',
                        minHeight: '24px'
                      }}
                    >
                      <Info 
                        className="w-3 h-3 text-gray-400 cursor-help" 
                        style={{
                          width: 'clamp(1rem, 2vw, 1.5rem)',
                          height: 'clamp(1rem, 2vw, 1.5rem)',
                          color: '#6b7280'
                        }}
                      />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Measures the overall workplace environment quality and employee satisfaction
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <p 
                    className="text-gray-600 text-xs font-avenir"
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: '24px',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 400,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'left',
                      color: '#374151'
                    }}
                  >
                    Environment Score
                  </p>
                </div>
                <div 
                  className="text-center p-6 rounded-[35px] bg-white shadow-[0px_8.8px_35.4px_rgba(0,0,0,0.05)] border-[1.77px] border-gray-200"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: '150px',
                    maxWidth: '100%',
                    padding: '1rem',
                    borderRadius: '20px',
                    boxShadow: '0px 8px 32px rgba(0,0,0,0.08)',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div 
                    className="flex items-center justify-between mb-2"
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: '40px',
                      gap: '1rem'
                    }}
                  >
                    <h3 
                      className="text-lg font-bold text-[#01253F]"
                      style={{
                        width: 'auto',
                        minHeight: '40px',
                        fontFamily: 'Avenir',
                        fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                        fontWeight: 700,
                        lineHeight: '1.4',
                        letterSpacing: '0%',
                        textAlign: 'left'
                      }}
                    >
                      64
                    </h3>
                    <span 
                      className="text-gray-400 text-sm"
                      style={{
                        width: 'auto',
                        minHeight: '24px',
                        fontFamily: 'Avenir',
                        fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                        fontWeight: 400,
                        lineHeight: '1.5',
                        letterSpacing: '0%',
                        textAlign: 'left',
                        color: '#6b7280'
                      }}
                    >
                      /100
                    </span>
                    <div 
                      className="relative group"
                      style={{
                        width: 'auto',
                        minHeight: '24px'
                      }}
                    >
                      <Info 
                        className="w-3 h-3 text-gray-400 cursor-help" 
                        style={{
                          width: 'clamp(1rem, 2vw, 1.5rem)',
                          height: 'clamp(1rem, 2vw, 1.5rem)',
                          color: '#6b7280'
                        }}
                      />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Tracks how consistently patients receive care from the same healthcare providers
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <p 
                    className="text-gray-600 text-xs font-avenir"
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: '24px',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 400,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'left',
                      color: '#374151'
                    }}
                  >
                    Continuity of Care Index
                  </p>
                </div>
                <div 
                  className="text-center p-6 rounded-[35px] bg-white shadow-[0px_8.8px_35.4px_rgba(0,0,0,0.05)] border-[1.77px] border-gray-200"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: '150px',
                    maxWidth: '100%',
                    padding: '1rem',
                    borderRadius: '20px',
                    boxShadow: '0px 8px 32px rgba(0,0,0,0.08)',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div 
                    className="flex items-center justify-between mb-2"
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: '40px',
                      gap: '1rem'
                    }}
                  >
                    <h3 
                      className="text-lg font-bold text-[#01253F]"
                      style={{
                        width: 'auto',
                        minHeight: '40px',
                        fontFamily: 'Avenir',
                        fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                        fontWeight: 700,
                        lineHeight: '1.4',
                        letterSpacing: '0%',
                        textAlign: 'left'
                      }}
                    >
                      86%
                    </h3>
                    <div 
                      className="relative group"
                      style={{
                        width: 'auto',
                        minHeight: '24px'
                      }}
                    >
                      <Info 
                        className="w-3 h-3 text-gray-400 cursor-help" 
                        style={{
                          width: 'clamp(1rem, 2vw, 1.5rem)',
                          height: 'clamp(1rem, 2vw, 1.5rem)',
                          color: '#6b7280'
                        }}
                      />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Percentage of job candidates with high compatibility scores
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <p 
                    className="text-gray-600 text-xs font-avenir"
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: '24px',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 400,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'left',
                      color: '#374151'
                    }}
                  >
                    Strong Matches
                  </p>
                </div>
                <div 
                  className="text-center p-6 rounded-[35px] bg-white shadow-[0px_8.8px_35.4px_rgba(0,0,0,0.05)] border-[1.77px] border-gray-200"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: '150px',
                    maxWidth: '100%',
                    padding: '1rem',
                    borderRadius: '20px',
                    boxShadow: '0px 8px 32px rgba(0,0,0,0.08)',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div 
                    className="flex items-center justify-between mb-2"
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: '40px',
                      gap: '1rem'
                    }}
                  >
                    <h3 
                      className="text-lg font-bold text-[#01253F]"
                      style={{
                        width: 'auto',
                        minHeight: '40px',
                        fontFamily: 'Avenir',
                        fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                        fontWeight: 700,
                        lineHeight: '1.4',
                        letterSpacing: '0%',
                        textAlign: 'left'
                      }}
                    >
                      +34%
                    </h3>
                    <div 
                      className="relative group"
                      style={{
                        width: 'auto',
                        minHeight: '24px'
                      }}
                    >
                      <Info 
                        className="w-3 h-3 text-gray-400 cursor-help" 
                        style={{
                          width: 'clamp(1rem, 2vw, 1.5rem)',
                          height: 'clamp(1rem, 2vw, 1.5rem)',
                          color: '#6b7280'
                        }}
                      />
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Positive trend in overall organizational performance and engagement
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <p 
                    className="text-gray-600 text-xs font-avenir"
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: '24px',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 400,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'left',
                      color: '#374151'
                    }}
                  >
                    Pulse Trends
                  </p>
                </div>
              </div>

              {/* Insights Section - Right Side */}
              <div 
                className="bg-white rounded-xl shadow-sm border p-6"
                style={{
                  width: '100%', overflow: 'hidden',
                  minHeight: 'auto',
                  padding: '1rem',
                  borderRadius: '20px',
                  boxShadow: '0px 8px 32px rgba(0,0,0,0.08)',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}
              >
                <div 
                  className="flex items-center justify-between mb-6"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: '60px',
                    padding: '1rem',
                    gap: '1.5rem'
                  }}
                >
                  <h2 
                    className="text-[25px] font-medium leading-[34px] text-[#01253F] font-avenir"
                    style={{
                      width: 'auto',
                      minHeight: '34px',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
                      fontWeight: 500,
                      lineHeight: '1.4',
                      letterSpacing: '0%',
                      textAlign: 'left'
                    }}
                  >
                    Insights
                  </h2>
                  <div 
                    className="flex items-center space-x-2"
                    style={{
                      width: 'auto',
                      minHeight: '40px',
                      gap: '0.5rem'
                    }}
                  >
                    <button 
                      onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Expand to full screen"
                      style={{
                        width: '40px',
                        height: '40px',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <Maximize2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      className="p-2 hover:bg-gray-100 rounded transition-colors" 
                      title="Download data"
                      style={{
                        width: '40px',
                        height: '40px',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div 
                  className="space-y-4"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: 'auto',
                    gap: '2rem',
                    padding: '1rem',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: 'auto',
                      gap: '1rem'
                    }}
                  >
                    <div 
                      className="flex items-center justify-between mb-2"
                      style={{
                        width: '100%', overflow: 'hidden',
                        minHeight: '40px',
                        gap: '1rem'
                      }}
                    >
                      <span 
                        className="text-sm font-medium text-gray-700"
                        style={{
                          width: 'auto',
                          minHeight: '24px',
                          fontFamily: 'Avenir',
                          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                          fontWeight: 500,
                          lineHeight: '1.5',
                          letterSpacing: '0%',
                          textAlign: 'left',
                          color: '#374151'
                        }}
                      >
                        Work Environment Score
                      </span>
                      <span 
                        className="text-sm text-gray-600"
                        style={{
                          width: 'auto',
                          minHeight: '24px',
                          fontFamily: 'Avenir',
                          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                          fontWeight: 400,
                          lineHeight: '1.5',
                          letterSpacing: '0%',
                          textAlign: 'right',
                          color: '#6b7280'
                        }}
                      >
                        74%
                      </span>
                    </div>
                    <div 
                      className="w-full bg-gray-200 rounded-full h-2"
                      style={{
                        width: '100%', overflow: 'hidden',
                        height: '8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px'
                      }}
                    >
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: '74%', 
                          height: '8px',
                          borderRadius: '4px',
                          background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div 
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: 'auto',
                      gap: '1rem'
                    }}
                  >
                    <div 
                      className="flex items-center justify-between mb-2"
                      style={{
                        width: '100%', overflow: 'hidden',
                        minHeight: '40px',
                        gap: '1rem'
                      }}
                    >
                      <span 
                        className="text-sm font-medium text-gray-700"
                        style={{
                          width: 'auto',
                          minHeight: '24px',
                          fontFamily: 'Avenir',
                          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                          fontWeight: 500,
                          lineHeight: '1.5',
                          letterSpacing: '0%',
                          textAlign: 'left',
                          color: '#374151'
                        }}
                      >
                        High Retention Forecast
                      </span>
                      <span 
                        className="text-sm text-gray-600"
                        style={{
                          width: 'auto',
                          minHeight: '24px',
                          fontFamily: 'Avenir',
                          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                          fontWeight: 400,
                          lineHeight: '1.5',
                          letterSpacing: '0%',
                          textAlign: 'right',
                          color: '#6b7280'
                        }}
                      >
                        52%
                      </span>
                    </div>
                    <div 
                      className="w-full bg-gray-200 rounded-full h-2"
                      style={{
                        width: '100%', overflow: 'hidden',
                        height: '8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px'
                      }}
                    >
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: '52%', 
                          height: '8px',
                          borderRadius: '4px',
                          background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div 
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: 'auto',
                      gap: '1rem'
                    }}
                  >
                    <div 
                      className="flex items-center justify-between mb-2"
                      style={{
                        width: '100%', overflow: 'hidden',
                        minHeight: '40px',
                        gap: '1rem'
                      }}
                    >
                      <span 
                        className="text-sm font-medium text-gray-700"
                        style={{
                          width: 'auto',
                          minHeight: '24px',
                          fontFamily: 'Avenir',
                          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                          fontWeight: 500,
                          lineHeight: '1.5',
                          letterSpacing: '0%',
                          textAlign: 'left',
                          color: '#374151'
                        }}
                      >
                        Behavioral Risk Flags
                      </span>
                      <span 
                        className="text-sm text-gray-600"
                        style={{
                          width: 'auto',
                          minHeight: '24px',
                          fontFamily: 'Avenir',
                          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                          fontWeight: 400,
                          lineHeight: '1.5',
                          letterSpacing: '0%',
                          textAlign: 'right',
                          color: '#6b7280'
                        }}
                      >
                        36%
                      </span>
                    </div>
                    <div 
                      className="w-full bg-gray-200 rounded-full h-2"
                      style={{
                        width: '100%', overflow: 'hidden',
                        height: '8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px'
                      }}
                    >
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: '36%', 
                          height: '8px',
                          borderRadius: '4px',
                          background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div 
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: 'auto',
                      gap: '1rem'
                    }}
                  >
                    <div 
                      className="flex items-center justify-between mb-2"
                      style={{
                        width: '100%', overflow: 'hidden',
                        minHeight: '40px',
                        gap: '1rem'
                      }}
                    >
                      <span 
                        className="text-sm font-medium text-gray-700"
                        style={{
                          width: 'auto',
                          minHeight: '24px',
                          fontFamily: 'Avenir',
                          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                          fontWeight: 500,
                          lineHeight: '1.5',
                          letterSpacing: '0%',
                          textAlign: 'left',
                          color: '#374151'
                        }}
                      >
                        Culture Fit Alignment
                      </span>
                      <span 
                        className="text-sm text-gray-600"
                        style={{
                          width: 'auto',
                          minHeight: '24px',
                          fontFamily: 'Avenir',
                          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                          fontWeight: 400,
                          lineHeight: '1.5',
                          letterSpacing: '0%',
                          textAlign: 'right',
                          color: '#6b7280'
                        }}
                      >
                        36%
                      </span>
                    </div>
                    <div 
                      className="w-full bg-gray-200 rounded-full h-2"
                      style={{
                        width: '100%', overflow: 'hidden',
                        height: '8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px'
                      }}
                    >
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: '36%', 
                          height: '8px',
                          borderRadius: '4px',
                          background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Jobs/Matches/Applicants Container - Stacked below */}
          <div 
            className="p-6"
            style={{
              width: '100%', overflow: 'hidden',
              minHeight: 'auto',
              padding: '1rem',
              gap: '1.5rem',
              maxWidth: '1160px',
              maxHeight: '800px'
            }}
          >
            <div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8" 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1.5rem',
                width: '100%', overflow: 'hidden',
                minHeight: 'auto',
                maxWidth: '1120px'
              }}
            >
              {/* Open Jobs Section - Left Side (Full Height) */}
              <div 
                className="bg-[rgba(244,244,244,0.6)] rounded-xl shadow-sm border p-6" 
                style={{ 
                  minWidth: '300px',
                  width: '100%', overflow: 'hidden',
                  minHeight: 'auto',
                  padding: '1rem',
                  borderRadius: '20px',
                  boxShadow: '0px 8px 32px rgba(0,0,0,0.08)',
                  backgroundColor: 'rgba(244,244,244,0.6)',
                  border: '1px solid #e5e7eb',
                  maxWidth: '560px'
                }}
              >
                <h2 
                  className="text-[25px] font-black leading-[154%] text-[#01253F] mb-6 font-avenir"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: '40px',
                    fontFamily: 'Avenir',
                    fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
                    fontWeight: 900,
                    lineHeight: '1.4',
                    letterSpacing: '0%',
                    textAlign: 'left',
                    color: '#01253F'
                  }}
                >
                  Open Jobs
                </h2>
                <div 
                  className="space-y-3"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: 'auto',
                    gap: '1rem'
                  }}
                >
                  {demoJobs.map((job) => (
                    <div 
                      key={job.id} 
                      className="p-3 border bg-white" 
                      style={{ 
                        width: '80%', overflow: 'hidden', 
                        minHeight: '150px',
                        maxWidth: '80%',
                        borderRadius: '16px',
                        padding: '1rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0px 4px 16px rgba(0,0,0,0.05)',
                        margin: '0 auto'
                      }}
                    >
                      <div 
                        className="flex items-start justify-between mb-2"
                        style={{
                          width: '100%', overflow: 'hidden',
                          minHeight: '80px',
                          gap: '1rem'
                        }}
                      >
                        <div 
                          className="flex-1"
                          style={{
                            width: '100%', overflow: 'hidden',
                            minHeight: '80px',
                            gap: '1rem'
                          }}
                        >
                          <div 
                            className="flex items-center space-x-2 mb-1"
                            style={{
                              width: '100%', overflow: 'hidden',
                              minHeight: '40px',
                              gap: '0.5rem'
                            }}
                          >
                            <h4 
                              className="font-bold text-[20px] leading-[130%] text-[#2466D0]"
                              style={{
                                width: 'auto',
                                minHeight: '40px',
                                fontFamily: 'Avenir',
                                fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
                                fontWeight: 700,
                                lineHeight: '1.4',
                                letterSpacing: '0%',
                                textAlign: 'left',
                                color: '#2466D0'
                              }}
                            >
                              {job.title}
                            </h4>
                            <Edit3 
                              className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                              onClick={() => handleJobEdit(job)}
                              style={{
                                width: 'clamp(1rem, 2vw, 1.5rem)',
                                height: 'clamp(1rem, 2vw, 1.5rem)',
                                color: '#6b7280'
                              }}
                            />
                          </div>
                          <p 
                            className="text-[#01253F] text-[14px] font-bold leading-[20px] font-avenir"
                            style={{
                              width: '100%', overflow: 'hidden',
                              minHeight: '24px',
                              fontFamily: 'Avenir',
                              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                              fontWeight: 700,
                              lineHeight: '1.5',
                              letterSpacing: '0%',
                              textAlign: 'left',
                              color: '#01253F'
                            }}
                          >
                            {job.company}
                          </p>
                        </div>
                      </div>
                      <div 
                        className="flex items-center justify-between"
                        style={{
                          width: '100%', overflow: 'hidden',
                          minHeight: '80px',
                          gap: '1rem'
                        }}
                      >
                        <div 
                          className="flex-1"
                          style={{
                            width: '100%', overflow: 'hidden',
                            minHeight: '80px',
                            gap: '1rem'
                          }}
                        >
                          <p 
                            className="text-[#01253F] text-[13px] font-normal leading-[18px] font-avenir"
                            style={{
                              width: '100%', overflow: 'hidden',
                              minHeight: '24px',
                              fontFamily: 'Avenir',
                              fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
                              fontWeight: 400,
                              lineHeight: '1.5',
                              letterSpacing: '0%',
                              textAlign: 'left',
                              color: '#01253F'
                            }}
                          >
                            {job.location}
                          </p>
                          <p 
                            className="text-[#01253F] text-[13px] font-normal leading-[18px] font-avenir"
                            style={{
                              width: '100%', overflow: 'hidden',
                              minHeight: '24px',
                              fontFamily: 'Avenir',
                              fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
                              fontWeight: 400,
                              lineHeight: '1.5',
                              letterSpacing: '0%',
                              textAlign: 'left',
                              color: '#01253F'
                            }}
                          >
                            {job.salary}
                          </p>
                        </div>
                        <div 
                          className="relative"
                          style={{
                            width: 'auto',
                            minHeight: '80px'
                          }}
                        >
                          <button 
                            onClick={() => handleViewApplicants(job)}
                            className="text-white text-xs rounded transition-colors hover:opacity-90" 
                            style={{ 
                              backgroundColor: '#2CB3BF',
                              width: 'auto',
                              minHeight: '40px',
                              borderRadius: '8px',
                              padding: '0.5rem 1rem',
                              gap: '0.5rem',
                              fontFamily: 'Avenir',
                              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                              fontWeight: 500,
                              lineHeight: '1.5',
                              letterSpacing: '0%',
                              textAlign: 'center',
                              color: '#ffffff'
                            }}
                          >
                            View Applicants
                          </button>
                          <span 
                            className="absolute -top-1.5 -right-1.5 bg-[#01253F] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[12px] font-bold leading-[100%]"
                            style={{
                              width: 'clamp(1.25rem, 2vw, 1.5rem)',
                              height: 'clamp(1.25rem, 2vw, 1.5rem)',
                              backgroundColor: '#01253F',
                              borderRadius: '50%',
                              fontFamily: 'Avenir',
                              fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
                              fontWeight: 700,
                              lineHeight: '1',
                              letterSpacing: '0%',
                              textAlign: 'center',
                              color: '#ffffff'
                            }}
                          >
                            {job.applicants}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                <div 
                  className="flex items-center justify-center space-x-2 mt-6"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: '80px',
                    gap: '1rem',
                    padding: '1rem'
                  }}
                >
                  <button 
                    onClick={() => handlePageChange(1)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      currentPage === 1 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={currentPage === 1 ? { 
                      backgroundColor: '#01253F',
                      width: 'clamp(2rem, 4vw, 2.5rem)',
                      height: 'clamp(2rem, 4vw, 2.5rem)',
                      borderRadius: '50%',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'center',
                      color: '#ffffff'
                    } : {
                      width: 'clamp(2rem, 4vw, 2.5rem)',
                      height: 'clamp(2rem, 4vw, 2.5rem)',
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'center',
                      color: '#374151'
                    }}
                  >
                    1
                  </button>
                  <button 
                    onClick={() => handlePageChange(2)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      currentPage === 2 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={currentPage === 2 ? { 
                      backgroundColor: '#01253F',
                      width: 'clamp(2rem, 4vw, 2.5rem)',
                      height: 'clamp(2rem, 4vw, 2.5rem)',
                      borderRadius: '50%',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'center',
                      color: '#ffffff'
                    } : {
                      width: 'clamp(2rem, 4vw, 2.5rem)',
                      height: 'clamp(2rem, 4vw, 2.5rem)',
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'center',
                      color: '#374151'
                    }}
                  >
                    2
                  </button>
                  <button 
                    onClick={() => handlePageChange(3)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      currentPage === 3 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={currentPage === 3 ? { 
                      backgroundColor: '#01253F',
                      width: 'clamp(2rem, 4vw, 2.5rem)',
                      height: 'clamp(2rem, 4vw, 2.5rem)',
                      borderRadius: '50%',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'center',
                      color: '#ffffff'
                    } : {
                      width: 'clamp(2rem, 4vw, 2.5rem)',
                      height: 'clamp(2rem, 4vw, 2.5rem)',
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'center',
                      color: '#374151'
                    }}
                  >
                    3
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage < 3 ? currentPage + 1 : 3)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    style={{
                      width: 'auto',
                      minHeight: 'clamp(2rem, 4vw, 2.5rem)',
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      fontFamily: 'Avenir',
                      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      letterSpacing: '0%',
                      textAlign: 'center',
                      color: '#374151',
                      padding: '0 1rem'
                    }}
                  >
                    Next &gt;
                  </button>
                </div>
              </div>

              {/* Right Side - Matches and Applicants Stacked */}
              <div 
                className="space-y-6" 
                style={{ 
                  minWidth: '300px',
                  width: '100%', overflow: 'hidden',
                  minHeight: 'auto',
                  gap: '1.5rem',
                  maxWidth: '560px'
                }}
              >
                {/* Matches Section - Top Right (Half Height) */}
                <div 
                  className="bg-[rgba(244,244,244,0.6)] rounded-xl shadow-sm border p-6"
                  style={{
                    width: '100%', overflow: 'hidden',
                    minHeight: 'auto',
                    padding: '1rem',
                    borderRadius: '20px',
                    boxShadow: '0px 8px 32px rgba(0,0,0,0.08)',
                    backgroundColor: 'rgba(244,244,244,0.6)',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div 
                    className="flex items-center justify-between mb-4"
                    style={{
                      width: '100%', overflow: 'hidden',
                      minHeight: '60px',
                      padding: '1rem',
                      gap: '1.5rem'
                    }}
                  >
                    <h2 
                      className="text-[25px] font-black leading-[154%] text-[#2466D0] font-avenir"
                      style={{
                        width: 'auto',
                        minHeight: '40px',
                        fontFamily: 'Avenir',
                        fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
                        fontWeight: 900,
                        lineHeight: '1.4',
                        letterSpacing: '0%',
                        textAlign: 'left',
                        color: '#2466D0'
                      }}
                    >
                      Matches
                    </h2>
                    <div 
                      className="flex items-center space-x-2"
                      style={{
                        width: '120px',
                        height: '40px',
                        gap: '8px'
                      }}
                    >
                      <button 
                        className="p-2 hover:bg-gray-100 rounded transition-colors" 
                        title="Download data"
                        style={{
                          width: '40px',
                          height: '40px',
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded transition-colors" 
                        title="Expand to full screen"
                        style={{
                          width: '40px',
                          height: '40px',
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <Maximize2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div 
                    className="space-y-2"
                    style={{
                      width: '100%',
                      height: 'auto',
                      gap: '16px',
                      padding: '20px'
                    }}
                  >
                    {[1, 2].map((item) => (
                      <div 
                        key={item} 
                        className="flex items-center justify-between p-4 border bg-white" 
                        style={{ 
                          width: '80%', 
                          height: '200px', 
                          borderRadius: '16px',
                          padding: '20px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0px 4px 16px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div 
                          className="flex items-center space-x-4"
                          style={{
                            width: '400px',
                            height: '160px',
                            gap: '16px'
                          }}
                        >
                          <div 
                            className="w-12 h-12 rounded-full overflow-hidden"
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '24px'
                            }}
                          >
                            <img src="/user-icon.png" alt="User Profile" className="w-full h-full object-cover" />
                          </div>
                          <div 
                            style={{
                              width: '336px',
                              height: '160px',
                              gap: '16px'
                            }}
                          >
                            <h4 
                              className="font-bold text-[#01253F] text-sm mb-1"
                              style={{
                                width: '336px',
                                height: '40px',
                                fontFamily: 'Avenir',
                                fontSize: '16px',
                                fontWeight: 700,
                                lineHeight: '40px',
                                letterSpacing: '0%',
                                textAlign: 'left',
                                color: '#01253F'
                              }}
                            >
                              Marvin Grant
                            </h4>
                            <p 
                              className="font-bold text-[#01253F] text-xs mb-2"
                              style={{
                                width: '336px',
                                height: '24px',
                                fontFamily: 'Avenir',
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: '24px',
                                letterSpacing: '0%',
                                textAlign: 'left',
                                color: '#01253F'
                              }}
                            >
                              5+ years experience
                            </p>
                            <p 
                              className="text-gray-500 text-xs"
                              style={{
                                width: '336px',
                                height: '24px',
                                fontFamily: 'Avenir',
                                fontSize: '14px',
                                fontWeight: 400,
                                lineHeight: '24px',
                                letterSpacing: '0%',
                                textAlign: 'left',
                                color: '#6b7280'
                              }}
                            >
                              New Haven, CT
                            </p>
                          </div>
                        </div>
                        <div 
                          className="flex flex-col items-end space-y-2"
                          style={{
                            width: '200px',
                            height: '160px',
                            gap: '16px'
                          }}
                        >
                          <div 
                            className="flex items-center justify-center px-[8px] py-[6px] rounded-[40px]"
                            style={{
                              width: '120px',
                              height: '32px',
                              backgroundColor: '#F4F4F4',
                              gap: '8px',
                              borderRadius: '16px',
                              padding: '8px 16px'
                            }}
                          >
                            <span 
                              className="text-[#2466D0] font-avenir font-extrabold text-[11px] leading-[100%]"
                              style={{
                                fontFamily: 'Avenir',
                                fontWeight: 800,
                                fontStyle: 'normal',
                                letterSpacing: '0%',
                                fontSize: '14px',
                                lineHeight: '16px',
                                color: '#2466D0'
                              }}
                            >
                              Matched
                            </span>
                            <div 
                              className="w-2.5 h-2.5 bg-[#2466D0] rounded-full flex items-center justify-center"
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#2466D0',
                                borderRadius: '8px'
                              }}
                            >
                              <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20" style={{ width: '12px', height: '12px' }}>
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <button 
                            className="text-white text-xs rounded transition-colors" 
                            style={{ 
                              backgroundColor: '#2CB3BF',
                              width: '120px',
                              height: '32px',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              gap: '8px',
                              fontFamily: 'Avenir',
                              fontSize: '14px',
                              fontWeight: 500,
                              lineHeight: '16px',
                              letterSpacing: '0%',
                              textAlign: 'center',
                              color: '#ffffff'
                            }}
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Applicants Section - Bottom Right (Half Height) */}
                <div 
                  className="bg-[rgba(244,244,244,0.6)] rounded-xl shadow-sm border p-6"
                  style={{
                    width: '744px',
                    height: '960px',
                    padding: '20px',
                    borderRadius: '20px',
                    boxShadow: '0px 8px 32px rgba(0,0,0,0.08)',
                    backgroundColor: 'rgba(244,244,244,0.6)',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div 
                    className="flex items-center justify-between mb-4"
                    style={{
                      width: '100%',
                      height: '60px',
                      padding: '20px',
                      gap: '20px'
                    }}
                  >
                    <h2 
                      className="text-[25px] font-black leading-[154%] text-[#01253F] font-avenir"
                      style={{
                        width: '200px',
                        height: '40px',
                        fontFamily: 'Avenir',
                        fontSize: '25px',
                        fontWeight: 900,
                        lineHeight: '40px',
                        letterSpacing: '0%',
                        textAlign: 'left',
                        color: '#01253F'
                      }}
                    >
                      Applicants
                    </h2>
                    <div 
                      className="flex items-center space-x-2"
                      style={{
                        width: '120px',
                        height: '40px',
                        gap: '8px'
                      }}
                    >
                      <button 
                        className="p-2 hover:bg-gray-100 rounded transition-colors" 
                        title="Download data"
                        style={{
                          width: '40px',
                          height: '40px',
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded transition-colors" 
                        title="Expand to full screen"
                        style={{
                          width: '40px',
                          height: '40px',
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <Maximize2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div 
                    className="space-y-2"
                    style={{
                      width: '100%',
                      height: 'auto',
                      gap: '16px',
                      padding: '20px'
                    }}
                  >
                    {[1, 2].map((item) => (
                      <div 
                        key={item} 
                        className="flex items-center justify-between p-4 border bg-white" 
                        style={{ 
                          width: '80%', 
                          height: '200px', 
                          borderRadius: '16px',
                          padding: '20px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0px 4px 16px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div 
                          className="flex items-center space-x-4"
                          style={{
                            width: '400px',
                            height: '160px',
                            gap: '16px'
                          }}
                        >
                          <div 
                            className="w-12 h-12 rounded-full overflow-hidden"
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '24px'
                            }}
                          >
                            <img src="/user-icon.png" alt="User Profile" className="w-full h-full object-cover" />
                          </div>
                          <div 
                            style={{
                              width: '336px',
                              height: '160px',
                              gap: '16px'
                            }}
                          >
                            <h4 
                              className="font-bold text-[#01253F] text-sm mb-1"
                              style={{
                                width: '336px',
                                height: '40px',
                                fontFamily: 'Avenir',
                                fontSize: '16px',
                                fontWeight: 700,
                                lineHeight: '40px',
                                letterSpacing: '0%',
                                textAlign: 'left',
                                color: '#01253F'
                              }}
                            >
                              Marvin Grant
                            </h4>
                            <p 
                              className="font-bold text-[#01253F] text-xs mb-2"
                              style={{
                                width: '336px',
                                height: '24px',
                                fontFamily: 'Avenir',
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: '24px',
                                letterSpacing: '0%',
                                textAlign: 'left',
                                color: '#01253F'
                              }}
                            >
                              5+ years experience
                            </p>
                            <p 
                              className="text-gray-500 text-xs"
                              style={{
                                width: '336px',
                                height: '24px',
                                fontFamily: 'Avenir',
                                fontSize: '14px',
                                fontWeight: 400,
                                lineHeight: '24px',
                                letterSpacing: '0%',
                                textAlign: 'left',
                                color: '#6b7280'
                              }}
                            >
                              New Haven, CT
                            </p>
                          </div>
                        </div>
                        <button 
                          className="text-white text-xs rounded transition-colors" 
                          style={{ 
                            backgroundColor: '#2CB3BF',
                            width: '120px',
                            height: '32px',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            gap: '8px',
                            fontFamily: 'Avenir',
                            fontSize: '14px',
                            fontWeight: 500,
                            lineHeight: '16px',
                            letterSpacing: '0%',
                            textAlign: 'center',
                            color: '#ffffff'
                          }}
                        >
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

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>All notifications cleared!</span>
          </div>
        </div>
      )}

      {/* Job Edit Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Edit Job: {selectedJob.title}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input 
                  type="text" 
                  defaultValue={selectedJob.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                <input 
                  type="text" 
                  defaultValue={selectedJob.salary}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowJobModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowJobModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Applicants Modal */}
      {showApplicantsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Applicants for {selectedJob.title}</h3>
            <div className="space-y-4">
              {demoApplicants.map((applicant) => (
                <div key={applicant.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{applicant.name}</h4>
                      <p className="text-gray-600">{applicant.role}</p>
                      <p className="text-gray-600">{applicant.experience}</p>
                      <p className="text-gray-600">{applicant.location}</p>
                      <p className="text-sm text-gray-500">Applied {applicant.appliedDate}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        View Profile
                      </button>
                      <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button 
                onClick={() => setShowApplicantsModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile View Modal */}
      {showProfileModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Profile: {selectedMatch.name}</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-gray-600" />
                <span>{selectedMatch.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                <span>Match Score: {selectedMatch.matchScore}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-600" />
                <span>{selectedMatch.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <span>{selectedMatch.experience}</span>
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Message</span>
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </button>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  );
};

export default YourPipelinePage;
