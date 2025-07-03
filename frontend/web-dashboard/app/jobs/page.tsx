'use client';

import { useState, useEffect } from 'react';
import JobModal from '../components/JobModal';
import { Job, Tag, TagType } from '../types/job';
import { Search, MapPin, Filter, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { env } from 'process';
import ApplyButton from '../components/ApplyButton';

// Load job data from JSON files
const loadJobData = async (): Promise<Job[]> => {
  try {
    const allJobs: Job[] = [];
    
    // Load from enhanced descriptions file
    try {
      const response1 = await fetch('/brightstar_ct_jobs_1000_20250625_002803_enhanced_descriptions.json');
      if (response1.ok) {
        const data1 = await response1.json();
        allJobs.push(...transformJobData(data1));
      }
    } catch (error) {
      console.log('Enhanced descriptions file not available, skipping...');
    }
    
    // Load from regular brightstar file
    try {
      const response2 = await fetch('/brightstar_ct_jobs_1000_20250625_002803.json');
      if (response2.ok) {
        const data2 = await response2.json();
        allJobs.push(...transformJobData(data2));
      }
    } catch (error) {
      console.log('Regular brightstar file not available, skipping...');
    }
    
    // Load from comprehensive healthcare jobs file
    try {
      const response3 = await fetch('/comprehensive_healthcare_jobs_256_20250701_221643_256_20250701_221643.json');
      if (response3.ok) {
        const data3 = await response3.json();
        allJobs.push(...transformJobData(data3));
      }
    } catch (error) {
      console.log('Comprehensive healthcare jobs file not available, skipping...');
    }
    
    // Remove duplicates based on job ID
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.id === job.id)
    );
    
    console.log(`Loaded ${uniqueJobs.length} unique jobs from ${allJobs.length} total entries`);
    return uniqueJobs;
    
  } catch (error) {
    console.error('Error loading job data:', error);
    return [];
  }
};

const transformJobData = (rawJobs: Record<string, unknown>[]): Job[] => {
  return rawJobs.map((job, index) => {
    const title = (job.title as string) || 'Unknown Position';
    const description = (job.description as string) || '';
    const url = (job.url as string) || '';
    
    // Handle both BrightStar format (salary_range) and comprehensive format (salary)
    const salary = (job.salary_range as string) || (job.salary as string) || 'Salary not specified';
    
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
      company: (job.company as string) || 'Unknown Company',
      location: (job.location as string) || 'Unknown Location',
      salary,
      url,
      overview: (job.overview as string) || 'Community Focused. Care Driven.',
      description,
      requirements: (job.requirements as string[] | string) || [],
      tags
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
  const { user, showLoginModal } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 18; // Show 18 jobs per page maximum

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const data = await loadJobData();
      setJobs(data);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  // Filter jobs based on search query, location, and tags
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = locationFilter === '' || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => 
        job.tags.some(jobTag => 
          jobTag.label === tag.label && jobTag.type === tag.type
        )
      );

    return matchesSearch && matchesLocation && matchesTags;
  });

  // Get current jobs for pagination
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Get all unique tags from jobs
  const allTags = Array.from(new Set(jobs.flatMap(job => job.tags)
    .map(tag => JSON.stringify({ label: tag.label, type: tag.type }))))
    .map(str => JSON.parse(str))
    .map(tag => ({ ...tag, id: Date.now() + Math.random() }));

  // Group tags by type
  const tagsByType = allTags.reduce((acc, tag) => {
    if (!acc[tag.type]) acc[tag.type] = [];
    if (!acc[tag.type].some(t => t.label === tag.label)) {
      acc[tag.type].push(tag);
    }
    return acc;
  }, {} as Record<string, Tag[]>);

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev => {
      const exists = prev.some(t => t.label === tag.label && t.type === tag.type);
      if (exists) {
        return prev.filter(t => !(t.label === tag.label && t.type === tag.type));
      } else {
        return [...prev, tag];
      }
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setSelectedTags([]);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen relative bg-[#F4F4F4]">
      {/* Radial blue blur positioned in upper right */}
      <div 
        className="absolute pointer-events-none"
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
        {/* Search and Filter Section */}
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 mb-4 relative">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7691A4]" size={20} />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#2CB3BF] text-[#01253F]"
              />
            </div>

            {/* Location Filter */}
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7691A4]" size={20} />
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#2CB3BF] text-[#01253F]"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E5E5] hover:bg-[#F8F8F8] transition-colors text-[#01253F]"
            >
              <Filter size={20} />
              <span>Filters</span>
              <ChevronDown
                size={20}
                className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Clear Filters Button - Only show if there are active filters */}
            {(searchQuery || locationFilter || selectedTags.length > 0) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F8F8F8] hover:bg-[#E5E5E5] transition-colors text-[#01253F]"
              >
                <X size={20} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Tag Filters */}
          {showFilters && (
            <div className="mt-4 space-y-4">
              {Object.entries(tagsByType).map(([type, tags]) => (
                <div key={type} className="space-y-2">
                  <h3 className="text-[#01253F] font-semibold capitalize">{type}</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedTags.some(t => t.label === tag.label && t.type === tag.type)
                            ? 'bg-[#2CB3BF] text-white'
                            : 'bg-white text-[#01253F] hover:bg-[#F8F8F8]'
                        } transition-colors`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jobs Grid */}
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
              <p className="text-[#7691A4] text-lg">Loading jobs...</p>
            </div>
          ) : currentJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#7691A4] text-lg">No jobs found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2 bg-[#2CB3BF] text-white rounded-lg hover:bg-[#269aa5] transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentJobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-[#01253F] font-bold text-xl mb-2 line-clamp-2">{job.title}</h3>
                    <p className="text-[#7691A4] mb-2">{job.company}</p>
                    <p className="text-[#7691A4] mb-4 flex items-center gap-2">
                      <MapPin size={16} />
                      {job.location}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 bg-[#F8F8F8] text-[#01253F] rounded-full text-sm"
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <p className="text-[#01253F] font-semibold">{job.salary}</p>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {filteredJobs.length > jobsPerPage && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: Math.ceil(filteredJobs.length / jobsPerPage) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => paginate(index + 1)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === index + 1
                          ? 'bg-[#2CB3BF] text-white'
                          : 'bg-white text-[#01253F] hover:bg-[#F8F8F8]'
                      } transition-colors`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Job Modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          applyButton={<ApplyButton jobId={selectedJob.id} jobUrl={selectedJob.url} />}
        />
      )}
    </div>
  );
} 