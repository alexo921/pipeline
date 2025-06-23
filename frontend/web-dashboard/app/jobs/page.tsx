'use client';

import { useState, useEffect } from 'react';
import JobModal from '../components/JobModal';
import { Job, Tag, TagType } from '../types/job';
import { Search, MapPin, Filter, ChevronDown, X } from 'lucide-react';

// Dynamic job data loader
const loadJobData = async (): Promise<Job[]> => {
  try {
    const response = await fetch('/api/jobs');
    if (response.ok) {
      const rawJobs = await response.json();
      return transformJobData(rawJobs);
    }
  } catch (error) {
    console.log('Failed to load dynamic data, using fallback');
  }
  
  // Fallback to static data if API fails
  return fallbackJobs;
};

// Transform raw job data to our Job interface
const transformJobData = (rawJobs: any[]): Job[] => {
  return rawJobs.map((job, index) => {
    // Format salary display
    let salaryDisplay = "Competitive";
    if (job.salary && job.salary.min && job.salary.max) {
      const minFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(job.salary.min);
      const maxFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(job.salary.max);
      salaryDisplay = `${minFormatted} - ${maxFormatted}/year`;
    } else if (typeof job.salary === 'string') {
      salaryDisplay = job.salary;
    }

    return {
      id: job.id || `job_${index + 1}`,
      title: job.title || 'No Title',
      company: job.company || 'Unknown Company',
      location: job.location || 'Location TBD',
      salary: salaryDisplay,
      tags: [
        { id: index * 3 + 1, label: getJobCategory(job.title || '', job.category), type: "category" as TagType },
        { id: index * 3 + 2, label: job.job_type || job.type || "Full-Time", type: "employment" as TagType },
        { id: index * 3 + 3, label: getExperienceLevel(job.title || '', job.description || job.requirements || ''), type: "experience" as TagType }
      ],
      overview: job.description || job.requirements || "No description available.",
      url: job.url || undefined // Include the job URL for applications
    };
  });
};

// Helper function to categorize jobs
const getJobCategory = (title: string, category?: string): string => {
  // Use provided category first if available
  if (category) {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('nursing')) return 'Nurse';
    if (categoryLower.includes('cna')) return 'CNA';
    if (categoryLower.includes('medical assistant')) return 'Medical Assistant';
    if (categoryLower.includes('home health')) return 'Home Health';
    if (categoryLower.includes('therapy')) return 'Therapy';
    if (categoryLower.includes('admin')) return 'Administration';
    return category;
  }
  
  // Fall back to title-based categorization
  const titleLower = title.toLowerCase();
  if (titleLower.includes('nurse') || titleLower.includes('rn') || titleLower.includes('lpn')) return 'Nurse';
  if (titleLower.includes('cna') || titleLower.includes('aide') || titleLower.includes('assistant')) return 'Healthcare';
  if (titleLower.includes('therapist') || titleLower.includes('therapy')) return 'Therapy';
  if (titleLower.includes('tech') || titleLower.includes('technician')) return 'Technical';
  return 'Healthcare';
};

// Helper function to determine experience level
const getExperienceLevel = (title: string, description: string): string => {
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('senior') || text.includes('lead') || text.includes('supervisor')) return 'Senior-Level';
  if (text.includes('entry') || text.includes('new grad') || text.includes('recent graduate')) return 'Entry-Level';
  return 'Mid-Level';
};

// Fallback job data (same as before but as backup)
const fallbackJobs: Job[] = [
  {
    id: 1,
    title: "Home Health Aide/HHA",
    company: "BrightStar Care",
    location: "Melbourne, FL",
    salary: "Competitive",
    tags: [
      { id: 1, label: "Healthcare", type: "category" as TagType },
      { id: 2, label: "Part-Time", type: "employment" as TagType },
      { id: 3, label: "Entry-Level", type: "experience" as TagType }
    ],
    overview: "Join a leader in the home health care industry - BrightStar of Brevard County is growing rapidly. We are looking for caregivers who are passionate about their work and want to become part of an organization that is setting the professional standard for what the in home care experience should be.",
    url: "https://www.mycnajobs.com/job-listings/home-health-aide-hha"
  },
  {
    id: 2,
    title: "CNA/HHA-Hiring Immediately! Flexible Shifts!",
    company: "BrightStar Care",
    location: "Cocoa, FL",
    salary: "Competitive",
    tags: [
      { id: 4, label: "Healthcare", type: "category" as TagType },
      { id: 5, label: "Full-Time", type: "employment" as TagType },
      { id: 6, label: "Entry-Level", type: "experience" as TagType }
    ],
    overview: "Join a leader in the home health care industry - BrightStar of Brevard County is growing rapidly. We are looking for caregivers who are passionate about their work and want to become part of an organization that is setting the professional standard for what the in home care experience should be.",
    url: "https://www.mycnajobs.com/job-listings/cna-hha-hiring-immediately"
  },
  {
    id: 3,
    title: "Registered Nurse - ICU",
    company: "Memorial Healthcare",
    location: "Tampa, FL",
    salary: "$28-35/hour",
    tags: [
      { id: 7, label: "Nurse", type: "category" as TagType },
      { id: 8, label: "Full-Time", type: "employment" as TagType },
      { id: 9, label: "Mid-Level", type: "experience" as TagType }
    ],
    overview: "Memorial Healthcare is seeking experienced ICU nurses to join our critical care team. We offer competitive compensation, comprehensive benefits, and opportunities for professional growth.",
    url: "https://www.memorialhealthcare.com/careers/registered-nurse-icu"
  },
  {
    id: 4,
    title: "Physical Therapy Assistant",
    company: "Rehabilitation Partners",
    location: "Orlando, FL",
    salary: "$22-28/hour",
    tags: [
      { id: 10, label: "Therapy", type: "category" as TagType },
      { id: 11, label: "Full-Time", type: "employment" as TagType },
      { id: 12, label: "Entry-Level", type: "experience" as TagType }
    ],
    overview: "Join our dynamic rehabilitation team as a Physical Therapy Assistant. Work with patients recovering from injuries and surgeries to help them regain mobility and strength.",
    url: "https://www.rehabilitationpartners.com/careers/physical-therapy-assistant"
  },
  {
    id: 5,
    title: "Medical Assistant",
    company: "Family Medical Center",
    location: "Jacksonville, FL",
    salary: "$16-20/hour",
    tags: [
      { id: 13, label: "Healthcare", type: "category" as TagType },
      { id: 14, label: "Full-Time", type: "employment" as TagType },
      { id: 15, label: "Entry-Level", type: "experience" as TagType }
    ],
    overview: "Family Medical Center is seeking a Medical Assistant to join our primary care team. Responsibilities include patient intake, vital signs, assisting with examinations, and administrative tasks.",
    url: "https://www.familymedicalcenter.com/careers/medical-assistant"
  },
  {
    id: 6,
    title: "Licensed Practical Nurse - LPN",
    company: "Sunshine Senior Living",
    location: "Miami, FL",
    salary: "$24-30/hour",
    tags: [
      { id: 16, label: "Nurse", type: "category" as TagType },
      { id: 17, label: "Full-Time", type: "employment" as TagType },
      { id: 18, label: "Mid-Level", type: "experience" as TagType }
    ],
    overview: "Sunshine Senior Living is looking for compassionate LPNs to provide quality care to our residents. We offer competitive wages, excellent benefits, and a positive work environment.",
    url: "https://www.sunshineseniorliving.com/careers/lpn"
  },
  {
    id: 7,
    title: "Respiratory Therapist",
    company: "Regional Medical Center",
    location: "Fort Lauderdale, FL",
    salary: "$30-38/hour",
    tags: [
      { id: 19, label: "Therapy", type: "category" as TagType },
      { id: 20, label: "Full-Time", type: "employment" as TagType },
      { id: 21, label: "Mid-Level", type: "experience" as TagType }
    ],
    overview: "Regional Medical Center is seeking a Respiratory Therapist to join our pulmonary care team. Provide respiratory care services to patients with breathing disorders.",
    url: "https://www.regionalmedicalcenter.com/careers/respiratory-therapist"
  },
  {
    id: 8,
    title: "Pharmacy Technician",
    company: "Community Pharmacy",
    location: "Gainesville, FL",
    salary: "$15-19/hour",
    tags: [
      { id: 22, label: "Technical", type: "category" as TagType },
      { id: 23, label: "Part-Time", type: "employment" as TagType },
      { id: 24, label: "Entry-Level", type: "experience" as TagType }
    ],
    overview: "Community Pharmacy is hiring a Pharmacy Technician to assist pharmacists with prescription processing and customer service.",
    url: "https://www.communitypharmacy.com/careers/pharmacy-technician"
  }
];

export default function JobsPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [activeFilters, setActiveFilters] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationSearch, setLocationSearch] = useState('');

  const jobsPerPage = 8; // Changed from 6 to 8

  // Load job data on component mount
  useEffect(() => {
    const initializeJobs = async () => {
      setLoading(true);
      const jobs = await loadJobData();
      setAllJobs(jobs);
      setFilteredJobs(jobs);
      if (jobs.length > 0) {
        setSelectedJob(jobs[0]);
      }
      setLoading(false);
    };

    initializeJobs();
  }, []);

  // Available filter options - dynamically generated from loaded data
  const filterOptions = {
    categories: Array.from(new Set(allJobs.flatMap(job => job.tags.filter(tag => tag.type === 'category').map(tag => tag.label)))),
    employment: Array.from(new Set(allJobs.flatMap(job => job.tags.filter(tag => tag.type === 'employment').map(tag => tag.label)))),
    experience: Array.from(new Set(allJobs.flatMap(job => job.tags.filter(tag => tag.type === 'experience').map(tag => tag.label))))
  };

  // Available locations - dynamically generated from loaded data
  const allLocations = [
    "All Locations",
    ...Array.from(new Set(allJobs.map(job => job.location))).sort()
  ];

  // Filtered locations based on search
  const filteredLocations = allLocations.filter(location => 
    location.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Filter jobs based on search, location, and active filters
  useEffect(() => {
    const filtered = allJobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = selectedLocation === 'All Locations' || job.location === selectedLocation;
      
      const matchesFilters = activeFilters.length === 0 || 
                            activeFilters.some(filter => 
                              job.tags.some(tag => tag.label === filter.label)
                            );
      
      return matchesSearch && matchesLocation && matchesFilters;
    });
    
    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allJobs, searchTerm, selectedLocation, activeFilters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleLocationToggle = () => {
    setIsLocationOpen(!isLocationOpen);
    setIsFiltersOpen(false); // Close filters dropdown
  };

  const handleFiltersToggle = () => {
    setIsFiltersOpen(!isFiltersOpen);
    setIsLocationOpen(false); // Close location dropdown
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    setIsLocationOpen(false);
    setLocationSearch(''); // Clear search when location is selected
  };

  const handleFilterToggle = (filter: { label: string; type: TagType }) => {
    const newFilter: Tag = { 
      id: Date.now() + Math.random(), 
      label: filter.label, 
      type: filter.type 
    };
    
    setActiveFilters(prev => 
      prev.some(f => f.label === filter.label)
        ? prev.filter(f => f.label !== filter.label)
        : [...prev, newFilter]
    );
  };

  const removeFilter = (filter: Tag) => {
    setActiveFilters(prev => prev.filter(f => f.label !== filter.label));
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
  };

  const handleContainerClick = () => {
    setSelectedJob(null);
  };

  const handlePaginationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Do nothing - just prevent bubbling to container
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getTagColor = (label: string) => {
    if (filterOptions.categories.includes(label)) return 'bg-[#C9C7FB]';
    if (filterOptions.employment.includes(label)) return 'bg-[#8AADFC]';
    if (filterOptions.experience.includes(label)) return 'bg-[#FBDFF1]';
    return 'bg-gray-200';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] font-baloo">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
              <p className="text-[#7691A4] text-lg">Loading jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient blurs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full blur-3xl"></div>
      
      {/* Page Header */}
      <div className="w-full py-12">
        <div className="max-w-[1400px] mx-auto px-8">
          <h1 className="text-[76px] font-black leading-[115%] text-[#01253F] font-baloo">
            Job Board
          </h1>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-[1400px] mx-auto px-8 pb-12">
        <div 
          className="bg-[rgba(244,244,244,0.6)] rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-4"
          onClick={handleContainerClick}
        >
          {/* Search Bar */}
          <div className="flex gap-3 mb-6">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-sm">
                <Search className="w-6 h-6 text-[#7691A4] mr-3" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 text-[20px] font-bold text-[#7691A4] placeholder-[#7691A4] bg-transparent outline-none font-avenir"
                />
              </div>
            </div>

            {/* Location Dropdown */}
            <div className="relative">
              <button
                onClick={handleLocationToggle}
                className="flex items-center bg-white rounded-full px-6 py-3 shadow-sm min-w-[180px] justify-between"
              >
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-[#7691A4] mr-2" strokeWidth={2} />
                  <span className="text-[20px] font-bold text-[#7691A4] font-avenir">
                    {selectedLocation === 'All Locations' ? 'Location' : selectedLocation.split(',')[0]}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-[#7691A4] transition-transform ${isLocationOpen ? 'rotate-180' : 'rotate-90'}`} strokeWidth={2} />
              </button>
              
              {isLocationOpen && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-lg border border-gray-200 min-w-[250px] z-10">
                  {/* Search input */}
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full px-3 py-2 text-[16px] text-[#7691A4] placeholder-[#7691A4] border border-gray-300 rounded-lg outline-none focus:border-[#2466D0] font-avenir"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Location list */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((location) => (
                        <button
                          key={location}
                          onClick={() => handleLocationChange(location)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-2xl last:rounded-b-2xl font-avenir ${
                            selectedLocation === location ? 'bg-blue-50 text-[#2466D0] font-bold' : 'text-[#7691A4]'
                          }`}
                        >
                          {location}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-[#7691A4] font-avenir text-center">
                        No locations found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Filters Dropdown */}
            <div className="relative">
              <button
                onClick={handleFiltersToggle}
                className="flex items-center bg-white rounded-full px-6 py-3 shadow-sm min-w-[160px] justify-between"
              >
                <div className="flex items-center">
                  <Filter className="w-5 h-5 text-[#7691A4] mr-2" strokeWidth={2} />
                  <span className="text-[20px] font-bold text-[#7691A4] font-avenir">
                    Filters
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-[#7691A4] transition-transform ${isFiltersOpen ? 'rotate-180' : 'rotate-90'}`} strokeWidth={2} />
              </button>
              
              {isFiltersOpen && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-lg border border-gray-200 min-w-[250px] z-10 p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-[#01253F] mb-2 font-avenir">Category</h4>
                      <div className="space-y-2">
                        {filterOptions.categories.map((category) => (
                          <label key={category} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={activeFilters.some(f => f.label === category)}
                              onChange={() => handleFilterToggle({ label: category, type: "category" as TagType })}
                              className="mr-2 accent-[#2466D0]"
                            />
                            <span className="text-[#7691A4] font-avenir">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-[#01253F] mb-2 font-avenir">Employment Type</h4>
                      <div className="space-y-2">
                        {filterOptions.employment.map((type) => (
                          <label key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={activeFilters.some(f => f.label === type)}
                              onChange={() => handleFilterToggle({ label: type, type: "employment" as TagType })}
                              className="mr-2 accent-[#2466D0]"
                            />
                            <span className="text-[#7691A4] font-avenir">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#01253F] mb-2 font-avenir">Experience Level</h4>
                      <div className="space-y-2">
                        {filterOptions.experience.map((level) => (
                          <label key={level} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={activeFilters.some(f => f.label === level)}
                              onChange={() => handleFilterToggle({ label: level, type: "experience" as TagType })}
                              className="mr-2 accent-[#2466D0]"
                            />
                            <span className="text-[#7691A4] font-avenir">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Tags */}
          {activeFilters.length > 0 && (
            <div className="flex gap-3 mb-6 flex-wrap">
              {activeFilters.map((filter) => (
                <div key={filter.label} className={`flex items-center ${getTagColor(filter.label)} rounded-full px-4 py-2`}>
                  <button
                    onClick={() => removeFilter(filter)}
                    className="w-6 h-6 bg-[#01253F] rounded-full mr-2 flex items-center justify-center cursor-pointer hover:bg-[#012a4a] transition-colors"
                  >
                    <X className="w-3 h-3 text-white" strokeWidth={3} />
                  </button>
                  <span className="text-[16px] font-bold text-[#01253F] font-avenir">
                    {filter.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-[20px] font-bold text-[#7691A4] font-avenir">
              We've found <span className="text-[#01253F]">{filteredJobs.length}</span> jobs!
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="flex justify-center gap-8">
            {/* Left Column - Job Listings */}
            <div className="space-y-4 flex-1 max-w-2xl">
              {currentJobs.length > 0 ? (
                currentJobs.map((job) => (
                  <div 
                    key={job.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleJobClick(job);
                    }}
                    className={`bg-white rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] p-6 cursor-pointer hover:shadow-[6px_4px_15px_rgba(36,102,208,0.6)] transition-all duration-200 w-full overflow-hidden ${
                      selectedJob?.id === job.id ? 'ring-2 ring-[#2466D0]' : ''
                    }`}
                    style={{
                      height: '212px'
                    }}
                  >
                    <div className="flex justify-between items-start mb-4 h-full">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-[24px] font-black leading-[130%] text-[#2466D0] mb-2 font-avenir truncate">
                          {job.title}
                        </h3>
                        <p className="text-[14px] font-bold leading-[140%] text-[#01253F] font-avenir mb-3">
                          {job.company}<br />
                          {job.location}<br />
                          {job.salary}
                        </p>
                      </div>
                      
                      {/* Tags on the right side */}
                      <div className="flex flex-col gap-2 items-end">
                        {job.tags.slice(0, 3).map((tag) => (
                          <div key={tag.id} className={`flex items-center ${getTagColor(tag.label)} rounded-full px-3 py-1`}>
                            <span className="text-[12px] font-bold text-[#01253F] font-avenir whitespace-nowrap">
                              {tag.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-[20px] text-[#7691A4] font-avenir">No jobs match your current filters.</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8" onClick={handlePaginationClick}>
                  {/* Previous Button */}
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePageChange(currentPage - 1);
                      }}
                      className="flex items-center rounded-full px-6 py-3 hover:bg-gray-100 transition-colors cursor-pointer bg-white shadow-sm"
                    >
                      <ChevronDown className="w-5 h-5 text-[#7691A4] rotate-90 mr-2" strokeWidth={2} />
                      Prev
                    </button>
                  )}
                  
                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={`page-${page}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`Clicking page ${page}, current page: ${currentPage}`);
                        handlePageChange(page);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                      }}
                      className={`rounded-full w-10 h-10 flex items-center justify-center transition-colors cursor-pointer shadow-sm text-[20px] font-bold font-avenir ${
                        currentPage === page
                          ? 'bg-[#01253F] text-white'
                          : 'bg-white text-[#01253F] hover:bg-gray-100'
                      }`}
                      style={{ zIndex: 10 }}
                    >
                      {page}
                    </button>
                  ))}
                  
                  {/* Next Button */}
                  {currentPage < totalPages && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePageChange(currentPage + 1);
                      }}
                      className="flex items-center rounded-full px-6 py-3 hover:bg-gray-100 transition-colors cursor-pointer bg-white shadow-sm"
                    >
                      Next
                      <ChevronDown className="w-5 h-5 text-[#7691A4] -rotate-90 ml-2" strokeWidth={2} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Job Details */}
            <div 
              className={`bg-white rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] ${!selectedJob ? 'invisible' : ''}`}
              style={{
                width: '705px',
                height: '1503px'
              }}
            >
              {selectedJob ? (
                <div className="p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-[30px] font-black leading-[130%] text-[#2466D0] mb-3 font-avenir">
                        {selectedJob.title}
                      </h2>
                      <p className="text-[16px] font-bold leading-[140%] text-[#01253F] font-avenir">
                        {selectedJob.company}<br />
                        {selectedJob.location}<br />
                        {selectedJob.salary}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (selectedJob?.url) {
                          window.open(selectedJob.url, '_blank', 'noopener,noreferrer');
                        } else {
                          alert('Application URL not available for this job.');
                        }
                      }}
                      className="bg-[#2CB3BF] text-white font-black text-[20px] py-3 px-6 rounded-[12px] hover:bg-[#269aa5] transition-colors shadow-lg font-avenir"
                    >
                      Apply
                    </button>
                  </div>
                  
                  <div className="flex gap-3 mb-6 flex-wrap">
                    {selectedJob.tags.map((tag) => (
                      <div key={tag.id} className={`flex items-center ${getTagColor(tag.label)} rounded-full px-4 py-2`}>
                        <span className="text-[14px] font-bold text-[#01253F] font-avenir">
                          {tag.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-[#8AADFC] pt-6">
                    <h3 className="text-[18px] font-bold leading-[130%] text-[#01253F] mb-4 font-baloo">
                      Overview
                    </h3>
                    <p className="text-[16px] font-[350] leading-[196%] tracking-[0%] text-[#01253F] font-avenir">
                      {selectedJob.overview}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 font-avenir">
                  Select a job to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 