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
  ExternalLink
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
      title: "Registered Nurse",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "75k/yr - 85k/yr",
      applicants: 4,
      status: "Active"
    },
    {
      id: 3,
      title: "Registered Nurse",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "75k/yr - 85k/yr",
      applicants: 4,
      status: "Active"
    },
    {
      id: 4,
      title: "Registered Nurse",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "75k/yr - 85k/yr",
      applicants: 4,
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
      name: "Marvin Grant",
      role: "Registered Nurse", 
      experience: "5+ years experience",
      location: "New Haven, CT",
      matchScore: 87,
      status: "Matched"
    },
    {
      id: 3,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT",
      matchScore: 92,
      status: "Matched"
    }
  ];

  const demoApplicants = [
    {
      id: 1,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "2 days ago"
    },
    {
      id: 2,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    },
    {
      id: 3,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT",
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

  const handleNewJobPost = () => {
    // Handle new job post functionality
    console.log('New job post clicked');
  };

  // TEMPORARILY DISABLED: Check authentication and authorization only once
  useEffect(() => {
    // TEMPORARILY DISABLED FOR DEVELOPMENT
    setAuthChecked(true);
    setIsAuthorized(true);
    
    /* ORIGINAL AUTH CODE - COMMENTED OUT
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
    */
  }, [user, router, authChecked]);

  // TEMPORARILY DISABLED: Show loading while checking authentication
  /* ORIGINAL AUTH LOADING - COMMENTED OUT
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
  */

  // User is authorized, show the dashboard
  return (
    <BaseLayout>
      {/* Admin Navigation - Only show for admin users */}
      {user?.role === 'ADMIN' && <AdminDashboardNav />}

      {/* Page Header */}
      <div className="w-full py-8 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <h1 className="text-[76.6971px] font-bold leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            YourPipeline
          </h1>
          {user?.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium text-center lg:text-left mt-2">Admin Access - Employee/User Dashboard</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1200px] mx-auto px-8 pb-12" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Company Header and Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-[30px] font-black leading-[154%] text-[#01253F] font-avenir">
              St. Mary's Health Center
            </h2>
            {user?.role === 'ADMIN' && (
              <p className="text-sm text-blue-600 font-medium mt-1">Admin Access - Employee/User Dashboard</p>
            )}
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleNotificationClick}
              className="text-sm font-medium flex items-center transition-colors shadow-sm relative bg-white hover:bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 text-gray-600"
              style={{
                gap: '8px',
                fontFamily: 'Avenir'
              }}
            >
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="font-avenir">Notifications</span>
              {notifications > 0 && (
                <span className="absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#01253F' }}>
                  {notifications}
                </span>
              )}
            </button>
            <button 
              onClick={handleNewJobPost}
              className="text-sm font-medium flex items-center transition-colors shadow-sm bg-white hover:bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 text-gray-600"
              style={{
                gap: '8px',
                fontFamily: 'Avenir'
              }}
            >
              <span className="font-avenir">New Job Post</span>
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Analytics Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[25px] font-medium leading-[34px] text-[#01253F] font-avenir">
              Analytics
            </h2>
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 hover:bg-gray-100 rounded transition-colors" 
                title="Download data"
              >
                <Download className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Expand to full screen"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Metrics Grid - Left Side (2x2) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-[#01253F]">77</h3>
                  <span className="text-gray-400 text-sm">/100</span>
                  <div className="relative group">
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Measures the overall workplace environment quality and employee satisfaction
                      <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-avenir">Environment Score</p>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-[#01253F]">64</h3>
                  <span className="text-gray-400 text-sm">/100</span>
                  <div className="relative group">
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Tracks how consistently patients receive care from the same healthcare providers
                      <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-avenir">Continuity of Care Index</p>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-[#01253F]">86%</h3>
                  <div className="relative group">
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Percentage of job candidates with high compatibility scores
                      <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-avenir">Strong Matches</p>
                <div className="mt-2">
                  <svg className="w-full h-6" viewBox="0 0 100 20">
                    <path d="M5,15 Q25,5 45,10 T85,8" stroke="#2466D0" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-[#01253F]">+34%</h3>
                  <div className="relative group">
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Positive trend in overall organizational performance and engagement
                      <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-avenir">Pulse Trends</p>
                <div className="mt-2">
                  <svg className="w-full h-6" viewBox="0 0 100 20">
                    <path d="M5,15 Q25,8 45,12 T85,5" stroke="#2466D0" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Insights Section - Right Side */}
            <div className="col-span-2 bg-gray-50 rounded-xl border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[25px] font-medium leading-[34px] text-[#01253F] font-avenir">
                  Insights
                </h2>
                <div className="flex items-center space-x-2">
                  <button 
                    className="p-2 hover:bg-gray-100 rounded transition-colors" 
                    title="Download data"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Expand to full screen"
                  >
                    <Maximize2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Progress Bars */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Work Environment Score</span>
                    <span className="text-sm text-gray-600">74%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: '74%', 
                        background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">High Retention Forecast</span>
                    <span className="text-sm text-gray-600">52%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: '52%', 
                        background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Behavioral Risk Flags</span>
                    <span className="text-sm text-gray-600">36%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: '36%', 
                        background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Work Environment Score</span>
                    <span className="text-sm text-gray-600">36%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: '36%', 
                        background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Culture Fit Alignment</span>
                    <span className="text-sm text-gray-600">36%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: '36%', 
                        background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Three Column Layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Open Jobs Section - Left Column */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[25px] font-black leading-[154%] text-[#01253F] font-avenir">
                Open Jobs
              </h2>
              <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              {demoJobs.map((job) => (
                <div key={job.id} className="border rounded-xl p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-bold text-[#2466D0] text-lg">
                          {job.title}
                        </h4>
                        <Edit3 
                          className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                          onClick={() => handleJobEdit(job)}
                        />
                      </div>
                      <p className="text-[#01253F] text-sm font-bold font-avenir">
                        {job.company}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[#01253F] text-sm font-avenir">
                        {job.location}
                      </p>
                      <p className="text-[#01253F] text-sm font-avenir">
                        {job.salary}
                      </p>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => handleViewApplicants(job)}
                        className="bg-[#2CB3BF] text-white text-sm rounded-lg px-4 py-2 transition-colors hover:opacity-90 font-avenir"
                      >
                        View Applicants
                      </button>
                      <span className="absolute -top-2 -right-2 bg-[#01253F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {job.applicants}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button 
                onClick={() => handlePageChange(1)}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                  currentPage === 1 
                    ? 'bg-[#01253F] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                1
              </button>
              <button 
                onClick={() => handlePageChange(2)}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                  currentPage === 2 
                    ? 'bg-[#01253F] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                2
              </button>
              <button 
                onClick={() => handlePageChange(3)}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                  currentPage === 3 
                    ? 'bg-[#01253F] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                3
              </button>
              <button 
                onClick={() => handlePageChange(currentPage < 3 ? currentPage + 1 : 3)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                Next &gt;
              </button>
            </div>
          </div>

          {/* Matches Section - Middle Column */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <h2 className="text-[25px] font-black leading-[154%] text-[#2466D0] font-avenir">
                  Matches
                </h2>
                <div className="w-6 h-6 bg-[#2466D0] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {demoMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-[#E8F4FD] flex items-center justify-center">
                      <User className="w-6 h-6 text-[#2466D0]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#01253F] text-sm mb-1">
                        {match.name}
                      </h4>
                      <p className="font-bold text-[#01253F] text-xs mb-1">
                        {match.experience}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {match.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-[#2466D0] font-extrabold text-xs">
                        Matched
                      </span>
                      <div className="w-4 h-4 bg-[#2466D0] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <button 
                      onClick={() => handleViewProfile(match)}
                      className="bg-[#2CB3BF] text-white text-xs rounded-lg px-4 py-2 transition-colors hover:opacity-90 font-avenir"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Applicants Section - Right Column */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[25px] font-black leading-[154%] text-[#01253F] font-avenir">
                Applicants
              </h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {demoApplicants.map((applicant) => (
                <div key={applicant.id} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-[#E8F4FD] flex items-center justify-center">
                      <User className="w-6 h-6 text-[#2466D0]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#01253F] text-sm mb-1">
                        {applicant.name}
                      </h4>
                      <p className="font-bold text-[#01253F] text-xs mb-1">
                        {applicant.experience}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {applicant.location}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleViewProfile(applicant)}
                    className="bg-[#2CB3BF] text-white text-xs rounded-lg px-4 py-2 transition-colors hover:opacity-90 font-avenir"
                  >
                    View Profile
                  </button>
                </div>
              ))}
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
