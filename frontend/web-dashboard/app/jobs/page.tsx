'use client';

import { useState, useEffect } from 'react';
import JobModal from '../components/JobModal';
import { Job, Tag, TagType } from '../types/job';
import { Search, MapPin, Filter, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { env } from 'process';

// Load job data from live_data.json
const loadJobData = async (): Promise<Job[]> => {
  try {
    const allJobs: Job[] = [];
    
    // Load from live_data.json
    try {
      const response = await fetch('/live_data.json');
      if (response.ok) {
        const data = await response.json();
        allJobs.push(...transformJobData(data));
      }
    } catch (error) {
      console.error('Error loading live_data.json:', error);
    }
    
    // Filter jobs to only include healthcare-related positions
    const healthcareJobs = allJobs.filter(job => {
      const text = (job.title + ' ' + job.description + ' ' + job.company).toLowerCase();
      const healthcareKeywords = [
        'nurse', 'nursing', 'cna', 'lpn', 'rn', 'caregiver', 'care', 'health', 'medical',
        'homecare', 'home care', 'home health', 'assisted living', 'nursing home',
        'skilled nursing', 'memory care', 'rehabilitation', 'therapy', 'dietary',
        'housekeeping', 'maintenance', 'activities', 'social work', 'case manager'
      ];
      return healthcareKeywords.some(keyword => text.includes(keyword));
    });
    
    // Remove duplicates based on job ID
    const uniqueJobs = healthcareJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.id === job.id)
    );
    
    console.log(`Loaded ${uniqueJobs.length} unique healthcare jobs from ${allJobs.length} total entries`);
    return uniqueJobs;
    
  } catch (error) {
    console.error('Error loading job data:', error);
    return [];
  }
};

const transformJobData = (rawJobs: Record<string, unknown>[]): Job[] => {
  return rawJobs
    .map((job, index) => {
      const title = (job.title as string) || 'Unknown Position';
      const description = (job.description as string) || '';
      const url = (job.url as string) || '';
      const company = (job.company as string) || '';
      const location = (job.location as string) || '';
      
      // Handle both BrightStar format (salary_range) and comprehensive format (salary)
      const salary = (job.salary_range as string) || (job.salary as string) || '';
      
      // Use existing tags if available (comprehensive format), otherwise generate them (BrightStar format)
      let tags: Tag[];
      if (job.tags && Array.isArray(job.tags)) {
        // Convert comprehensive format tags to our Tag interface
        tags = (job.tags as any[]).map(tag => ({
          id: tag.id || Date.now() + Math.random(),
          label: tag.label,
          type: tag.type as TagType
        }));
      } else {
        // Generate tags for BrightStar format
        tags = generateTags(title, description, job.category as string);
      }
      
      return {
        id: (job.id as string) || `job_${index + 1}`,
        title,
        company,
        location,
        salary,
        url,
        overview: (job.overview as string) || 'Community Focused. Care Driven.',
        description,
        requirements: (job.requirements as string[] | string) || [],
        tags
      };
    })
    .filter(job => {
      // Filter out jobs with unknown or empty company names
      const company = job.company.trim().toLowerCase();
      return company !== '' && 
             company !== 'unknown company' && 
             company !== 'unknown' &&
             company !== 'n/a' &&
             company !== 'na';
    });
};

// Generate tags for a job based on title, description, and category
const generateTags = (title: string, description: string, category?: string): Tag[] => {
  const tags: Tag[] = [];
  
  // Job Setting tag (Purple)
  const jobSetting = getJobSetting(title, description);
  tags.push({ id: Date.now() + 1, label: jobSetting, type: 'job_setting' });
  
  // Employment Type tag (Blue)
  const employmentType = getEmploymentType(title, description);
  tags.push({ id: Date.now() + 2, label: employmentType, type: 'employment_type' });
  
  // Shift tag (Pink)
  const shift = getShift(title, description);
  tags.push({ id: Date.now() + 3, label: shift, type: 'shift' });
  
  return tags;
};

const getJobSetting = (title: string, description: string): string => {
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('nursing home') || text.includes('skilled nursing') || text.includes('ltc')) {
    return 'Nursing Home';
  } else if (text.includes('assisted living') || text.includes('alf') || text.includes('memory care')) {
    return 'Assisted Living Facility';
  } else if (text.includes('homecare') || text.includes('home care') || text.includes('home health') || text.includes('in-home')) {
    return 'Home Care';
  } else {
    return 'Nursing Home'; // Default to Nursing Home
  }
};

const getEmploymentType = (title: string, description: string): string => {
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('part-time') || text.includes('part time')) {
    return 'Part-Time';
  } else if (text.includes('per diem') || text.includes('per-diem') || text.includes('prn')) {
    return 'Per-Diem';
  } else if (text.includes('temp-to-perm') || text.includes('temp to perm') || text.includes('temporary to permanent')) {
    return 'Temp-To-Perm';
  } else if (text.includes('local contract') || text.includes('travel contract') || text.includes('contract position')) {
    return 'Local Contract';
  } else {
    return 'Full-Time'; // Default to Full-Time
  }
};

const getShift = (title: string, description: string): string => {
  // Check both title and description separately for better coverage
  const titleText = title.toLowerCase();
  const descText = description.toLowerCase();
  const combinedText = titleText + ' ' + descText;
  
  // Check description first as it often contains more detailed shift information
  const textToCheck = descText || combinedText;
  
  // First check for specific time patterns and return the exact time range
  const specificTimePatterns = [
    // Common healthcare shift patterns with exact times
    { pattern: /7\s*am\s*[-to]\s*3\s*(:00)?\s*pm/i, shift: '7AM-3PM' },
    { pattern: /3\s*pm\s*[-to]\s*11\s*(:00)?\s*pm/i, shift: '3PM-11PM' },
    { pattern: /11\s*pm\s*[-to]\s*7\s*(:00)?\s*am/i, shift: '11PM-7AM' },
    { pattern: /6\s*am\s*[-to]\s*2\s*(:00)?\s*pm/i, shift: '6AM-2PM' },
    { pattern: /2\s*pm\s*[-to]\s*10\s*(:00)?\s*pm/i, shift: '2PM-10PM' },
    { pattern: /10\s*pm\s*[-to]\s*6\s*(:00)?\s*am/i, shift: '10PM-6AM' },
    { pattern: /8\s*am\s*[-to]\s*4\s*(:00)?\s*pm/i, shift: '8AM-4PM' },
    { pattern: /4\s*pm\s*[-to]\s*12\s*(:00)?\s*(am|midnight)/i, shift: '4PM-12AM' },
    { pattern: /12\s*(am|midnight)\s*[-to]\s*8\s*(:00)?\s*am/i, shift: '12AM-8AM' },
    
    // More flexible patterns for common ranges
    { pattern: /(7|8)\s*(:?\d{0,2})?\s*am\s*[-to]\s*(3|4)\s*(:?\d{0,2})?\s*pm/i, shift: '7AM-3PM' },
    { pattern: /(3|4)\s*(:?\d{0,2})?\s*pm\s*[-to]\s*(11|12)\s*(:?\d{0,2})?\s*(pm|am)/i, shift: '3PM-11PM' },
    { pattern: /(11|12)\s*(:?\d{0,2})?\s*(pm|am)\s*[-to]\s*(7|8)\s*(:?\d{0,2})?\s*am/i, shift: '11PM-7AM' },
  ];
  
  for (const { pattern, shift } of specificTimePatterns) {
    if (pattern.test(textToCheck)) {
      return shift;
    }
  }
  
  // Check for explicit shift keywords (only if no specific times found)
  if (textToCheck.includes('overnight shift') || textToCheck.includes('night shift') || textToCheck.includes('graveyard shift')) {
    return 'Overnight';
  } else if (textToCheck.includes('morning shift') || textToCheck.includes('early morning')) {
    return 'Morning';
  } else if (textToCheck.includes('afternoon shift') || textToCheck.includes('midday')) {
    return 'Afternoon';
  } else if (textToCheck.includes('evening shift') || textToCheck.includes('late afternoon')) {
    return 'Evening';
  } else if (textToCheck.includes('night') || textToCheck.includes('overnight')) {
    return 'Night';
  }
  
  // Check for other time patterns and categorize by time
  const timePatterns = [
    // Overnight patterns (10pm-6am, 11pm-7am, 12am-8am, etc.)
    { pattern: /(10|11|12)(:?\d{0,2})?\s*(pm|am)\s*[-to]\s*(6|7|8)(:?\d{0,2})?\s*(am)/i, shift: 'Overnight' },
    { pattern: /(12|1|2|3|4|5)(:?\d{0,2})?\s*(am)\s*[-to]\s*(6|7|8|9|10)(:?\d{0,2})?\s*(am)/i, shift: 'Overnight' },
    
    // Morning patterns (5am-1pm, 6am-2pm, 7am-3pm, 8am-4pm, etc.)
    { pattern: /(5|6|7|8)(:?\d{0,2})?\s*(am)\s*[-to]\s*(1|2|3|4)(:?\d{0,2})?\s*(pm)/i, shift: 'Morning' },
    { pattern: /(5|6|7|8)(:?\d{0,2})?\s*(am)\s*[-to]\s*(12|1|2|3|4)(:?\d{0,2})?\s*(pm)/i, shift: 'Morning' },
    
    // Afternoon patterns (12pm-8pm, 1pm-9pm, 2pm-10pm, etc.)
    { pattern: /(12|1|2)(:?\d{0,2})?\s*(pm)\s*[-to]\s*(8|9|10)(:?\d{0,2})?\s*(pm)/i, shift: 'Afternoon' },
    
    // Evening patterns (3pm-11pm, 4pm-12am, 5pm-1am, etc.)
    { pattern: /(3|4|5)(:?\d{0,2})?\s*(pm)\s*[-to]\s*(11|12)(:?\d{0,2})?\s*(pm|am)/i, shift: 'Evening' },
    { pattern: /(3|4|5)(:?\d{0,2})?\s*(pm)\s*[-to]\s*(1|2)(:?\d{0,2})?\s*(am)/i, shift: 'Evening' },
  ];
  
  for (const { pattern, shift } of timePatterns) {
    if (pattern.test(textToCheck)) {
      return shift;
    }
  }
  
  // Check for short shifts (3-4 hours) and categorize by time
  const shortShiftPatterns = [
    { pattern: /(5|6|7|8|9)(:?\d{0,2})?\s*(am)\s*[-to]\s*(8|9|10|11)(:?\d{0,2})?\s*(am)/i, shift: 'Morning' },
    { pattern: /(10|11|12)(:?\d{0,2})?\s*(am)\s*[-to]\s*(1|2|3)(:?\d{0,2})?\s*(pm)/i, shift: 'Morning' },
    { pattern: /(12|1|2)(:?\d{0,2})?\s*(pm)\s*[-to]\s*(4|5|6)(:?\d{0,2})?\s*(pm)/i, shift: 'Afternoon' },
    { pattern: /(3|4|5)(:?\d{0,2})?\s*(pm)\s*[-to]\s*(7|8|9)(:?\d{0,2})?\s*(pm)/i, shift: 'Afternoon' },
    { pattern: /(6|7|8)(:?\d{0,2})?\s*(pm)\s*[-to]\s*(10|11|12)(:?\d{0,2})?\s*(pm|am)/i, shift: 'Evening' },
    { pattern: /(9|10|11)(:?\d{0,2})?\s*(pm)\s*[-to]\s*(12|1|2)(:?\d{0,2})?\s*(am)/i, shift: 'Night' },
  ];
  
  for (const { pattern, shift } of shortShiftPatterns) {
    if (pattern.test(textToCheck)) {
      return shift;
    }
  }
  
  // If no patterns found in description, check title as fallback
  if (descText && descText !== titleText) {
    // Check title for any missed patterns
    if (titleText.includes('overnight shift') || titleText.includes('night shift') || titleText.includes('graveyard shift')) {
      return 'Overnight';
    } else if (titleText.includes('morning shift') || titleText.includes('early morning')) {
      return 'Morning';
    } else if (titleText.includes('afternoon shift') || titleText.includes('midday')) {
      return 'Afternoon';
    } else if (titleText.includes('evening shift') || titleText.includes('late afternoon')) {
      return 'Evening';
    } else if (titleText.includes('night') || titleText.includes('overnight')) {
      return 'Night';
    }
  }
  
  // Default based on common healthcare patterns
  if (combinedText.includes('day shift') || combinedText.includes('daytime')) {
    return 'Morning';
  } else if (combinedText.includes('evening') || combinedText.includes('afternoon')) {
    return 'Afternoon';
  } else if (combinedText.includes('night') || combinedText.includes('overnight')) {
    return 'Night';
  }
  
  // Default to Morning for healthcare jobs
  return 'Morning';
};

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationInput, setLocationInput] = useState(''); // Changed from selectedLocation
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false); // Changed from isLocationOpen
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { user, showLoginModal } = useAuth();

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
    job_settings: Array.from(new Set(jobs.flatMap(job => job.tags.filter(tag => tag.type === 'job_setting').map(tag => tag.label)))),
    employment_types: Array.from(new Set(jobs.flatMap(job => job.tags.filter(tag => tag.type === 'employment_type').map(tag => tag.label)))),
    shifts: Array.from(new Set(jobs.flatMap(job => job.tags.filter(tag => tag.type === 'shift').map(tag => tag.label))))
  };

  // Available locations - dynamically generated from loaded data
  const allLocations = Array.from(new Set(jobs.map(job => job.location))).sort();

  // Filtered location suggestions based on input
  const locationSuggestions = allLocations.filter(location => 
    location.toLowerCase().includes(locationInput.toLowerCase()) && 
    location.toLowerCase() !== locationInput.toLowerCase() // Don't show exact matches
  ).slice(0, 5); // Limit to 5 suggestions

  // Filter jobs based on search, location, and active filters
  useEffect(() => {
    const filtered = jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Show all jobs when no location is entered, otherwise filter by location
      const matchesLocation = locationInput === '' || 
                             job.location.toLowerCase().includes(locationInput.toLowerCase());
      
      const matchesFilters = activeFilters.length === 0 || 
                            activeFilters.some(filter => 
                              job.tags.some(tag => tag.label === filter.label)
                            );
      
      return matchesSearch && matchesLocation && matchesFilters;
    });
    
    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [jobs, searchTerm, locationInput, activeFilters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    // Update suggestions based on the new value
    const newSuggestions = allLocations.filter(location => 
      location.toLowerCase().includes(value.toLowerCase()) && 
      location.toLowerCase() !== value.toLowerCase()
    ).slice(0, 5);
    setShowLocationSuggestions(value.length > 0 && newSuggestions.length > 0);
    setIsFiltersOpen(false); // Close filters dropdown
  };

  const handleLocationSuggestionClick = (location: string) => {
    setLocationInput(location);
    setShowLocationSuggestions(false);
  };

  const handleLocationInputFocus = () => {
    if (locationInput.length > 0 && locationSuggestions.length > 0) {
      setShowLocationSuggestions(true);
    }
  };

  const handleLocationInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowLocationSuggestions(false), 200);
  };

  const handleFiltersToggle = () => {
    setIsFiltersOpen(!isFiltersOpen);
    setShowLocationSuggestions(false); // Close location suggestions
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
    if (filterOptions.job_settings.includes(label)) return 'bg-purple-200'; // Purple for Job Setting
    if (filterOptions.employment_types.includes(label)) return 'bg-[#8AADFC]'; // Blue for Employment Type
    if (filterOptions.shifts.includes(label)) return 'bg-pink-200'; // Pink for Shift
    return 'bg-gray-200';
  };

  const handleApply = async () => {
    if (!user) {
      showLoginModal();
      return;
    }

    if (!selectedJob) {
      alert('Please select a job to apply.');
      return;
    }

    if (!selectedJob.url) {
      alert('Application URL not available for this job.');
      return;
    }

    try {
      // Track the application
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applied-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: user.id, 
          jobId: selectedJob.id, 
          jobUrl: selectedJob.url 
        }),
        credentials: "include",
      });

      if (!response.ok) {
        console.error('Failed to track application:', response.status);
      }

      // Open the job application URL
      window.open(selectedJob.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error applying for job:', error);
      // Still open the URL even if tracking fails
      window.open(selectedJob.url, '_blank', 'noopener,noreferrer');
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

  // Always generate pagination numbers when there are filtered jobs
  const paginationNumbers = filteredJobs.length > 0 ? generatePaginationNumbers(currentPage, totalPages) : [];

  return (
    <div className="min-h-screen relative bg-[#F4F4F4]">
      {/* Radial blue blur positioned in upper right */}
      <div 
        className="absolute pointer-events-none hidden md:block"
        style={{
          top: '-5%',
          right: '-10%',
          width: '1522px',
          height: '2585px',
          backgroundImage: 'url(/blur.svg)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          zIndex: 0
        }}
      ></div>
      
      {/* Mobile-only blur effect - smaller and properly contained */}
      <div 
        className="absolute pointer-events-none md:hidden"
        style={{
          top: '0',
          right: '0',
          width: '150px',
          height: '200px',
          background: `
            radial-gradient(
              ellipse at center,
              rgba(36, 102, 208, 0.1) 0%,
              rgba(36, 102, 208, 0.05) 40%,
              transparent 70%
            )
          `,
          filter: 'blur(30px)',
          zIndex: 0,
          overflow: 'hidden'
        }}
      ></div>
      
      {/* Page Header - Mobile optimized */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[76px] font-black leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            Job Board
          </h1>
        </div>
      </div>

      {/* Main Content Container - Mobile full width */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', minHeight: '100vh' }}>
        <div 
          className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative"
          onClick={handleContainerClick}
          style={{ zIndex: 1 }}
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

            {/* Location Autocomplete */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-full px-4 lg:px-6 py-3 lg:py-3 shadow-sm w-full lg:min-w-[180px]">
                <MapPin className="w-5 h-5 lg:w-5 lg:h-5 text-[#7691A4] mr-2 flex-shrink-0" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Enter location..."
                  value={locationInput}
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  onFocus={handleLocationInputFocus}
                  onBlur={handleLocationInputBlur}
                  className="flex-1 text-base lg:text-[20px] font-bold text-[#7691A4] placeholder-[#7691A4] bg-transparent outline-none font-avenir"
                />
                {locationInput && (
                  <button
                    onClick={() => handleLocationInputChange('')}
                    className="ml-2 text-[#7691A4] hover:text-[#2466D0] flex-shrink-0"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </div>
              
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-lg border border-gray-200 min-w-[250px] z-10">
                  <ul className="max-h-48 overflow-y-auto">
                    {locationSuggestions.map((location) => (
                      <li
                        key={location}
                        onClick={() => handleLocationSuggestionClick(location)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer font-avenir text-[#7691A4] first:rounded-t-2xl last:rounded-b-2xl"
                      >
                        {location}
                      </li>
                    ))}
                  </ul>
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
                      <h4 className="font-bold text-[#01253F] mb-2 font-avenir">Job Setting</h4>
                      <div className="space-y-2">
                        {filterOptions.job_settings.map((category) => (
                          <label key={category} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={activeFilters.some(f => f.label === category)}
                              onChange={() => handleFilterToggle({ label: category, type: "job_setting" as TagType })}
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
                        {filterOptions.employment_types.map((type) => (
                          <label key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={activeFilters.some(f => f.label === type)}
                              onChange={() => handleFilterToggle({ label: type, type: "employment_type" as TagType })}
                              className="mr-2 accent-[#2466D0]"
                            />
                            <span className="text-[#7691A4] font-avenir">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#01253F] mb-2 font-avenir">Shift</h4>
                      <div className="space-y-2">
                        {filterOptions.shifts.map((level) => (
                          <label key={level} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={activeFilters.some(f => f.label === level)}
                              onChange={() => handleFilterToggle({ label: level, type: "shift" as TagType })}
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
            <p className="text-base sm:text-lg md:text-xl lg:text-[18px] font-bold text-[#7691A4] font-avenir">
              We&apos;ve found <span className="text-[#2466D0]">{filteredJobs.length}</span> jobs!
            </p>
          </div>

          {/* Responsive Layout - Mobile: full width, Desktop: 50/50 split */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8 items-start w-full" style={{ alignItems: 'flex-start' }}>
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
                      className={`bg-white rounded-xl lg:rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] p-6 lg:p-8 cursor-pointer hover:shadow-[6px_4px_15px_rgba(36,102,208,0.6)] transition-all duration-200 w-full overflow-hidden ${
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
                            {job.location && job.location.trim() !== '' && job.location.trim().toLowerCase() !== 'unknown location' && (
                              <p>{job.location}</p>
                            )}
                            {job.salary && job.salary.trim() !== '' && job.salary.trim().toLowerCase() !== 'salary not specified' && (
                              <p>{job.salary}</p>
                            )}
                          </div>
                        </div>
                        {/* Tags - Display in rows of 2 */}
                        <div className="flex flex-wrap gap-3 lg:gap-4" style={{ maxWidth: '240px' }}>
                          {job.tags.slice(0, 4).map((tag) => (
                            <div 
                              key={tag.id} 
                              className={`flex items-center justify-center text-center ${getTagColor(tag.label)} rounded-full px-4 py-2`}
                              style={{ 
                                width: 'calc(50% - 0.75rem)',
                                minWidth: 'fit-content'
                              }}
                            >
                              <span className="text-sm font-bold text-[#01253F] font-avenir whitespace-nowrap truncate">
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
              
              {/* Pagination - Positioned right after job cards */}
              {filteredJobs.length > 0 && (
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

            {/* Job Details Panel - Desktop 55% */}
            <div className="hidden lg:block lg:flex-1 lg:min-w-0 job-details-panel lg:sticky lg:top-8 lg:self-start" style={{ 
              maxWidth: '55%', 
              overflowWrap: 'break-word',
              minHeight: '600px',
              height: 'min(1000px, 90vh)',
              maxHeight: '90vh'
            }}>
              {selectedJob ? (
                <div className="bg-white rounded-xl lg:rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] h-full flex flex-col overflow-hidden" style={{ maxWidth: '100%', zIndex: 10 }}>
                  {/* Header - Fixed */}
                  <div className="p-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <h2 className="text-[26px] font-black leading-[130%] text-[#2466D0] mb-3 font-avenir break-all whitespace-pre-wrap max-w-full" style={{wordBreak: 'break-word'}}>
                          {selectedJob.title}
                        </h2>
                        <div className="text-[16px] leading-[140%] text-[#01253F] font-avenir break-all whitespace-pre-wrap max-w-full" style={{wordBreak: 'break-word'}}>
                          <p className="font-bold">{selectedJob.company}</p>
                          {selectedJob.location && selectedJob.location.trim() !== '' && selectedJob.location.trim().toLowerCase() !== 'unknown location' && (
                            <p>{selectedJob.location}</p>
                          )}
                          {selectedJob.salary && selectedJob.salary.trim() !== '' && selectedJob.salary.trim().toLowerCase() !== 'salary not specified' && (
                            <p>{selectedJob.salary}</p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={handleApply}
                        className="bg-[#2CB3BF] text-white font-black text-[20px] py-3 px-6 rounded-[12px] hover:bg-[#269aa5] transition-colors shadow-lg font-avenir"
                      >
                        Apply
                      </button>
                    </div>
                    
                    {/* Tags - Display in single row */}
                    <div className="flex flex-wrap gap-3 lg:gap-4">
                      {selectedJob.tags.map((tag) => (
                        <div 
                          key={tag.id} 
                          className={`flex items-center justify-center text-center ${getTagColor(tag.label)} rounded-full px-4 py-2`}
                          style={{ 
                            minWidth: 'fit-content'
                          }}
                        >
                          <span className="text-sm font-bold text-[#01253F] font-avenir whitespace-nowrap truncate">
                            {tag.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blue Divider Line */}
                  <div className="border-t-2 border-[#8AADFC] mx-8"></div>

                  {/* Content - Scrollable */}
                  <div 
                    className="flex-1 p-8 overflow-y-auto overflow-x-hidden" 
                    style={{
                      minHeight: '400px',
                      maxHeight: 'calc(90vh - 250px)',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e0 #f7fafc',
                      maxWidth: '100%',
                      overflowWrap: 'break-word'
                    }}
                  >
                    <div className="pt-6" style={{ maxWidth: '100%', overflowWrap: 'break-word' }}>
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
                      
                      {/* Extra scroll space */}
                      <div className="h-24"></div>
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
        
        /* Ensure 45/55 split on desktop */
        @media (min-width: 720px) {
          .job-details-panel {
            flex: 1 1 55%;
            min-width: 0;
            position: sticky !important;
            top: 2rem !important;
            bottom: 2rem !important;
            align-self: flex-start !important;
            min-height: 600px !important;
            height: min(1000px, 90vh) !important;
            max-height: 90vh !important;
          }
          
          .job-listings {
            flex: 1 1 45%;
            min-width: 0;
          }
        }
        
        /* Responsive adjustments for different screen sizes */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .job-details-panel {
            flex: 1 1 55%;
            position: sticky !important;
            top: 2rem !important;
            bottom: 2rem !important;
            min-height: 600px !important;
            height: min(1000px, 90vh) !important;
            max-height: 90vh !important;
          }
          
          .job-listings {
            flex: 1 1 45%;
          }
        }
        
        @media (min-width: 1280px) and (max-width: 1535px) {
          .job-details-panel {
            flex: 1 1 55%;
            position: sticky !important;
            top: 2rem !important;
            bottom: 2rem !important;
            min-height: 600px !important;
            height: min(1000px, 90vh) !important;
            max-height: 90vh !important;
          }
          
          .job-listings {
            flex: 1 1 45%;
          }
        }
        
        @media (min-width: 1536px) {
          .job-details-panel {
            flex: 1 1 55%;
            position: sticky !important;
            top: 2rem !important;
            bottom: 2rem !important;
            min-height: 600px !important;
            height: min(1000px, 90vh) !important;
            max-height: 90vh !important;
          }
          
          .job-listings {
            flex: 1 1 45%;
          }
        }
      `}</style>
    </div>
  );
} 