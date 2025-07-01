'use client';

import { useState, useEffect } from 'react';
import JobModal from '../components/JobModal';
import { Job, Tag, TagType } from '../types/job';
import { Search, MapPin, Filter, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { env } from 'process';

// Load job data from JSON files
const loadJobData = async (): Promise<Job[]> => {
  try {
    // Try to load from the enhanced descriptions file first
    const response = await fetch('/brightstar_ct_jobs_1000_20250625_002803_enhanced_descriptions.json');
    if (response.ok) {
      const data = await response.json();
      return transformJobData(data);
    }
    
    // Fallback to the regular file
    const fallbackResponse = await fetch('/brightstar_ct_jobs_1000_20250625_002803.json');
    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      return transformJobData(data);
    }
    
    throw new Error('Failed to load job data');
  } catch (error) {
    console.error('Error loading job data:', error);
    return [];
  }
};

const transformJobData = (rawJobs: Record<string, unknown>[]): Job[] => {
  console.log('Raw jobs data sample:', rawJobs.slice(0, 2)); // Debug log
  
  return rawJobs.map((job, index) => {
    const title = (job.title as string) || 'Unknown Position';
    const description = (job.description as string) || '';
    const url = (job.url as string) || '';
    
    // Debug log for first few jobs
    if (index < 3) {
      console.log(`Job ${index + 1}:`, { title, url });
    }
    
    return {
      id: index + 1,
      title,
      company: (job.company as string) || 'Unknown Company',
      location: (job.location as string) || 'Unknown Location',
      salary: (job.salary_range as string) || 'Salary not specified',
      url,
      overview: (job.overview as string) || 'Community Focused. Care Driven.',
      description,
      requirements: (job.requirements as string[] | string) || [],
      tags: generateTags(title, description, job.category as string)
    };
  });
};

// Generate tags for a job based on title, description, and category
const generateTags = (title: string, description: string, category?: string): Tag[] => {
  const tags: Tag[] = [];
  
  // Category tag
  const jobCategory = getJobCategory(title, category);
  tags.push({ id: Date.now() + 1, label: jobCategory, type: 'category' });
  
  // Employment type tag
  const employmentType = getEmploymentType(title, description);
  tags.push({ id: Date.now() + 2, label: employmentType, type: 'employment' });
  
  // Experience level tag
  const experienceLevel = getExperienceLevel(title, description);
  tags.push({ id: Date.now() + 3, label: experienceLevel, type: 'experience' });
  
  return tags;
};

const getJobCategory = (title: string, category?: string): string => {
  if (category) return category;
  
  const titleLower = title.toLowerCase();
  if (titleLower.includes('nurse') || titleLower.includes('rn') || titleLower.includes('lpn')) {
    return 'Nursing';
  } else if (titleLower.includes('caregiver') || titleLower.includes('care') || titleLower.includes('home health')) {
    return 'Caregiving';
  } else if (titleLower.includes('therapist') || titleLower.includes('therapy')) {
    return 'Therapy';
  } else if (titleLower.includes('manager') || titleLower.includes('supervisor')) {
    return 'Management';
  } else if (titleLower.includes('coordinator') || titleLower.includes('specialist')) {
    return 'Coordination';
  } else {
    return 'Healthcare';
  }
};

const getEmploymentType = (title: string, description: string): string => {
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('part-time') || text.includes('part time')) {
    return 'Part-Time';
  } else if (text.includes('per diem') || text.includes('per diem')) {
    return 'Per Diem';
  } else if (text.includes('contract') || text.includes('temporary')) {
    return 'Contract';
  } else {
    return 'Full-Time';
  }
};

const getExperienceLevel = (title: string, description: string): string => {
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('senior') || text.includes('lead') || text.includes('manager')) {
    return 'Senior';
  } else if (text.includes('entry') || text.includes('new grad') || text.includes('recent graduate')) {
    return 'Entry Level';
  } else if (text.includes('experienced') || text.includes('years experience')) {
    return 'Experienced';
  } else {
    return 'Mid Level';
  }
};

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  const jobsPerPage = 18; // Show 18 jobs per page maximum

  // Load job data
  useEffect(() => {
    const initializeJobs = async () => {
      try {
        const jobData = await loadJobData();
        setJobs(jobData);
        setFilteredJobs(jobData);
        setCurrentPage(1); // Reset to first page when data loads
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeJobs();
  }, []);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      // Mobile detection logic can be added here if needed
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Available filter options - dynamically generated from loaded data
  const filterOptions = {
    categories: Array.from(new Set(jobs.flatMap(job => job.tags.filter(tag => tag.type === 'category').map(tag => tag.label)))),
    employment: Array.from(new Set(jobs.flatMap(job => job.tags.filter(tag => tag.type === 'employment').map(tag => tag.label)))),
    experience: Array.from(new Set(jobs.flatMap(job => job.tags.filter(tag => tag.type === 'experience').map(tag => tag.label))))
  };

  // Available locations - dynamically generated from loaded data
  const allLocations = [
    "All Locations",
    ...Array.from(new Set(jobs.map(job => job.location))).sort()
  ];

  // Filtered locations based on search
  const filteredLocations = allLocations.filter(location => 
    location.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Filter jobs based on search, location, and active filters
  useEffect(() => {
    const filtered = jobs.filter(job => {
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
  }, [jobs, searchTerm, selectedLocation, activeFilters]);

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
        // Only close the modal if no job is selected
    if (!selectedJob) {
      setSelectedJob(null);
    }
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

  const handleApply = async () => {
    if (user) {
      if (selectedJob?.url) {
        
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/applied-jobs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id, jobId: selectedJob.id, jobUrl:selectedJob.url }),
          credentials: "include",
        });

        window.open(selectedJob.url, '_blank', 'noopener,noreferrer');
      } else {
        alert('Application URL not available for this job.');
      }
    } 
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] font-avenir">
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

  // Generate pagination numbers with ellipsis for large page counts
  const generatePaginationNumbers = (current: number, total: number): (number | string)[] => {
    const numbers: (number | string)[] = [];
    const maxVisible = 5;
    
    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        numbers.push(i);
      }
    } else {
      numbers.push(1);
      
      if (current > 3) {
        numbers.push('...');
      }
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== total) {
          numbers.push(i);
        }
      }
      
      if (current < total - 2) {
        numbers.push('...');
      }
      
      numbers.push(total);
    }
    
    return numbers;
  };

  let paginationNumbers: (number | string)[] = [];
  if (typeof window !== 'undefined' && totalPages > 1) {
    paginationNumbers = generatePaginationNumbers(currentPage, totalPages);
    console.log('Pagination numbers:', paginationNumbers);
  }

  return (
    <div className="min-h-screen relative">
      {/* Gradient blurs - responsive */}
      <div className="absolute top-0 right-0 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full blur-3xl"></div>
      
      {/* Page Header - Mobile optimized */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[76px] font-black leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            Job Board
          </h1>
        </div>
      </div>

      {/* Main Content Container - Mobile full width */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12">
        <div 
          className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative"
          onClick={handleContainerClick}
        >
          {/* Search Bar - Mobile focused */}
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 mb-4 lg:mb-6">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="flex items-center bg-white rounded-full px-4 lg:px-6 py-3 lg:py-3 shadow-sm">
                <Search className="w-5 h-5 lg:w-6 lg:h-6 text-[#7691A4] mr-3 flex-shrink-0" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 text-base lg:text-[20px] font-bold text-[#7691A4] placeholder-[#7691A4] bg-transparent outline-none font-avenir"
                />
              </div>
            </div>

            {/* Location Dropdown */}
            <div className="relative">
              <button
                onClick={handleLocationToggle}
                className="flex items-center bg-white rounded-full px-4 lg:px-6 py-3 lg:py-3 shadow-sm w-full lg:min-w-[180px] justify-between"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <MapPin className="w-5 h-5 lg:w-5 lg:h-5 text-[#7691A4] mr-2 flex-shrink-0" strokeWidth={2} />
                  <span className="text-base lg:text-[20px] font-bold text-[#7691A4] font-avenir truncate">
                    {selectedLocation === 'All Locations' ? 'Location' : selectedLocation.split(',')[0]}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 lg:w-5 lg:h-5 text-[#7691A4] transition-transform flex-shrink-0 ml-1 ${isLocationOpen ? 'rotate-180' : 'rotate-90'}`} strokeWidth={2} />
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
                className="flex items-center bg-white rounded-full px-4 lg:px-6 py-3 lg:py-3 shadow-sm w-full lg:min-w-[160px] justify-between"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <Filter className="w-5 h-5 lg:w-5 lg:h-5 text-[#7691A4] mr-2 flex-shrink-0" strokeWidth={2} />
                  <span className="text-base lg:text-[20px] font-bold text-[#7691A4] font-avenir">
                    Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 lg:w-5 lg:h-5 text-[#7691A4] transition-transform flex-shrink-0 ml-1 ${isFiltersOpen ? 'rotate-180' : 'rotate-90'}`} strokeWidth={2} />
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
          <div className="mb-4 sm:mb-6">
            <p className="text-base sm:text-lg md:text-xl lg:text-[20px] font-bold text-[#7691A4] font-avenir">
              We&apos;ve found <span className="text-[#01253F]">{filteredJobs.length}</span> jobs!
            </p>
          </div>

          {/* Responsive Layout - Mobile: full width, Desktop: 50/50 split */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8 items-start w-full">
            {/* Job Listings - Mobile full width, Desktop 50% */}
            <div className="w-full lg:flex-1 lg:min-w-0 job-listings">
              <div className="space-y-4">
                {currentJobs.length > 0 ? (
                  currentJobs.map((job) => (
                    <div 
                      key={job.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleJobClick(job);
                      }}
                      className={`bg-white rounded-xl lg:rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] p-4 lg:p-6 cursor-pointer hover:shadow-[6px_4px_15px_rgba(36,102,208,0.6)] transition-all duration-200 w-full overflow-hidden ${
                        selectedJob?.id === job.id ? 'ring-2 ring-[#2466D0]' : ''
                      }`}
                      style={{
                        minHeight: '140px',
                        height: 'auto'
                      }}
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start h-full">
                        <div className="flex-1 min-w-0 lg:pr-4 mb-3 lg:mb-0">
                          <h3 className="text-lg lg:text-[20px] font-black leading-[130%] text-[#2466D0] mb-2 font-avenir line-clamp-2">
                            {job.title}
                          </h3>
                          <div className="text-sm lg:text-[14px] leading-[140%] text-[#01253F] font-avenir space-y-0.5">
                            <p className="font-bold">{job.company}</p>
                            <p>{job.location}</p>
                            <p>{job.salary}</p>
                          </div>
                        </div>
                        {/* Tags - Display in rows of 2 */}
                        <div className="flex flex-wrap gap-1.5 lg:gap-2" style={{ maxWidth: '200px' }}>
                          {job.tags.slice(0, 4).map((tag) => (
                            <div 
                              key={tag.id} 
                              className={`flex items-center ${getTagColor(tag.label)} rounded-full px-3 py-1`}
                              style={{ 
                                width: 'calc(50% - 0.375rem)',
                                minWidth: 'fit-content'
                              }}
                            >
                              <span className="text-xs lg:text-[12px] font-bold text-[#01253F] font-avenir whitespace-nowrap truncate">
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
                    <p className="text-lg lg:text-[20px] text-[#7691A4] font-avenir">No jobs match your current filters.</p>
                  </div>
                )}
              
              {/* Spacer to ensure enough scroll height for sticky behavior */}
              {currentJobs.length < 18 && (
                <div style={{ height: `${(18 - currentJobs.length) * 228}px` }} className="pointer-events-none"></div>
              )}

              {/* Pagination - Mobile optimized */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8 lg:mt-6" onClick={handlePaginationClick}>
                  {/* Previous Button */}
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePageChange(currentPage - 1);
                      }}
                      className="flex items-center rounded-full px-4 lg:px-6 py-2.5 lg:py-3 hover:bg-gray-100 transition-colors cursor-pointer bg-white shadow-sm text-sm lg:text-base font-avenir text-[#7691A4]"
                    >
                      <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-[#7691A4] rotate-90 mr-1 lg:mr-2" strokeWidth={2} />
                      Prev
                    </button>
                  )}
                  {/* Page Numbers with Smart Pagination */}
                  {paginationNumbers.map((page, index) => (
                    page === '...' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-base lg:text-[20px] font-bold font-avenir text-[#7691A4]"
                      >
                        ...
                      </span>
                    ) : (
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
                          handlePageChange(page as number);
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        className={`rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center transition-colors cursor-pointer shadow-sm text-base lg:text-[20px] font-bold font-avenir ${
                          currentPage === page
                            ? 'bg-[#01253F] text-white'
                            : 'bg-white text-[#01253F] hover:bg-gray-100'
                        }`}
                        style={{ zIndex: 10 }}
                      >
                        {page}
                      </button>
                    )
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
                      className="flex items-center rounded-full px-4 lg:px-6 py-2.5 lg:py-3 hover:bg-gray-100 transition-colors cursor-pointer bg-white shadow-sm text-sm lg:text-base font-avenir text-[#7691A4]"
                    >
                      Next
                      <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-[#7691A4] -rotate-90 ml-1 lg:ml-2" strokeWidth={2} />
                    </button>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Job Details Panel - Desktop 60% */}
            <div className="hidden lg:block lg:flex-1 lg:min-w-0 job-details-panel" style={{ maxWidth: '60%', overflowWrap: 'break-word' }}>
              {selectedJob ? (
                <div className="bg-white rounded-xl lg:rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] h-full flex flex-col overflow-hidden" style={{ maxWidth: '100%' }}>
                  {/* Header - Fixed */}
                  <div className="p-8 border-b border-gray-200 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <h2 className="text-[26px] font-black leading-[130%] text-[#2466D0] mb-3 font-avenir break-all whitespace-pre-wrap max-w-full" style={{wordBreak: 'break-word'}}>
                          {selectedJob.title}
                        </h2>
                        <div className="text-[16px] leading-[140%] text-[#01253F] font-avenir break-all whitespace-pre-wrap max-w-full" style={{wordBreak: 'break-word'}}>
                          <p className="font-bold">{selectedJob.company}</p>
                          <p>{selectedJob.location}</p>
                          <p>{selectedJob.salary}</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleApply}
                        className="bg-[#2CB3BF] text-white font-black text-[20px] py-3 px-6 rounded-[12px] hover:bg-[#269aa5] transition-colors shadow-lg font-avenir"
                      >
                        Apply
                      </button>
                    </div>
                    
                    {/* Tags - Display in rows of 2 */}
                    <div className="flex flex-wrap gap-3" style={{ maxWidth: '100%' }}>
                      {selectedJob.tags.map((tag) => (
                        <div 
                          key={tag.id} 
                          className={`flex items-center ${getTagColor(tag.label)} rounded-full px-4 py-2`}
                          style={{ 
                            width: 'calc(50% - 0.75rem)',
                            minWidth: 'fit-content'
                          }}
                        >
                          <span className="text-[14px] font-bold text-[#01253F] font-avenir truncate">
                            {tag.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content - Scrollable */}
                  <div 
                    className="flex-1 p-8 overflow-y-auto overflow-x-hidden" 
                    style={{
                      maxHeight: 'calc(100vh - 320px)',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e0 #f7fafc',
                      maxWidth: '100%',
                      overflowWrap: 'break-word'
                    }}
                  >
                    <div className="border-t-2 border-[#8AADFC] pt-6" style={{ maxWidth: '100%', overflowWrap: 'break-word' }}>
                      <h3 className="text-[18px] font-bold leading-[130%] text-[#01253F] mb-4 font-avenir break-all">
                        Overview
                      </h3>
                      <p className="text-[16px] font-[350] leading-[196%] tracking-[0%] text-[#01253F] font-avenir mb-6 break-all">
                        {selectedJob.overview}
                      </p>

                      {/* Job Description */}
                      {selectedJob.description && (
                        <div className="mb-6" style={{ maxWidth: '100%', overflowWrap: 'break-word' }}>
                          <h3 className="text-[18px] font-bold leading-[130%] text-[#01253F] mb-4 font-avenir break-all">
                            Job Description
                          </h3>
                          <div className="text-[16px] font-[350] leading-[196%] tracking-[0%] text-[#01253F] font-avenir break-words overflow-hidden whitespace-normal" style={{ 
                            wordBreak: 'break-word', 
                            maxWidth: '100%',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {selectedJob.description
                              .replace(/Skip to content/g, '')
                              .replace(/Back to search/g, '')
                              .replace(/EASY APPLY.*?Apply Now/g, '')}
                          </div>
                        </div>
                      )}

                      {/* Requirements */}
                      {selectedJob.requirements && (
                        <div className="mb-6" style={{ maxWidth: '100%', overflowWrap: 'break-word' }}>
                          <h3 className="text-[18px] font-bold leading-[130%] text-[#01253F] mb-4 font-avenir break-all">
                            Requirements
                          </h3>
                          <div className="text-[16px] font-[350] leading-[196%] tracking-[0%] text-[#01253F] font-avenir">
                            {Array.isArray(selectedJob.requirements) ? (
                              <ul className="list-disc pl-5 space-y-2">
                                {selectedJob.requirements.map((req, index) => (
                                  <li key={index} className="break-all whitespace-pre-wrap max-w-full" style={{wordBreak: 'break-word'}}>{req}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="break-all whitespace-pre-wrap max-w-full" style={{wordBreak: 'break-word'}}>{selectedJob.requirements}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 font-avenir">
                  Select a job to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Job Details Modal */}
      {selectedJob && (
        <div className="lg:hidden">
          <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
        
        /* Ensure 40/60 split on desktop (reduced left by 10%, increased right by 10%) */
        @media (min-width: 1024px) {
          .job-details-panel {
            flex: 1 1 60%;
            min-width: 0;
            position: sticky !important;
            top: 2rem !important;
            align-self: flex-start !important;
            height: fit-content !important;
            max-height: calc(100vh - 64px) !important;
          }
          
          .job-listings {
            flex: 1 1 40%;
            min-width: 0;
          }
        }
        
        /* Responsive adjustments for different screen sizes */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .job-details-panel {
            flex: 1 1 58%;
            position: sticky !important;
            top: 2rem !important;
          }
          
          .job-listings {
            flex: 1 1 42%;
          }
        }
        
        @media (min-width: 1280px) and (max-width: 1535px) {
          .job-details-panel {
            flex: 1 1 60%;
            position: sticky !important;
            top: 2rem !important;
          }
          
          .job-listings {
            flex: 1 1 40%;
          }
        }
        
        @media (min-width: 1536px) {
          .job-details-panel {
            flex: 1 1 60%;
            position: sticky !important;
            top: 2rem !important;
          }
          
          .job-listings {
            flex: 1 1 40%;
          }
        }
      `}</style>
    </div>
  );
} 