"use client";

import React, { useState, useRef } from 'react';
import { 
  Bell, 
  Edit3, 
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
  Search,
  Filter,
  SortAsc,
  Eye,
  ChevronDown,
  Plus
} from 'lucide-react';
import BaseLayout from '../components/layout/BaseLayout';
import AdminDashboardNav from '../components/AdminDashboardNav';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const ApplicantsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get('filter') || 'all');
  const [sortBy, setSortBy] = useState('recent');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [showOpenPositions, setShowOpenPositions] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  // Job information from URL parameters
  const [jobInfo, setJobInfo] = useState({
    id: searchParams.get('jobId') || '',
    title: searchParams.get('jobTitle') || 'Registered Nurse I',
    company: searchParams.get('company') || 'St. Mary\'s Health Center'
  });

  // Demo data with matched status
  const demoApplicants = [
    {
      id: 1,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "2 days ago",
      matchScore: 94,
      skills: ["Patient Care", "Leadership", "Safety"],
      isMatched: false
    },
    {
      id: 2,
      name: "Marvin Grant",
      role: "Registered Nurse", 
      experience: "5+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "1 day ago",
      matchScore: 87,
      skills: ["Critical Care", "Team Management", "Communication"],
      isMatched: true
    },
    {
      id: 3,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience", 
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "3 days ago",
      matchScore: 92,
      skills: ["Pediatric Care", "Adaptability", "Problem Solving"],
      isMatched: false
    },
    {
      id: 4,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT", 
      status: "Applied",
      appliedDate: "4 days ago",
      matchScore: 89,
      skills: ["Rehabilitation", "Assessment", "Patient Education"],
      isMatched: true
    },
    {
      id: 5,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT",
      status: "Applied", 
      appliedDate: "5 days ago",
      matchScore: 85,
      skills: ["Clinical Procedures", "Administrative", "Customer Service"],
      isMatched: false
    },
    {
      id: 6,
      name: "Sarah Johnson",
      role: "Registered Nurse",
      experience: "3+ years experience",
      location: "Hartford, CT",
      status: "Applied",
      appliedDate: "6 days ago",
      matchScore: 78,
      skills: ["Emergency Care", "Teamwork", "Communication"],
      isMatched: true
    },
    {
      id: 7,
      name: "Michael Chen",
      role: "Registered Nurse",
      experience: "7+ years experience",
      location: "Bridgeport, CT",
      status: "Applied",
      appliedDate: "7 days ago",
      matchScore: 91,
      skills: ["Critical Care", "Leadership", "Patient Advocacy"],
      isMatched: false
    },
    {
      id: 8,
      name: "Emily Rodriguez",
      role: "Registered Nurse",
      experience: "4+ years experience",
      location: "Stamford, CT",
      status: "Applied",
      appliedDate: "8 days ago",
      matchScore: 83,
      skills: ["Pediatric Care", "Family Support", "Documentation"],
      isMatched: true
    },
    {
      id: 9,
      name: "David Thompson",
      role: "Registered Nurse",
      experience: "6+ years experience",
      location: "Waterbury, CT",
      status: "Applied",
      appliedDate: "9 days ago",
      matchScore: 88,
      skills: ["Surgical Care", "Quality Assurance", "Training"],
      isMatched: false
    },
    {
      id: 10,
      name: "Lisa Anderson",
      role: "Registered Nurse",
      experience: "2+ years experience",
      location: "Norwalk, CT",
      status: "Applied",
      appliedDate: "10 days ago",
      matchScore: 76,
      skills: ["Basic Care", "Learning", "Adaptability"],
      isMatched: true
    }
  ];

  // Tag system based on PDF structure - Healthcare categories
  const tagCategories = {
    clinical: {
      name: "Clinical Excellence",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      tags: ["Patient Care", "Critical Care", "Clinical Procedures", "Assessment", "Surgical Care", "Emergency Care", "Pediatric Care", "Rehabilitation"]
    },
    leadership: {
      name: "Leadership & Management", 
      color: "bg-purple-100 text-purple-800 border-purple-200",
      tags: ["Leadership", "Team Management", "Training", "Quality Assurance", "Patient Advocacy"]
    },
    communication: {
      name: "Communication & Collaboration",
      color: "bg-green-100 text-green-800 border-green-200", 
      tags: ["Communication", "Teamwork", "Family Support", "Patient Education", "Documentation"]
    },
    adaptability: {
      name: "Adaptability & Growth",
      color: "bg-orange-100 text-orange-800 border-orange-200",
      tags: ["Adaptability", "Problem Solving", "Learning", "Basic Care"]
    },
    administrative: {
      name: "Administrative & Support",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      tags: ["Administrative", "Customer Service"]
    }
  };

  // Function to categorize skills into tags
  const categorizeSkills = (skills: string[]) => {
    const categorizedTags: { category: string; tags: string[]; color: string }[] = [];
    
    Object.entries(tagCategories).forEach(([key, category]) => {
      const matchingTags = skills.filter(skill => category.tags.includes(skill));
      if (matchingTags.length > 0) {
        categorizedTags.push({
          category: category.name,
          tags: matchingTags,
          color: category.color
        });
      }
    });
    
    return categorizedTags;
  };

  // Demo open positions data
  const openPositions = [
    {
      id: '1',
      title: 'Registered Nurse I',
      company: 'St. Mary\'s Health Center',
      applicantsCount: 15,
      isActive: true
    },
    {
      id: '2', 
      title: 'Senior Registered Nurse',
      company: 'St. Mary\'s Health Center',
      applicantsCount: 8,
      isActive: false
    },
    {
      id: '3',
      title: 'Nurse Manager',
      company: 'St. Mary\'s Health Center', 
      applicantsCount: 12,
      isActive: false
    },
    {
      id: '4',
      title: 'ICU Registered Nurse',
      company: 'St. Mary\'s Health Center',
      applicantsCount: 6,
      isActive: false
    },
    {
      id: '5',
      title: 'Emergency Room Nurse',
      company: 'St. Mary\'s Health Center',
      applicantsCount: 9,
      isActive: false
    }
  ];

  // Demo functions
  const handleViewProfile = (applicant: any) => {
    setSelectedApplicant(applicant);
  };

  const handleContact = (applicant: any) => {
    // Handle contact functionality
    console.log('Contacting:', applicant.name);
  };

  const handleJobSwitch = (position: any) => {
    setJobInfo({
      id: position.id,
      title: position.title,
      company: position.company
    });
    setShowOpenPositions(false);
    // Clear selected applicant when switching jobs
    setSelectedApplicant(null);
  };

  const toggleOpenPositions = () => {
    setShowOpenPositions(!showOpenPositions);
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const handleExportProfilesDropdownToggle = () => {
    setShowExportDropdown(!showExportDropdown);
  };

  const handleExportSelection = (selection: 'all' | 'matched' | 'unmatched') => {
    const dataForExport = demoApplicants.filter(applicant => {
      if (selection === 'matched') return applicant.isMatched;
      if (selection === 'unmatched') return !applicant.isMatched;
      return true;
    });
    const csv = convertToCSV(dataForExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applicants_${selection}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
  };

  // CSV Export functionality
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = ['Name', 'Role', 'Experience', 'Location', 'Status', 'Applied Date', 'Match Score', 'Skills', 'Matched'];
    const csvContent = [
      headers.join(','),
      ...data.map(applicant => [
        `"${applicant.name}"`,
        `"${applicant.role}"`,
        `"${applicant.experience}"`,
        `"${applicant.location}"`,
        `"${applicant.status}"`,
        `"${applicant.appliedDate}"`,
        applicant.matchScore,
        `"${applicant.skills.join('; ')}"`,
        applicant.isMatched ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');
    
    return csvContent;
  };

  const handleExportProfiles = () => {
    const csvContent = convertToCSV(filteredApplicants);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applicants_${jobInfo.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Applicants' },
    { value: 'matched', label: 'Matched Only' },
    { value: 'unmatched', label: 'Unmatched Only' }
  ];

  // Disable auth for development
  useEffect(() => {
    setAuthChecked(true);
    setIsAuthorized(true);
  }, []);

  // Handle filter/applicantName/selectFirst parameters from URL
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    const applicantNameParam = searchParams.get('applicantName');
    const selectFirstParam = searchParams.get('selectFirst');

    if (filterParam && ['all', 'matched', 'unmatched'].includes(filterParam)) {
      setSelectedFilter(filterParam);
    }

    // Preselect by applicantName if provided
    if (applicantNameParam) {
      const found = demoApplicants.find(a => a.name.toLowerCase() === applicantNameParam.toLowerCase());
      if (found) {
        setSelectedApplicant(found);
      }
    } else if (selectFirstParam === 'true') {
      // Auto-select first applicant
      if (filteredApplicants.length > 0) {
        setSelectedApplicant(filteredApplicants[0]);
      }
    }
  }, [searchParams]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOpenPositions(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (showOpenPositions || showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOpenPositions, showFilterDropdown]);

  // Filter and sort applicants
  const filteredApplicants = demoApplicants
    .filter(applicant => {
      // Search filter
      if (searchTerm) {
        const matchesSearch = applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             applicant.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             applicant.location.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
      }
      
      // Match status filter
      if (selectedFilter === 'matched') {
        return applicant.isMatched === true;
      } else if (selectedFilter === 'unmatched') {
        return applicant.isMatched === false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'matchScore':
          return b.matchScore - a.matchScore;
        case 'recent':
        default:
          return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      }
    });

  return (
    <BaseLayout>
      <div className="flex flex-col min-h-0 h-full">
        {/* Admin Navigation - Only show for admin users */}
        {user?.role === 'ADMIN' && <AdminDashboardNav />}

        {/* Page Header */}
        <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
          <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
            <h1 className="text-[76.6971px] font-bold leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
              Hiring Engine
            </h1>
            {user?.role === 'ADMIN' && (
              <p className="text-sm text-blue-600 font-medium text-center lg:text-left mt-2">Admin Access - View All Applicants</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12 flex-1" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Main Company Container */}
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative">
          
          {/* Company Header and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[30px] font-black leading-[154%] text-[#01253F] font-avenir">
                {jobInfo.title}
              </h2>
              <p className="text-[16px] text-[#7691A4] mt-2">You have <span className="text-[#2466D0] font-bold">15</span> new applicants</p>
              {user?.role === 'ADMIN' && (
                <p className="text-sm text-blue-600 font-medium mt-1">Admin Access - View All Applicants</p>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={toggleOpenPositions}
                  className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-md text-[#7691A4] hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white rounded-md">
                    <img src="/open_jobs.svg" alt="Open Jobs" className="w-5 h-5" />
                  </div>
                  <span className="text-[#7691A4] font-medium">Open Positions</span>
                  <ChevronDown className={`w-4 h-4 text-[#7691A4] transition-transform ${showOpenPositions ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {showOpenPositions && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-[#01253F] mb-3">Open Positions</h3>
                      <div className="space-y-2">
                        {openPositions.map((position) => (
                          <button
                            key={position.id}
                            onClick={() => handleJobSwitch(position)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              position.isActive 
                                ? 'bg-[#2466D0] text-white' 
                                : 'hover:bg-gray-50 text-[#01253F]'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-sm">{position.title}</p>
                                <p className={`text-xs ${position.isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {position.company}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs font-medium ${position.isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {position.applicantsCount} applicants
                                </p>
                                {position.isActive && (
                                  <p className="text-xs text-blue-100">Current</p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative" ref={filterDropdownRef}>
                <button 
                  onClick={toggleFilterDropdown}
                  className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-md text-[#7691A4] hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white rounded-md">
                    <img src="/filter_positions.svg" alt="Filter" className="w-5 h-5" />
                  </div>
                  <span>{filterOptions.find(option => option.value === selectedFilter)?.label || 'Filters'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-[#01253F] mb-3">Filter Applicants</h3>
                      <div className="space-y-2">
                        {filterOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleFilterChange(option.value)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              selectedFilter === option.value 
                                ? 'bg-[#2466D0] text-white' 
                                : 'hover:bg-gray-50 text-[#01253F]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{option.label}</span>
                              {selectedFilter === option.value && (
                                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-[#2466D0]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Profiles dropdown (replacing trailing icon and adding All/Matched/Unmatched) */}
              <div className="relative">
                <button 
                  onClick={handleExportProfilesDropdownToggle}
                  className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-md text-[#7691A4] hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white rounded-md">
                    <img src="/export_positions.svg" alt="Export" className="w-5 h-5" />
                  </div>
                  <span>Export Profiles</span>
                </button>
                {showExportDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-[#01253F] mb-3">Export Which Profiles?</h3>
                      <div className="space-y-2">
                        {['all','matched','unmatched'].map(option => (
                          <button
                            key={option}
                            onClick={() => handleExportSelection(option as 'all' | 'matched' | 'unmatched')}
                            className="w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-50 text-[#01253F]"
                          >
                            <span className="font-medium text-sm">{option === 'all' ? 'All' : option === 'matched' ? 'Matched' : 'Unmatched'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Replaced by dropdown above */}
            </div>
          </div>
          
          <div className="flex gap-8 h-[calc(110vh-300px)] min-h-[660px]">
            {/* Left Side - Applicants List */}
            <div className="flex-1 max-w-lg flex flex-col">
              {/* Applicants List */}
              <div className="space-y-4 flex-1 overflow-y-auto pr-2" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E0 #F7FAFC'
              }}>
                {filteredApplicants.map((applicant) => (
                  <div 
                    key={applicant.id} 
                    className={`bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.06)] border p-6 transition-all cursor-pointer ${
                      selectedApplicant?.id === applicant.id 
                        ? 'border-[#2466D0] shadow-[0px_4px_20px_rgba(36,102,208,0.3)]' 
                        : 'border-gray-100'
                    }`}
                    onClick={() => handleViewProfile(applicant)}
                  >
                    <div className="flex items-end justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                          <img src="/user_icon.svg" alt="User" className="w-20 h-20 object-contain" />
                        </div>
                        
                        {/* Applicant Info */}
                        <div>
                          <h3 className="text-[20px] font-bold text-[#01253F] mb-1">
                            {applicant.name}
                          </h3>
                          <p className="text-[16px] font-bold text-[#01253F] mb-1">
                            {applicant.experience}
                          </p>
                          <p className="text-[14px] text-gray-600">
                            {applicant.location}
                          </p>
                        </div>
                      </div>
                      
                      {/* Right Side Actions */}
                      <div className="flex flex-col items-end space-y-4 justify-end">
                        {/* Matched Label (conditionally shown) */}
                        {applicant.isMatched && (
                          <div className="flex items-center bg-gray-100 rounded-full px-3 py-0.5 space-x-2 mt-0.5">
                            <span className="text-gray-600 font-medium text-sm">Matched</span>
                            <div className="w-4 h-4 bg-[#2466D0] rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Profile Detail Panel */}
            {selectedApplicant && (
              <div className="flex-1 min-w-[400px] flex-shrink-0 flex flex-col">
                <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-8 flex-1 overflow-y-auto" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E0 #F7FAFC'
                }}>
                  {/* Top Section */}
                  <div className="flex items-start justify-between mb-6">
                    {/* Left Side - Avatar and Info */}
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="rounded-full bg-white flex items-center justify-center">
                        <img src="/user_icon.svg" alt="User" className="w-20 h-20 object-contain" />
                      </div>
                      
                      {/* Name and Details */}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-bold text-[#01253F]">
                            {selectedApplicant.name}
                          </h3>
                          {selectedApplicant.isMatched && (
                            <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 space-x-2 transform -translate-y-[2px]">
                              <span className="text-gray-600 font-medium text-sm">Matched</span>
                              <div className="w-4 h-4 bg-[#2466D0] rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-lg font-bold text-[#01253F] mb-1">
                          {selectedApplicant.experience}
                        </p>
                        <p className="text-base text-gray-600">
                          {selectedApplicant.location}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right Side - Match Tag or blank */}
                    <div />
                  </div>
                  
                  {/* Horizontal Divider */}
                  <div className="w-full h-px bg-gray-200 mb-8"></div>
                  
                  {/* Bio Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-600 mb-4">Pip Summary</h4>
                    <p className="text-base text-gray-800 leading-relaxed">
                      Community Focused. Care Driven. Join Something Health, where your future is as promising as the care we provide. Our commitment to each other, our patients, and our community is more than a mission.
                    </p>
                  </div>
                  
                  {/* Experience Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-600 mb-4">Experience</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <span className="text-base text-gray-800">
                          Registered Nurse | St. Mary's | <span className="font-bold">3yrs</span>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <span className="text-base text-gray-800">
                          Registered Nurse | St. Mary's | <span className="font-bold">3yrs</span>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <span className="text-base text-gray-800">
                          Registered Nurse | St. Mary's | <span className="font-bold">3yrs</span>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-gray-800 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <span className="text-base text-gray-800">
                          Registered Nurse | St. Mary's | <span className="font-bold">3yrs</span>
                        </span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Skills Section */}
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {categorizeSkills(selectedApplicant.skills).map((category, cIdx) => (
                        category.tags.map((tag, tIdx) => (
                          <span
                            key={`${cIdx}-${tIdx}`}
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${category.color}`}
                          >
                            {tag}
                          </span>
                        ))
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      </BaseLayout>
  );
};

export default ApplicantsPage;