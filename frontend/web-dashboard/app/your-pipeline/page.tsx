"use client";

import React, { useState } from 'react';
import { 
  Bell, 
  Edit3, 
  Download,
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
  const [notifications, setNotifications] = useState(2);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  // Full-screen expansion removed

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
    },
    {
      id: 5,
      title: "Laboratory Technician",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "50k/yr - 65k/yr",
      applicants: 8,
      status: "Active"
    },
    {
      id: 6,
      title: "Radiology Technologist",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "60k/yr - 75k/yr",
      applicants: 5,
      status: "Active"
    },
    {
      id: 7,
      title: "Pharmacy Technician",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "40k/yr - 55k/yr",
      applicants: 15,
      status: "Active"
    },
    {
      id: 8,
      title: "Occupational Therapist",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "75k/yr - 90k/yr",
      applicants: 6,
      status: "Active"
    },
    {
      id: 9,
      title: "Speech Language Pathologist",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "70k/yr - 85k/yr",
      applicants: 4,
      status: "Active"
    },
    {
      id: 10,
      title: "Clinical Social Worker",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "55k/yr - 70k/yr",
      applicants: 9,
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
    },
    {
      id: 4,
      name: "Jennifer Davis",
      role: "Respiratory Therapist",
      experience: "4+ years experience",
      location: "New Haven, CT",
      matchScore: 89,
      status: "Matched"
    },
    {
      id: 5,
      name: "Robert Wilson",
      role: "Laboratory Technician",
      experience: "6+ years experience",
      location: "Milford, CT",
      matchScore: 91,
      status: "Matched"
    },
    {
      id: 6,
      name: "Lisa Martinez",
      role: "Radiology Technologist",
      experience: "3+ years experience",
      location: "West Haven, CT",
      matchScore: 88,
      status: "Matched"
    },
    {
      id: 7,
      name: "David Thompson",
      role: "Pharmacy Technician",
      experience: "2+ years experience",
      location: "New Haven, CT",
      matchScore: 85,
      status: "Matched"
    },
    {
      id: 8,
      name: "Amanda Rodriguez",
      role: "Occupational Therapist",
      experience: "5+ years experience",
      location: "Hartford, CT",
      matchScore: 93,
      status: "Matched"
    },
    {
      id: 9,
      name: "Thomas Anderson",
      role: "Speech Language Pathologist",
      experience: "4+ years experience",
      location: "New Haven, CT",
      matchScore: 90,
      status: "Matched"
    },
    {
      id: 10,
      name: "Jessica White",
      role: "Clinical Social Worker",
      experience: "3+ years experience",
      location: "Bridgeport, CT",
      matchScore: 86,
      status: "Matched"
    },
    {
      id: 11,
      name: "Christopher Taylor",
      role: "Registered Nurse",
      experience: "8+ years experience",
      location: "Milford, CT",
      matchScore: 95,
      status: "Matched"
    },
    {
      id: 12,
      name: "Nicole Adams",
      role: "Physical Therapist",
      experience: "6+ years experience",
      location: "West Haven, CT",
      matchScore: 92,
      status: "Matched"
    },
    {
      id: 13,
      name: "Ryan Miller",
      role: "Medical Assistant",
      experience: "3+ years experience",
      location: "New Haven, CT",
      matchScore: 87,
      status: "Matched"
    },
    {
      id: 14,
      name: "Emma Wilson",
      role: "Respiratory Therapist",
      experience: "5+ years experience",
      location: "Hartford, CT",
      matchScore: 89,
      status: "Matched"
    },
    {
      id: 15,
      name: "Daniel Kim",
      role: "Laboratory Technician",
      experience: "4+ years experience",
      location: "Bridgeport, CT",
      matchScore: 88,
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
    },
    {
      id: 4,
      name: "Carlos Mendez",
      role: "Physical Therapist",
      experience: "5+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "4 days ago"
    },
    {
      id: 5,
      name: "Rachel Green",
      role: "Medical Assistant",
      experience: "2+ years experience",
      location: "Hartford, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    },
    {
      id: 6,
      name: "James Brown",
      role: "Respiratory Therapist",
      experience: "7+ years experience",
      location: "Bridgeport, CT",
      status: "Applied",
      appliedDate: "2 days ago"
    },
    {
      id: 7,
      name: "Maria Garcia",
      role: "Laboratory Technician",
      experience: "4+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "5 days ago"
    },
    {
      id: 8,
      name: "Kevin Lee",
      role: "Radiology Technologist",
      experience: "3+ years experience",
      location: "Milford, CT",
      status: "Applied",
      appliedDate: "3 days ago"
    },
    {
      id: 9,
      name: "Sophia Chen",
      role: "Pharmacy Technician",
      experience: "1+ years experience",
      location: "West Haven, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    },
    {
      id: 10,
      name: "Alex Johnson",
      role: "Occupational Therapist",
      experience: "6+ years experience",
      location: "Hartford, CT",
      status: "Applied",
      appliedDate: "2 days ago"
    },
    {
      id: 11,
      name: "Daniel Kim",
      role: "Speech Language Pathologist",
      experience: "4+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    },
    {
      id: 12,
      name: "Sarah Williams",
      role: "Clinical Social Worker",
      experience: "5+ years experience",
      location: "Bridgeport, CT",
      status: "Applied",
      appliedDate: "3 days ago"
    },
    {
      id: 13,
      name: "Michael Davis",
      role: "Registered Nurse",
      experience: "9+ years experience",
      location: "Milford, CT",
      status: "Applied",
      appliedDate: "4 days ago"
    },
    {
      id: 14,
      name: "Emma Wilson",
      role: "Physical Therapist",
      experience: "7+ years experience",
      location: "West Haven, CT",
      status: "Applied",
      appliedDate: "2 days ago"
    },
    {
      id: 15,
      name: "Ryan Miller",
      role: "Medical Assistant",
      experience: "3+ years experience",
      location: "Hartford, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    }
  ];

  // Analytics data based on PDF structure
  const analyticsData = {
    // Hiring Health Metrics (Left Column - 2x2 Grid)
    orientationFillForecast: {
      rolesOnTrack: 12,
      totalRoles: 15,
      rolesAtRisk: 3,
      percentage: 80, // 12/15 = 80%
      threshold: 'amber', // amber 80-89%
      orientationDaysAway: 5 // <7 days triggers alert
    },
    strongMatches: {
      percentage: 86,
      timeframe: 'this month',
      threshold: 'green' // green ≥75%
    },
    retentionOutcomes: {
      percentage: 72,
      timeframe: 'last 90d',
      threshold: 'green' // green ≥70%
    },
    pulseTrends: {
      percentage: 34,
      timeframe: 'last 30d',
      threshold: 'green' // green stable/up (≥+5%)
    },
    
    // Workforce Stability Metrics (Right Column)
    earlyChurnRisk: {
      percentage: 15,
      hiresAtRisk: 4,
      turnoverCost: 40000,
      threshold: 'amber' // green ≤10%, amber 11-24%, red ≥25%
    },
    retentionForecast: {
      percentage: 52,
      timeframe: '30d',
      threshold: 'red' // green ≥70%, amber 60-69%, red <60%
    },
    workEnvironmentScore: {
      score: 77,
      maxScore: 100,
      threshold: 'green' // green ≥75, amber 65-74, red <65
    },
    cultureAlignment: {
      percentage: 58,
      threshold: 'red' // green ≥70%, amber 60-69%, red <60%
    },
    roiSummary: {
      saved: 24000,
      timeSaved: 200,
      hiresRetained: 6,
      threshold: 'green' // neutral $0-10K, green >$10K
    }
  };

  // Helper functions for color coding and thresholds
  const getThresholdColor = (threshold: string) => {
    switch (threshold) {
      case 'green': return 'bg-green-500';
      case 'amber': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getThresholdTextColor = (threshold: string) => {
    switch (threshold) {
      case 'green': return 'text-green-600';
      case 'amber': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // CSV Download Helper Functions
  const convertToCSV = (data: any[], headers: string[], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(/\s+/g, '')] || row[header] || '';
          // Escape commas and quotes in CSV
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAnalyticsCSV = () => {
    const analyticsCSVData = [
      {
        metric: 'Orientation Fill Forecast',
        value: `${analyticsData.orientationFillForecast.percentage}%`,
        details: `${analyticsData.orientationFillForecast.rolesOnTrack} of ${analyticsData.orientationFillForecast.totalRoles} roles on track`,
        threshold: analyticsData.orientationFillForecast.threshold
      },
      {
        metric: 'Strong Matches',
        value: `${analyticsData.strongMatches.percentage}%`,
        details: `${analyticsData.strongMatches.percentage}% strong matches ${analyticsData.strongMatches.timeframe}`,
        threshold: analyticsData.strongMatches.threshold
      },
      {
        metric: 'Retention Outcomes',
        value: `${analyticsData.retentionOutcomes.percentage}%`,
        details: `${analyticsData.retentionOutcomes.percentage}% of hires stayed ≥30d`,
        threshold: analyticsData.retentionOutcomes.threshold
      },
      {
        metric: 'Pulse Trends',
        value: `+${analyticsData.pulseTrends.percentage}%`,
        details: `+${analyticsData.pulseTrends.percentage}% morale trend`,
        threshold: analyticsData.pulseTrends.threshold
      },
      {
        metric: 'Early Churn Risk',
        value: `${analyticsData.earlyChurnRisk.percentage}%`,
        details: `${analyticsData.earlyChurnRisk.hiresAtRisk} hires at risk`,
        threshold: analyticsData.earlyChurnRisk.threshold
      },
      {
        metric: 'Retention Forecast',
        value: `${analyticsData.retentionForecast.percentage}%`,
        details: `${analyticsData.retentionForecast.percentage}% projected to stay`,
        threshold: analyticsData.retentionForecast.threshold
      },
      {
        metric: 'Work Environment Score',
        value: `${analyticsData.workEnvironmentScore.score}/${analyticsData.workEnvironmentScore.maxScore}`,
        details: 'Composite score of morale + fit signals',
        threshold: analyticsData.workEnvironmentScore.threshold
      },
      {
        metric: 'Culture Alignment',
        value: `${analyticsData.cultureAlignment.percentage}%`,
        details: `${analyticsData.cultureAlignment.percentage}% aligned`,
        threshold: analyticsData.cultureAlignment.threshold
      },
      {
        metric: 'ROI Summary',
        value: formatCurrency(analyticsData.roiSummary.saved),
        details: `${analyticsData.roiSummary.timeSaved} hrs saved, ${analyticsData.roiSummary.hiresRetained} hires retained`,
        threshold: analyticsData.roiSummary.threshold
      }
    ];

    convertToCSV(analyticsCSVData, ['Metric', 'Value', 'Details', 'Threshold'], 'analytics-data.csv');
  };

  const downloadJobsCSV = () => {
    const jobsCSVData = demoJobs.map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      applicants: job.applicants,
      status: job.status
    }));

    convertToCSV(jobsCSVData, ['Title', 'Company', 'Location', 'Salary', 'Applicants', 'Status'], 'open-jobs.csv');
  };

  const downloadMatchesCSV = () => {
    const matchesCSVData = demoMatches.map(match => ({
      name: match.name,
      role: match.role,
      experience: match.experience,
      location: match.location,
      matchScore: match.matchScore,
      status: match.status
    }));

    convertToCSV(matchesCSVData, ['Name', 'Role', 'Experience', 'Location', 'Match Score', 'Status'], 'matches.csv');
  };

  const downloadApplicantsCSV = () => {
    const applicantsCSVData = demoApplicants.map(applicant => ({
      name: applicant.name,
      role: applicant.role,
      experience: applicant.experience,
      location: applicant.location,
      status: applicant.status,
      appliedDate: applicant.appliedDate
    }));

    convertToCSV(applicantsCSVData, ['Name', 'Role', 'Experience', 'Location', 'Status', 'Applied Date'], 'applicants.csv');
  };

  const handleDownloadCSV = (section: string) => {
    switch (section) {
      case 'analytics':
        downloadAnalyticsCSV();
        break;
      case 'jobs':
        downloadJobsCSV();
        break;
      case 'matches':
        downloadMatchesCSV();
        break;
      case 'applicants':
        downloadApplicantsCSV();
        break;
      default:
        console.log('Unknown section:', section);
    }
  };

  // Expansion handlers removed

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
    // Navigate to applicants page with job information
    router.push(`/applicants?jobId=${job.id}&jobTitle=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&selectFirst=true`);
  };

  const handleViewProfile = (person: any) => {
    // Navigate to applicants page with matched filter set
    router.push(`/applicants?filter=matched&applicantName=${encodeURIComponent(person.name)}`);
  };

  const handleViewApplicantProfile = (applicant: any) => {
    // Navigate to applicants page without filter (show all applicants)
    router.push(`/applicants?applicantName=${encodeURIComponent(applicant.name)}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Check authentication and authorization only once
  // useEffect(() => {
  //   // Don't do anything until we have a definitive user state
  //   if (user === null) {
  //     // Still loading, wait
  //     return;
  //   }

  //   // Only check once
  //   if (authChecked) {
  //     return;
  //   }

  //   setAuthChecked(true);

  //   if (!user) {
  //     // User is not logged in, redirect to home
  //     router.push('/');
  //     return;
  //   }

  //   // Check if user is authorized for this dashboard
  //   if (user.role !== 'EMPLOYER') {
  //     setIsAuthorized(true);
  //     return;
  //   } else {
  //     // User is an employer, redirect to employer dashboard
  //     router.push('/my-pipeline');
  //   }
  // }, [user, router, authChecked]);

  // Disable auth for development
  useEffect(() => {
    setAuthChecked(true);
    setIsAuthorized(true);
  }, []);

  // Show loading while checking authentication
  // if (!authChecked || user === null) {
  //   return (
  //     <BaseLayout>
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
  //           <p className="text-[#7691A4] text-lg">Loading...</p>
  //         </div>
  //       </div>
  //     </BaseLayout>
  //   );
  // }

  // Show loading if user is not authorized (will redirect)
  // if (!isAuthorized) {
  //   return (
  //     <BaseLayout>
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
  //           <p className="text-[#7691A4] text-lg">Redirecting...</p>
  //         </div>
  //       </div>
  //     </BaseLayout>
  //   );
  // }

  // User is authorized, show the dashboard
  return (
    <BaseLayout>
      {/* Admin Navigation - Only show for admin users */}
      {user?.role === 'ADMIN' && <AdminDashboardNav />}

      {/* Page Header */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-start">
            <h1 className="text-[70px] font-bold leading-[115%] text-[#01253F] font-baloo ml-14">
              YourPipeline
            </h1>
          </div>
          {user?.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium mt-2 ml-6">Admin Access - Employee/User Dashboard</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Main Company Container - Wraps both Analytics/Insights and Jobs/Matches/Applicants */}
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative" style={{ maxWidth: '90%', margin: '0 auto' }}>
          
          {/* Company Header and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
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
                className="relative bg-white hover:bg-gray-50 text-[#A0B3C7] font-medium px-6 py-2 rounded-full shadow border border-gray-200 transition-colors flex items-center space-x-3"
              >
                <span className="text-[#A0B3C7] font-avenir">Alerts</span>
                <Bell className={`w-4 h-4 text-[#A0B3C7] fill-current ${notifications > 0 ? 'animate-bounce' : ''}`} />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center bg-red-500 animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Analytics Container - Holds both Metrics and Insights */}
          <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6 mb-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[25px] font-bold leading-[34px] text-[#01253F] font-avenir">Analytics</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleDownloadCSV('analytics')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Download data as CSV"
                >
                  <img src="/download.svg" alt="Download" className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Left Side - Hiring Health Metrics (2x2 Grid) */}
              <div className="flex-shrink-0 xl:w-1/2 w-full">
                <div className="grid grid-cols-2 gap-4 w-full max-w-full xl:max-w-[500px] mx-auto xl:mx-0">
                  {/* Orientation Fill Forecast Card */}
                  <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[180px]">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-[#01253F] leading-tight">Orientation Fill<br />Forecast</h3>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          % of roles forecast to fill by orientation (PPP_Match_Target)
                          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-start mb-2 mt-8">
                      <span className="text-3xl font-bold text-[#01253F]">{analyticsData.orientationFillForecast.percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {analyticsData.orientationFillForecast.rolesOnTrack} of {analyticsData.orientationFillForecast.totalRoles} roles on track ({analyticsData.orientationFillForecast.rolesAtRisk} at risk)
                    </div>
                  </div>

                  {/* Strong Matches Card */}
                  <div className="bg-white rounded-[21px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[180px]">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-[#01253F] leading-tight">Strong Matches</h3>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          % of surfaced candidates rated as strong fit + predicted to stay ≥30d
                          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-start mb-2 mt-12">
                      <span className="text-3xl font-bold text-[#01253F]">{analyticsData.strongMatches.percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {analyticsData.strongMatches.percentage}% strong matches {analyticsData.strongMatches.timeframe}
                    </div>
                  </div>

                  {/* Retention Outcomes Card */}
                  <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[180px]">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-[#01253F] leading-tight">Retention<br />Outcomes</h3>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          % of new hires who stayed ≥30 days (observed vs predicted)
                          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-start mb-2 mt-8">
                      <span className="text-3xl font-bold text-[#01253F]">{analyticsData.retentionOutcomes.percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {analyticsData.retentionOutcomes.percentage}% of hires stayed ≥30d ({analyticsData.retentionOutcomes.timeframe})
                    </div>
                  </div>

                  {/* Pulse Trends Card */}
                  <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[180px]">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-medium text-[#01253F] leading-tight">Pulse Trends</h3>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Average morale trend from weekly caregiver check-ins
                          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-start mb-2 mt-12">
                      <span className="text-3xl font-bold text-[#01253F]">+{analyticsData.pulseTrends.percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      +{analyticsData.pulseTrends.percentage}% morale trend ({analyticsData.pulseTrends.timeframe})
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Workforce Stability Section */}
              <div className="xl:w-3/5 w-full bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[380px] min-w-[300px] mt-4 xl:mt-0 xl:-ml-12 flex flex-col">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <h2 className="text-[25px] font-medium leading-[34px] text-[#01253F] font-avenir">Workforce Stability</h2>
                </div>
                
                      {/* Content Area - No Scroll */}
                      <div className="flex-1">
                  
                                          {/* Workforce Stability Metrics */}
                        <div className="space-y-2">
                        {/* ROI Summary Badge */}
                        <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border-2 border-dashed border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-700">ROI Summary</span>
                              <div className="relative group ml-2">
                                <Info className="w-3 h-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  ROI from reduced turnover + faster fills (export full report)
                                  <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              analyticsData.roiSummary.threshold === 'green' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {formatCurrency(analyticsData.roiSummary.saved)} saved, {analyticsData.roiSummary.timeSaved} hrs time saved, {analyticsData.roiSummary.hiresRetained} hires retained
                            </div>
                          </div>
                        </div>
                        
                        {/* Early Churn Risk */}
                                          <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700">Early Churn Risk</span>
                        <div className="relative group ml-2">
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            % of active new hires flagged for early churn risk
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${getThresholdTextColor(analyticsData.earlyChurnRisk.threshold)}`}>
                        {analyticsData.earlyChurnRisk.hiresAtRisk} hires at risk (~{formatCurrency(analyticsData.earlyChurnRisk.turnoverCost)} turnover cost)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ width: `${analyticsData.earlyChurnRisk.percentage}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Retention Forecast */}
                                          <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700">Retention Forecast</span>
                        <div className="relative group ml-2">
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            % of current hires projected to stay ≥30d (based on RLS)
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${getThresholdTextColor(analyticsData.retentionForecast.threshold)}`}>
                        {analyticsData.retentionForecast.percentage}% projected to stay {analyticsData.retentionForecast.timeframe}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ width: `${analyticsData.retentionForecast.percentage}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Work Environment Score */}
                                          <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700">Work Environment Score</span>
                        <div className="relative group ml-2">
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            Composite score of morale + fit signals (updated weekly)
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${getThresholdTextColor(analyticsData.workEnvironmentScore.threshold)}`}>
                        {analyticsData.workEnvironmentScore.score} / {analyticsData.workEnvironmentScore.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ width: `${analyticsData.workEnvironmentScore.score}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Culture Alignment */}
                                          <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700">Culture Alignment</span>
                        <div className="relative group ml-2">
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            % of recent hires aligned with your facility's culture profile
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${getThresholdTextColor(analyticsData.cultureAlignment.threshold)}`}>
                        {analyticsData.cultureAlignment.percentage}% aligned
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ width: `${analyticsData.cultureAlignment.percentage}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
                      ></div>
                    </div>
                                          </div>
                        </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Jobs/Matches/Applicants Container - Stacked below */}
          <div className="p-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Open Jobs Section - Left Side (Full Height) */}
              <div className="bg-[#F4F4F4] rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] pt-3 px-4 pb-4 h-[1250px] overflow-hidden" style={{ minWidth: '400px' }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-1 mt-2">
                  <h2 className="text-[22px] font-bold text-[#01253F] font-avenir">Open Jobs</h2>
                  <div className="flex items-start space-x-2"></div>
                </div>

                {/* Job Cards */}
                <div className="space-y-2 overflow-y-auto h-[calc(100%-80px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {demoJobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
                      {/* Edit Icon - Top Right */}
                      <button 
                        onClick={() => handleJobEdit(job)}
                        className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-colors"
                      >
                        <img src="/edit_pencil.svg" alt="Edit" className="w-8 h-8" />
                      </button>

                      {/* Job Content */}
                      <div className="flex flex-col">
                        {/* Job Title */}
                        <h3 className="text-[22px] font-bold text-[#2466D0] mb-6 font-avenir">
                          {job.title}
                        </h3>
                        
                        {/* Company Name */}
                        <p className="text-[16px] font-bold text-[#01253F] mb-1 font-avenir">
                          {job.company}
                        </p>
                        
                        {/* Location and Salary Row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex flex-col">
                            <p className="text-[14px] text-[#01253F] mb-1 font-avenir">
                              {job.location}
                            </p>
                            <p className="text-[14px] text-[#01253F] font-avenir">
                              {job.salary}
                            </p>
                          </div>
                          
                          {/* View Applicants Button */}
                          <div className="relative">
                            <button 
                              onClick={() => handleViewApplicants(job)}
                              className="bg-[#2CB3BF] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#25a0ab] transition-colors"
                            >
                              View Applicants
                            </button>
                            {/* Applicant Count Badge */}
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#01253F] text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {job.applicants}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right Side - Matches and Applicants Stacked */}
              <div className="flex flex-col h-full" style={{ minWidth: '300px' }}>
                {/* Matches Section - Top Half */}
                <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] pt-3 px-4 pb-4 h-[610px] overflow-hidden">
                  <div className="flex items-start justify-between mb-1 mt-2">
                    <div className="flex items-start space-x-2">
                      <h2 className="text-[22px] font-bold text-[#2466D0] font-avenir">Matches</h2>
                      <div className="w-6 h-6 bg-[#2466D0] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <button 
                        onClick={() => handleDownloadCSV('matches')}
                        className="p-2 hover:bg-gray-100 rounded transition-colors" 
                        title="Download data as CSV"
                      >
                        <img src="/download.svg" alt="Download" className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 overflow-y-auto h-[calc(100%-80px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {demoMatches.map((match) => (
                      <div key={match.id} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Avatar */}
                          <div className="rounded-full bg-white flex items-center justify-center">
                            <img src="/user_icon.svg" alt="User" className="w-20 h-20 object-contain" />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#01253F] text-lg">{match.name}</h4>
                            <p className="font-bold text-[#01253F] text-sm">{match.experience}</p>
                            <p className="text-gray-500 text-sm">{match.location}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 space-x-2 mb-6">
                            <span className="text-gray-600 font-medium text-sm">{match.status}</span>
                            <div className="w-4 h-4 bg-[#2466D0] rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleViewProfile(match)}
                            className="bg-[#2CB3BF] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#25a0ab] transition-colors"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Applicants Section - Bottom Half */}
                <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] pt-3 px-4 pb-4 mt-4 h-[625px] overflow-hidden">
                  <div className="flex items-start justify-between mb-1 mt-2">
                    <h2 className="text-[22px] font-bold text-[#01253F] font-avenir">Applicants</h2>
                    <div className="flex items-start space-x-2">
                      <button 
                        onClick={() => handleDownloadCSV('applicants')}
                        className="p-2 hover:bg-gray-100 rounded transition-colors" 
                        title="Download data as CSV"
                      >
                        <img src="/download.svg" alt="Download" className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 overflow-y-auto h-[calc(100%-80px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {demoApplicants.map((applicant) => (
                      <div key={applicant.id} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Avatar */}
                          <div className="rounded-full bg-white flex items-center justify-center">
                            <img src="/user_icon.svg" alt="User" className="w-20 h-20 object-contain" />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#01253F] text-lg">{applicant.name}</h4>
                            <p className="font-bold text-[#01253F] text-sm">{applicant.experience}</p>
                            <p className="text-gray-500 text-sm">{applicant.location}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleViewApplicantProfile(applicant)}
                            className="bg-[#2CB3BF] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#25a0ab] transition-colors mt-8"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Modal */}
      {showNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#01253F]">Active Alerts</h3>
              <button 
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Orientation Fill Forecast Alert */}
              {analyticsData.orientationFillForecast.orientationDaysAway < 7 && analyticsData.orientationFillForecast.percentage < 90 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-red-800">
                      Orientation in {analyticsData.orientationFillForecast.orientationDaysAway} days with only {analyticsData.orientationFillForecast.percentage}% forecast fill rate
                    </span>
                  </div>
                </div>
              )}
              
              {/* Retention Forecast Alert */}
              {analyticsData.retentionForecast.threshold === 'red' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-red-800">
                      Low retention forecast: Only {analyticsData.retentionForecast.percentage}% projected to stay
                    </span>
                  </div>
                </div>
              )}
              
              {/* Early Churn Risk Alert */}
              {analyticsData.earlyChurnRisk.threshold === 'red' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-red-800">
                      High churn risk: {analyticsData.earlyChurnRisk.percentage}% of hires flagged
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => {
                  setShowNotification(false);
                  setNotifications(0);
                }}
                className="bg-[#2CB3BF] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#25a0ab] transition-colors"
              >
                Mark All as Read
              </button>
            </div>
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowApplicantsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
              {/* Left Side - Job Info */}
              <div>
                <h3 className="text-2xl font-bold text-[#01253F] mb-1">
                  Applicants for {selectedJob.title}
                </h3>
                <p className="text-lg text-gray-600">
                  {selectedJob.company} • {selectedJob.location}
                </p>
              </div>
              
              {/* Right Side - Actions */}
              <div className="flex items-center space-x-4">
                <button className="bg-[#4A90E2] hover:bg-[#357ABD] text-white px-6 py-3 rounded-lg font-bold text-base transition-colors">
                  Contact All
                </button>
                <button 
                  onClick={() => setShowApplicantsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-full h-px bg-gray-200 mb-8"></div>
            
            {/* Applicants List */}
            <div className="space-y-6">
              {demoApplicants.map((applicant) => (
                <div key={applicant.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  {/* Applicant Header */}
                  <div className="flex items-start justify-between mb-4">
                    {/* Left Side - Avatar and Info */}
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="rounded-full bg-white flex items-center justify-center">
                        <img src="/user_icon.svg" alt="User" className="w-20 h-20 object-contain" />
                      </div>
                      
                      {/* Name and Details */}
                      <div>
                        <h4 className="text-xl font-bold text-[#01253F] mb-1">
                          {applicant.name}
                        </h4>
                        <p className="text-base font-bold text-[#01253F] mb-1">
                          {applicant.experience}
                        </p>
                        <p className="text-sm text-gray-600">
                          {applicant.location}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Applied {applicant.appliedDate}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right Side - Actions */}
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleViewProfile(applicant)}
                        className="bg-[#2CB3BF] hover:bg-[#25a0ab] text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                        View Profilexx
                      </button>
                      <button className="bg-[#4A90E2] hover:bg-[#357ABD] text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                        Contact
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Bio Preview */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <h5 className="text-sm font-bold text-gray-600 mb-2">Quick Bio</h5>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      Dedicated healthcare professional with strong patient care skills and experience in 
                      long-term care settings. Committed to providing compassionate and quality care.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile View Modal */}
      {showProfileModal && selectedMatch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
              {/* Left Side - Avatar and Info */}
                              <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="rounded-full bg-white flex items-center justify-center">
                    <img src="/user_icon.svg" alt="User" className="w-20 h-20 object-contain" />
                  </div>
                
                {/* Name and Details */}
                <div>
                  <h3 className="text-2xl font-bold text-[#01253F] mb-1">
                    {selectedMatch.name}
                  </h3>
                  <p className="text-lg font-bold text-[#01253F] mb-1">
                    {selectedMatch.experience}
                  </p>
                  <p className="text-base text-gray-600">
                    {selectedMatch.location}
                  </p>
                </div>
              </div>
              
              {/* Right Side - Actions */}
              <div className="flex items-center space-x-4">
                <button className="bg-[#4A90E2] hover:bg-[#357ABD] text-white px-6 py-3 rounded-lg font-bold text-base transition-colors">
                  Express Interest
                </button>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-full h-px bg-gray-200 mb-8"></div>
            
            {/* Bio Section */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-600 mb-4">Bio</h4>
              <p className="text-base text-gray-800 leading-relaxed">
                Community Focused. Care Driven. Join Something Health, where your future is as promising 
                as the care we provide. Our commitment to each other, our patients, and our community is 
                more than a mission.
              </p>
            </div>
            
            {/* Experience Section */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-600 mb-4">Experience</h4>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-4 flex-shrink-0"></div>
                  <span className="text-base text-gray-800">
                    Registered Nurse | St. Mary's | <span className="font-bold">3yrs</span>
                  </span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-4 flex-shrink-0"></div>
                  <span className="text-base text-gray-800">
                    Registered Nurse | St. Mary's | <span className="font-bold">3yrs</span>
                  </span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-4 flex-shrink-0"></div>
                  <span className="text-base text-gray-800">
                    Registered Nurse | St. Mary's | <span className="font-bold">3yrs</span>
                  </span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-4 flex-shrink-0"></div>
                  <span className="text-base text-gray-800">
                    Registered Nurse | St. Mary's | <span className="font-bold">3yrs</span>
                  </span>
                </li>
              </ul>
            </div>
            
            {/* Skills Section */}
            <div>
              <h4 className="text-lg font-bold text-gray-600 mb-4">Skills</h4>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 border-2 border-gray-300 rounded-full text-base text-gray-800 font-medium">
                  Leadership
                </span>
                <span className="px-4 py-2 border-2 border-gray-300 rounded-full text-base text-gray-800 font-medium">
                  Safety
                </span>
                <span className="px-4 py-2 border-2 border-gray-300 rounded-full text-base text-gray-800 font-medium">
                  Adaptability
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  );
};

export default YourPipelinePage;
