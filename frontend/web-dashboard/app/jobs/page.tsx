'use client';

import { useState, useEffect } from 'react';
import JobModal from '../components/JobModal';
import { Job, Tag, TagType } from '../types/job';
import { Search, MapPin, Filter, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { env } from 'process';
import ApplyButton from '../components/ApplyButton';
import JobList from '../components/JobList';

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
        <JobList />
      </div>
    </div>
  );
} 