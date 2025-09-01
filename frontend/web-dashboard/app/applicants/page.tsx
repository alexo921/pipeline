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
  Search,
  Filter,
  SortAsc,
  Eye,
  ChevronDown
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
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  
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

  // Disable auth for development
  useEffect(() => {
    setAuthChecked(true);
    setIsAuthorized(true);
  }, []);

  // Filter and sort applicants
  const filteredApplicants = demoApplicants
    .filter(applicant => {
      if (searchTerm) {
        return applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               applicant.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
               applicant.location.toLowerCase().includes(searchTerm.toLowerCase());
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
      {/* Admin Navigation - Only show for admin users */}
      {user?.role === 'ADMIN' && <AdminDashboardNav />}

      {/* Page Header */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-[76.6971px] font-bold leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            Applicants
          </h1>
          {user?.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium text-center lg:text-left mt-2">Admin Access - View All Applicants</p>
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
                {jobInfo.title}
              </h2>
              <p className="text-[16px] text-[#7691A4] mt-2">You have <span className="text-[#2466D0] font-bold">15</span> new applicants</p>
              {user?.role === 'ADMIN' && (
                <p className="text-sm text-blue-600 font-medium mt-1">Admin Access - View All Applicants</p>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#7691A4] hover:bg-gray-50 transition-colors">
                <Briefcase className="w-4 h-4" />
                <span>Open Positions</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#7691A4] hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#7691A4] hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Profiles</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-8">
            {/* Left Side - Applicants List in White Container */}
            <div className="flex-1 max-w-xl">
              {/* Applicants List */}
              
              <div className="space-y-4">
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
                    <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-4">
                          {/* Avatar with gradient background */}
                          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ 
                            background: 'linear-gradient(135deg, #97B3FB 0%, #E9D7F4 100%)'
                          }}>
                            <User className="w-8 h-8 text-[#01253F]" strokeWidth={2} />
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
                      <div className="flex items-center space-x-4">
                        {/* Matched Label (conditionally shown) */}
                        {applicant.isMatched && (
                          <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 space-x-2">
                            <span className="text-gray-600 font-medium text-sm">Matched</span>
                            <div className="w-4 h-4 bg-[#2466D0] rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                        
                        {/* View Profile Button */}
                        <button 
                          onClick={() => handleViewProfile(applicant)}
                          className="bg-[#2CB3BF] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#25a0ab] transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

                        {/* Right Side - Profile Detail Panel */}
            {/* Right Side - Profile Detail Panel */}
            {selectedApplicant && (
              <div className="w-1/2 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-8 sticky top-6 h-full">
                  {/* Top Section */}
                  <div className="flex items-start justify-between mb-8">
                    {/* Left Side - Avatar and Info */}
                    <div className="flex items-start space-x-4">
                      {/* Avatar with gradient background */}
                      <div className="w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden flex-shrink-0" style={{ 
                        background: 'linear-gradient(135deg, #97B3FB 0%, #E9D7F4 100%)'
                      }}>
                        <User className="w-10 h-10 text-[#01253F]" strokeWidth={2} />
                      </div>
                      
                      {/* Name and Details */}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-[#01253F] mb-2">
                          {selectedApplicant.name}
                        </h3>
                        <p className="text-lg font-bold text-[#01253F] mb-2">
                          {selectedApplicant.experience}
                        </p>
                        <p className="text-base text-gray-600">
                          {selectedApplicant.location}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right Side - Express Interest Button */}
                    <button className="bg-[#4A90E2] hover:bg-[#357ABD] text-white px-6 py-3 rounded-lg font-bold text-base transition-colors whitespace-nowrap">
                      Express Interest
                    </button>
                  </div>
                  
                  {/* Horizontal Divider */}
                  <div className="w-full h-px bg-gray-300 mb-8"></div>
                  
                  {/* Bio Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-600 mb-4">Bio</h4>
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
                    <h4 className="text-lg font-bold text-gray-600 mb-4">Skills</h4>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-4 py-2 border-2 border-gray-400 rounded-full text-base text-gray-800 font-medium">
                        Leadership
                      </span>
                      <span className="px-4 py-2 border-2 border-gray-400 rounded-full text-base text-gray-800 font-medium">
                        Safety
                      </span>
                      <span className="px-4 py-2 border-2 border-gray-400 rounded-full text-base text-gray-800 font-medium">
                        Adaptability
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </BaseLayout>
  );
};

export default ApplicantsPage;
