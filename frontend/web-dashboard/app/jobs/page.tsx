'use client';

import { useState, useEffect, useRef } from 'react';
import JobModal from '../components/JobModal';
import { Job, Tag, TagType } from '../types/job';
import { Search, MapPin, Filter, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { env } from 'process';

// Load job data from multiple enhanced JSON files
const loadJobData = async (shouldShuffle: boolean = true): Promise<Job[]> => {
  try {
    const allJobs: Record<string, unknown>[] = [];
    
    // List of all enhanced JSON files to load
    const jsonFiles = [
      '/live_data.json',
      '/all_ct_jobs_20250721_232811.json',
      '/fixed_apploi_jobs.json',
      '/site_Athena_Health_Care_Systems_20250716_221638_enhanced.json',
      '/site_National_Healthcare_Associates_20250716_204858_enhanced.json',
      '/site_Genesis_20250716_222027_enhanced.json',
      '/site_iCare_Health_Network_20250716_204824_enhanced.json',
      '/site_RydersHealth_20250716_181012_enhanced.json'
    ];
    
    // Load data from each file
    for (const file of jsonFiles) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          const jobs = await response.json();
          if (Array.isArray(jobs)) {
            allJobs.push(...jobs);
            console.log(`Loaded ${jobs.length} jobs from ${file}`);
          }
        }
      } catch (error) {
        console.warn(`Failed to load ${file}:`, error);
      }
    }
    
    console.log(`Total jobs loaded: ${allJobs.length}`);
    
    // Transform the raw job data to generate tags and clean up the data
    const transformedJobs = transformJobData(allJobs, shouldShuffle);
    console.log(`Total jobs after transformation: ${transformedJobs.length}`);
    
    return transformedJobs;
  } catch (error) {
    console.error('Error loading job data:', error);
    return [];
  }
};

// Utility to clean and truncate long content for job cards
const cleanJobCardContent = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  
  // Remove common unwanted patterns that shouldn't be in job cards
  let cleaned = text
    .replace(/Your web browser.*?update your browser/gi, '') // Remove browser warnings
    .replace(/Chrome \d+.*?vulnerability/gi, '') // Remove security warnings
    .replace(/Please take a minute.*?browser/gi, '') // Remove update prompts
    .replace(/Update browser/gi, '') // Remove update browser text
    .replace(/\b(?:Click here|Apply now|Learn more|Read more)\b/gi, '') // Remove action prompts
    .replace(/\b(?:www\.|https?:\/\/)\S+/gi, '') // Remove URLs
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '') // Remove email addresses
    .replace(/By checking this box.*?Privacy Policy/gi, '') // Remove terms and conditions
    .replace(/Continue/gi, '') // Remove continue text
    .replace(/Job Type\s*:\s*[A-Za-z\s-]+/gi, '') // Remove job type labels
    .replace(/DESCRIPTION/gi, '') // Remove description headers
    .replace(/POSITION SUMMARY/gi, '') // Remove position summary headers
    .replace(/POSITION REQUIREMENTS/gi, '') // Remove requirements headers
    .replace(/Working Conditions/gi, '') // Remove working conditions headers
    .replace(/Physical Requirements/gi, '') // Remove physical requirements headers
    .replace(/Behavioral Competencies/gi, '') // Remove behavioral competencies headers
    .replace(/\$[\d,]+ sign-on bonus.*?(?=\s|$)/gi, '') // Remove sign-on bonus text
    .replace(/Registered Nurse licensed.*?(?=\s|$)/gi, '') // Remove license requirements
    .replace(/Minimum of.*?(?=\s|$)/gi, '') // Remove minimum requirements
    .replace(/CPR certified.*?(?=\s|$)/gi, '') // Remove CPR requirements
    .replace(/Ability to.*?(?=\s|$)/gi, '') // Remove ability requirements
    .replace(/Works in.*?(?=\s|$)/gi, '') // Remove working conditions
    .replace(/Physical.*?(?=\s|$)/gi, '') // Remove physical requirements
    .replace(/Accountability.*?(?=\s|$)/gi, '') // Remove accountability text
    // More aggressive cleaning for long-form content
    .replace(/We are hiring.*?team/gi, '') // Remove hiring announcements
    .replace(/Working with our team.*?life/gi, '') // Remove team descriptions
    .replace(/Here at.*?company/gi, '') // Remove company descriptions
    .replace(/As a.*?resident/gi, '') // Remove job role descriptions
    .replace(/Experience & Education.*?required/gi, '') // Remove experience sections
    .replace(/Duties & Responsibilities.*?team/gi, '') // Remove duties sections
    .replace(/Specific Requirements.*?public/gi, '') // Remove requirements sections
    .replace(/About.*?England/gi, '') // Remove about sections
    .replace(/Athena's Benefits.*?apply/gi, '') // Remove benefits sections
    .replace(/We are an equal.*?law/gi, '') // Remove EEO statements
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // If still too long, truncate with ellipsis
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength - 3) + '...';
  }
  
  return cleaned;
};

// Utility to extract city, state from a full address
const extractCityState = (location: string): { cityState: string | null; stateOnly: string | null } => {
  if (!location || typeof location !== 'string') return { cityState: null, stateOnly: null };
  
  // State name to code mapping
  const stateNameToCode: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
  };
  
  // Clean the location string - remove common unwanted patterns
  let cleanLocation = location
    .replace(/\d{5}(-\d{4})?/g, '') // Remove ZIP codes
    .replace(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Way|Terrace|Ter)/gi, '') // Remove street addresses
    .replace(/\b(?:United States|USA|US)\b/gi, '') // Remove country names
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/^\s*,\s*|\s*,\s*$/g, '') // Remove leading/trailing commas
    .trim();
  
  // Try to match: ... City, ST ...
  const cityStateMatch = cleanLocation.match(/([A-Za-z .'-]+),\s*([A-Z]{2})(?:\s|,|$)/);
  if (cityStateMatch) {
    return { 
      cityState: `${cityStateMatch[1].trim()}, ${cityStateMatch[2].trim()}`,
      stateOnly: null
    };
  }
  
  // Try to match: ... City, State ...
  const cityFullStateMatch = cleanLocation.match(/([A-Za-z .'-]+),\s*([A-Za-z\s]+)(?:\s|,|$)/);
  if (cityFullStateMatch) {
    const city = cityFullStateMatch[1].trim();
    const fullState = cityFullStateMatch[2].trim();
    const stateCode = stateNameToCode[fullState.toLowerCase()];
    if (stateCode) {
      return { 
        cityState: `${city}, ${stateCode}`,
        stateOnly: null
      };
    }
  }
  
  // Try to extract just state if no city, state pattern found
  const stateMatch = cleanLocation.match(/\b([A-Z]{2})\b/);
  if (stateMatch) {
    return { cityState: null, stateOnly: stateMatch[1] };
  }
  
  // Try to match full state names and convert to codes
  const locationLower = cleanLocation.toLowerCase().trim();
  for (const [stateName, stateCode] of Object.entries(stateNameToCode)) {
    if (locationLower === stateName || locationLower.includes(stateName)) {
      return { cityState: null, stateOnly: stateCode };
    }
  }
  
  // If we have a long location string, try to extract just the last part as city
  if (cleanLocation.length > 30) {
    const parts = cleanLocation.split(',').map(part => part.trim()).filter(part => part.length > 0);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const secondLastPart = parts[parts.length - 2];
      
      // Check if last part is a state code
      if (/^[A-Z]{2}$/i.test(lastPart)) {
        return { cityState: `${secondLastPart}, ${lastPart.toUpperCase()}`, stateOnly: null };
      }
      
      // Check if last part is a full state name
      const stateCode = stateNameToCode[lastPart.toLowerCase()];
      if (stateCode) {
        return { cityState: `${secondLastPart}, ${stateCode}`, stateOnly: null };
      }
    }
  }
  
  return { cityState: null, stateOnly: null };
};

// Utility to check if a string is a monetary value
const isMonetary = (value: string): boolean => {
  if (!value) return false;
  // Match $12,000, $12/hr, 12000 USD, etc.
  return /\$\s?\d|\d+\s?(USD|usd|dollars|per\s?hour|\/hr|hourly|annually|per\s?year)/.test(value);
};

// Utility to check if text contains sign-on bonus or other non-salary monetary values
const isSignOnBonus = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return lowerText.includes('sign-on bonus') || 
         lowerText.includes('sign on bonus') || 
         lowerText.includes('signing bonus') ||
         lowerText.includes('bonus') ||
         lowerText.includes('incentive') ||
         lowerText.includes('referral bonus') ||
         lowerText.includes('retention bonus');
};

// Utility to extract and validate salary from text
const extractValidSalary = (text: string): string | null => {
  if (!text) return null;
  
  const textLower = text.toLowerCase();
  
  // Skip if it's a sign-on bonus or other non-salary monetary value
  if (isSignOnBonus(text)) {
    return null;
  }
  
  // Look for clear hourly indicators
  const hourlyPatterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+hour|\/hour|\/hr|hourly)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+hour|\/hour|\/hr|hourly)/i
  ];
  
  for (const pattern of hourlyPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numValue = parseInt(match[1].replace(/,/g, ''));
      return `$${numValue} per hour`;
    }
  }
  
  // Look for clear annual indicators
  const annualPatterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+year|annually|annual)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+year|annually|annual)/i
  ];
  
  for (const pattern of annualPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numValue = parseInt(match[1].replace(/,/g, ''));
      return `$${numValue} per year`;
    }
  }
  
  // Look for per diem indicators
  const perDiemPatterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+diem)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+diem)/i
  ];
  
  for (const pattern of perDiemPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numValue = parseInt(match[1].replace(/,/g, ''));
      return `$${numValue} per diem`;
    }
  }
  
  // Handle malformed entries like "$025 - $07" and fix them
  const malformedMatch = text.match(/\$(\d{3})-\$(\d{2})/);
  if (malformedMatch) {
    const firstNum = parseInt(malformedMatch[1]);
    const secondNum = parseInt(malformedMatch[2]);
    return `$${firstNum}-${secondNum} per hour`;
  }
  
  return null;
};

// Utility to format salary with proper units
const formatSalary = (salary: string): string => {
  if (!salary) return '';
  
  // Filter out malformed salary entries that look like dates (e.g., "$05-$07")
  if (salary.match(/\$\d{2}-\$\d{2}/) || salary.match(/\$\d{2}\/\$\d{2}/)) {
    return '';
  }
  
  // Skip if it's a sign-on bonus
  if (isSignOnBonus(salary)) {
    return '';
  }
  
  const salaryLower = salary.toLowerCase();
  
  // Handle malformed salary entries like "$025 - $07" by fixing the format
  if (salary.match(/\$\d{3}-\$\d{2}/)) {
    const match = salary.match(/\$(\d{3})-\$(\d{2})/);
    if (match) {
      const firstNum = parseInt(match[1]).toString();
      const secondNum = parseInt(match[2]).toString();
      return `$${firstNum}-${secondNum} per hour`;
    }
  }
  
  // Check for hourly rates (including /hour format from data)
  if (salaryLower.includes('/hr') || salaryLower.includes('/hour') || salaryLower.includes('per hour') || salaryLower.includes('hourly')) {
    // Extract the number and format as hourly
    const match = salary.match(/\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (match) {
      // Remove leading zeros and format properly
      const numValue = parseInt(match[1].replace(/,/g, ''));
      return `$${numValue} per hour`;
    }
  }
  
  // Check for annual salaries
  if (salaryLower.includes('per year') || salaryLower.includes('annually') || salaryLower.includes('annual')) {
    // Extract the number and format as annual
    const match = salary.match(/\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (match) {
      const numValue = parseInt(match[1].replace(/,/g, ''));
      return `$${numValue} per year`;
    }
  }
  
  // Check for per diem rates
  if (salaryLower.includes('per diem')) {
    const match = salary.match(/\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (match) {
      const numValue = parseInt(match[1].replace(/,/g, ''));
      return `$${numValue} per diem`;
    }
  }
  
  // If it's just a number with $, be more conservative - only show if we're confident
  const simpleMatch = salary.match(/\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  if (simpleMatch && !salaryLower.includes('/')) {
    const numValue = parseInt(simpleMatch[1].replace(/,/g, ''));
    // Only show if it's clearly a reasonable salary range
    if (numValue >= 10 && numValue <= 200) {
      return `$${numValue} per hour`;
    }
  }
  
  // Return empty if no clear pattern matches
  return '';
};

// Utility to extract salary from description
const extractSalaryFromDescription = (desc: string): string | null => {
  if (!desc) return null;
  
  // First try to extract valid salary using the new function
  const validSalary = extractValidSalary(desc);
  if (validSalary) {
    return validSalary;
  }
  
  // Fallback to old pattern if no clear indicators found
  const match = desc.match(/\$\s?\d{2,3}(,\d{3})*(\.\d{2})?(\s?(per|\/)?\s?(hour|hr|year|annum|week|month))?/i);
  if (match) {
    // Only return if it's not a sign-on bonus
    if (!isSignOnBonus(match[0])) {
      return match[0];
    }
  }
  return null;
};

// Utility to clean salary field - only keep monetary values
const cleanSalaryField = (salary: string): { cleanSalary: string; movedToDescription: string } => {
  if (!salary) return { cleanSalary: '', movedToDescription: '' };
  
  // Check if it's a monetary value
  if (isMonetary(salary)) {
    return { cleanSalary: salary, movedToDescription: '' };
  }
  
  // If it's not monetary, it might be a description that should be moved
  // Check if it's a long description (more than 50 characters)
  if (salary.length > 50) {
    return { cleanSalary: '', movedToDescription: salary };
  }
  
  // For short non-monetary values, just clear the salary field
  return { cleanSalary: '', movedToDescription: '' };
};

// Utility to truncate long titles
const truncateTitle = (title: string, maxLength: number = 80): string => {
  if (!title || title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
};

const extractRequirementsFromDescription = (desc: string): string[] => {
  if (!desc) return [];
  
  const requirements: string[] = [];
  const descLower = desc.toLowerCase();
  
  // Common requirement section headers
  const requirementHeaders = [
    /requirements?:/i,
    /qualifications?:/i,
    /requirements & qualifications?:/i,
    /minimum requirements?:/i,
    /required qualifications?:/i,
    /education & experience?:/i,
    /education and experience?:/i,
    /licenses & certifications?:/i,
    /licenses and certifications?:/i,
    /skills required?:/i,
    /required skills?:/i,
    /experience required?:/i,
    /required experience?:/i
  ];
  
  // Find requirement sections
  for (const header of requirementHeaders) {
    const match = desc.match(header);
    if (match) {
      const startIndex = match.index! + match[0].length;
      const remainingText = desc.substring(startIndex);
      
      // Extract content until next major section or end
      const nextSectionMatch = remainingText.match(/\n\s*(?:benefits|responsibilities|duties|overview|about|compensation|salary|schedule|shift|location|contact|apply|application)/i);
      const endIndex = nextSectionMatch ? nextSectionMatch.index! : remainingText.length;
      const requirementSection = remainingText.substring(0, endIndex).trim();
      
      if (requirementSection) {
        // Split by common delimiters and clean up
        const items = requirementSection
          .split(/[•\n\r]/)
          .map(item => item.trim())
          .filter(item => item.length > 10 && item.length < 500) // Filter out too short or too long items
          .filter(item => !item.toLowerCase().includes('apply now') && !item.toLowerCase().includes('click here'));
        
        requirements.push(...items);
      }
    }
  }
  
  // If no structured requirements found, look for bullet points or numbered lists
  if (requirements.length === 0) {
    const bulletMatches = desc.match(/[•·]\s*([^•·\n]+)/g);
    if (bulletMatches) {
      const items = bulletMatches
        .map(item => item.replace(/^[•·]\s*/, '').trim())
        .filter(item => item.length > 10 && item.length < 500)
        .filter(item => {
          const itemLower = item.toLowerCase();
          return !itemLower.includes('apply now') && 
                 !itemLower.includes('click here') &&
                 !itemLower.includes('contact us') &&
                 (itemLower.includes('experience') || 
                  itemLower.includes('education') || 
                  itemLower.includes('license') || 
                  itemLower.includes('certification') ||
                  itemLower.includes('degree') ||
                  itemLower.includes('required') ||
                  itemLower.includes('must') ||
                  itemLower.includes('should'));
        });
      requirements.push(...items);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(requirements)].slice(0, 10); // Limit to 10 requirements max
};

const transformJobData = (rawJobs: Record<string, unknown>[], shouldShuffle: boolean = true): Job[] => {
  const transformedJobs = rawJobs
    .map((job, index) => {
      const title = (job.title as string) || 'Unknown Position';
      const description = (job.description as string) || '';
      const url = (job.url as string) || '';
      const company = (job.company as string) || '';
      let location = (job.location as string) || '';
      // Extract city, state from location
      const { cityState, stateOnly } = extractCityState(location);
      location = cityState || stateOnly || '';
      // If not parseable, hide location
      if (!cityState && !stateOnly) location = '';
      // Enhanced salary logic - check both title and description
      let salary = (job.salary_range as string) || (job.salary as string) || '';
      
      // First try to extract valid salary from title
      if (!salary || isSignOnBonus(salary)) {
        const titleSalary = extractValidSalary(title);
        if (titleSalary) {
          salary = titleSalary;
        }
      }
      
      // If no valid salary from title, try description
      if (!salary || isSignOnBonus(salary)) {
        const descSalary = extractValidSalary(description);
        if (descSalary) {
          salary = descSalary;
        }
      }
      
      // If still no valid salary, try the old extraction method as fallback
      if (!salary || isSignOnBonus(salary)) {
        const extracted = extractSalaryFromDescription(description);
        if (extracted && !isSignOnBonus(extracted)) {
          salary = extracted;
        }
      }
      
      // Format the salary with proper units
      salary = formatSalary(salary);
      
      // Clean salary field and move non-salary content to description
      const { cleanSalary, movedToDescription } = cleanSalaryField(salary);
      salary = cleanSalary;

      // Truncate title if it's too long
      const truncatedTitle = truncateTitle(title);

      // Use existing tags if available (comprehensive format), otherwise generate them (BrightStar format)
      let tags: Tag[];
      if (job.tags && Array.isArray(job.tags)) {
        tags = (job.tags as any[]).map(tag => ({
          id: tag.id || Date.now() + Math.random(),
          label: tag.label,
          type: tag.type as TagType
        }));
      } else {
        tags = generateTags(truncatedTitle, description, job.category as string, company);
      }
      
      // Extract requirements from description if not already present
      let requirements = (job.requirements as string[] | string) || [];
      if (!requirements || (Array.isArray(requirements) && requirements.length === 0)) {
        const extractedRequirements = extractRequirementsFromDescription(description);
        if (extractedRequirements.length > 0) {
          requirements = extractedRequirements;
        }
      }
      
      return {
        id: (job.id as string) || `job_${index + 1}`,
        title: truncatedTitle,
        company: cleanJobCardContent(company, 50),
        location: cleanJobCardContent(location, 30),
        salary: cleanJobCardContent(salary, 20),
        url,
        overview: cleanJobCardContent((job.overview as string) || 'Community Focused. Care Driven.', 50),
        description: description + (movedToDescription ? `\n\n${movedToDescription}` : ''), // Append moved description to description
        requirements,
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

  // Shuffle the jobs randomly for better distribution (only if no filters are applied)
  if (shouldShuffle) {
    const shuffledJobs = [...transformedJobs];
    for (let i = shuffledJobs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledJobs[i], shuffledJobs[j]] = [shuffledJobs[j], shuffledJobs[i]];
    }
    return shuffledJobs;
  }
  
  return transformedJobs;
};

// Generate tags for a job based on title, description, and category
const generateTags = (title: string, description: string, category?: string, company?: string): Tag[] => {
  const tags: Tag[] = [];
  
  // Job Setting tag (Purple)
  const jobSetting = getJobSetting(title, description, company);
  tags.push({ id: Date.now() + 1, label: jobSetting, type: 'job_setting' });
  
  // Employment Type tag (Blue)
  const employmentType = getEmploymentType(title, description);
  tags.push({ id: Date.now() + 2, label: employmentType, type: 'employment_type' });
  
  // Shift tag (Pink)
  const shift = getShift(title, description);
  tags.push({ id: Date.now() + 3, label: shift, type: 'shift' });
  
  return tags;
};

const getJobSetting = (title: string, description: string, company?: string): string => {
  const text = (title + ' ' + description).toLowerCase();
  const companyText = (company || '').toLowerCase();
  
  // Check for nursing home indicators in company name first
  const nursingHomeCompanyPatterns = [
    'rehabilitation and healthcare center',
    'rehabilitation & healthcare center',
    'rehabilitation center',
    'healthcare center',
    'nursing home',
    'skilled nursing',
    'skilled nursing facility',
    'long term care',
    'ltc',
    'convalescent home',
    'care center',
    'health center',
    'medical center',
    'rehab center',
    'rehabilitation facility',
    'healthcare facility',
    'nursing facility',
    'care facility'
  ];
  
  for (const pattern of nursingHomeCompanyPatterns) {
    if (companyText.includes(pattern)) {
      return 'Nursing Home';
    }
  }
  
  // Check for nursing home indicators in title and description
  if (text.includes('nursing home') || text.includes('skilled nursing') || text.includes('ltc') || 
      text.includes('long term care') || text.includes('convalescent') || text.includes('rehabilitation')) {
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
  
  // Helper function to check text for patterns
  const checkTextForPatterns = (text: string) => {
    // First check for specific time patterns and return the exact time range
    const specificTimePatterns = [
      // 12-hour shift patterns (common in healthcare)
      { pattern: /7\s*(?:am|a)?\s*[-to]\s*7\s*(?:pm|p)?/i, shift: '7AM-7PM' },
      { pattern: /7\s*(?:pm|p)?\s*[-to]\s*7\s*(?:am|a)?/i, shift: '7PM-7AM' },
      { pattern: /6\s*(?:am|a)?\s*[-to]\s*6\s*(?:pm|p)?/i, shift: '6AM-6PM' },
      { pattern: /6\s*(?:pm|p)?\s*[-to]\s*6\s*(?:am|a)?/i, shift: '6PM-6AM' },
      { pattern: /8\s*(?:am|a)?\s*[-to]\s*8\s*(?:pm|p)?/i, shift: '8AM-8PM' },
      { pattern: /8\s*(?:pm|p)?\s*[-to]\s*8\s*(?:am|a)?/i, shift: '8PM-8AM' },
      
      // 8-hour shift patterns (standard healthcare shifts)
      { pattern: /7\s*(?:am|a)?\s*[-to]\s*3\s*(?:pm|p)?/i, shift: '7AM-3PM' },
      { pattern: /3\s*(?:pm|p)?\s*[-to]\s*11\s*(?:pm|p)?/i, shift: '3PM-11PM' },
      { pattern: /11\s*(?:pm|p)?\s*[-to]\s*7\s*(?:am|a)?/i, shift: '11PM-7AM' },
      { pattern: /6\s*(?:am|a)?\s*[-to]\s*2\s*(?:pm|p)?/i, shift: '6AM-2PM' },
      { pattern: /2\s*(?:pm|p)?\s*[-to]\s*10\s*(?:pm|p)?/i, shift: '2PM-10PM' },
      { pattern: /10\s*(?:pm|p)?\s*[-to]\s*6\s*(?:am|a)?/i, shift: '10PM-6AM' },
      { pattern: /8\s*(?:am|a)?\s*[-to]\s*4\s*(?:pm|p)?/i, shift: '8AM-4PM' },
      { pattern: /4\s*(?:pm|p)?\s*[-to]\s*12\s*(?:am|a|midnight)?/i, shift: '4PM-12AM' },
      { pattern: /12\s*(?:am|a|midnight)?\s*[-to]\s*8\s*(?:am|a)?/i, shift: '12AM-8AM' },
      { pattern: /9\s*(?:am|a)?\s*[-to]\s*5\s*(?:pm|p)?/i, shift: '9AM-5PM' },
      { pattern: /5\s*(?:pm|p)?\s*[-to]\s*1\s*(?:am|a)?/i, shift: '5PM-1AM' },
      { pattern: /1\s*(?:am|a)?\s*[-to]\s*9\s*(?:am|a)?/i, shift: '1AM-9AM' },
      
      // More flexible patterns for common ranges with liberal time formats
      { pattern: /(7|8)\s*(?:am|a)?\s*[-to]\s*(3|4)\s*(?:pm|p)?/i, shift: '7AM-3PM' },
      { pattern: /(3|4)\s*(?:pm|p)?\s*[-to]\s*(11|12)\s*(?:pm|p|am|a)?/i, shift: '3PM-11PM' },
      { pattern: /(11|12)\s*(?:pm|p|am|a)?\s*[-to]\s*(7|8)\s*(?:am|a)?/i, shift: '11PM-7AM' },
      
      // Very liberal patterns for common healthcare shifts
      { pattern: /(7|8)\s*[-to]\s*(3|4)/i, shift: '7AM-3PM' },
      { pattern: /(3|4)\s*[-to]\s*(11|12)/i, shift: '3PM-11PM' },
      { pattern: /(11|12)\s*[-to]\s*(7|8)/i, shift: '11PM-7AM' },
    ];
    
    for (const { pattern, shift } of specificTimePatterns) {
      if (pattern.test(text)) {
        return shift;
      }
    }
    
    // Check for explicit shift duration keywords (only if no specific time pattern was found)
    if (text.includes('12 hour shift') || text.includes('12-hour shift') || text.includes('12 hr shift')) {
      return '12-Hour Shift';
    } else if (text.includes('8 hour shift') || text.includes('8-hour shift') || text.includes('8 hr shift')) {
      return '8-Hour Shift';
    } else if (text.includes('10 hour shift') || text.includes('10-hour shift') || text.includes('10 hr shift')) {
      return '10-Hour Shift';
    } else if (text.includes('16 hour shift') || text.includes('16-hour shift') || text.includes('16 hr shift')) {
      return '16-Hour Shift';
    }
    
    // Check for explicit shift keywords
    if (text.includes('overnight shift') || text.includes('night shift') || text.includes('graveyard shift')) {
      return 'Overnight';
    } else if (text.includes('morning shift') || text.includes('early morning')) {
      return 'Morning';
    } else if (text.includes('afternoon shift') || text.includes('midday')) {
      return 'Afternoon';
    } else if (text.includes('evening shift') || text.includes('late afternoon')) {
      return 'Evening';
    } else if (text.includes('night') || text.includes('overnight')) {
      return 'Night';
    } else if (text.includes('day shift') || text.includes('daytime')) {
      return 'Morning';
    }
    
    // Check for other time patterns and categorize by time
    const timePatterns = [
      // 12-hour shift patterns (more flexible)
      { pattern: /(6|7|8)\s*(?:am|a)?\s*[-to]\s*(6|7|8)\s*(?:pm|p)?/i, shift: '12-Hour Day' },
      { pattern: /(6|7|8)\s*(?:pm|p)?\s*[-to]\s*(6|7|8)\s*(?:am|a)?/i, shift: '12-Hour Night' },
      
      // Overnight patterns (10pm-6am, 11pm-7am, 12am-8am, etc.)
      { pattern: /(10|11|12)\s*(?:pm|p|am|a)?\s*[-to]\s*(6|7|8)\s*(?:am|a)?/i, shift: 'Overnight' },
      { pattern: /(12|1|2|3|4|5)\s*(?:am|a)?\s*[-to]\s*(6|7|8|9|10)\s*(?:am|a)?/i, shift: 'Overnight' },
      
      // Morning patterns (5am-1pm, 6am-2pm, 7am-3pm, 8am-4pm, etc.)
      { pattern: /(5|6|7|8)\s*(?:am|a)?\s*[-to]\s*(1|2|3|4)\s*(?:pm|p)?/i, shift: 'Morning' },
      { pattern: /(5|6|7|8)\s*(?:am|a)?\s*[-to]\s*(12|1|2|3|4)\s*(?:pm|p)?/i, shift: 'Morning' },
      
      // Afternoon patterns (12pm-8pm, 1pm-9pm, 2pm-10pm, etc.)
      { pattern: /(12|1|2)\s*(?:pm|p)?\s*[-to]\s*(8|9|10)\s*(?:pm|p)?/i, shift: 'Afternoon' },
      
      // Evening patterns (3pm-11pm, 4pm-12am, 5pm-1am, etc.)
      { pattern: /(3|4|5)\s*(?:pm|p)?\s*[-to]\s*(11|12)\s*(?:pm|p|am|a)?/i, shift: 'Evening' },
      { pattern: /(3|4|5)\s*(?:pm|p)?\s*[-to]\s*(1|2)\s*(?:am|a)?/i, shift: 'Evening' },
    ];
    
    for (const { pattern, shift } of timePatterns) {
      if (pattern.test(text)) {
        return shift;
      }
    }
    
    // Check for short shifts (3-4 hours) and categorize by time
    const shortShiftPatterns = [
      { pattern: /(5|6|7|8|9)\s*(?:am|a)?\s*[-to]\s*(8|9|10|11)\s*(?:am|a)?/i, shift: 'Morning' },
      { pattern: /(10|11|12)\s*(?:am|a)?\s*[-to]\s*(1|2|3)\s*(?:pm|p)?/i, shift: 'Morning' },
      { pattern: /(12|1|2)\s*(?:pm|p)?\s*[-to]\s*(4|5|6)\s*(?:pm|p)?/i, shift: 'Afternoon' },
      { pattern: /(3|4|5)\s*(?:pm|p)?\s*[-to]\s*(7|8|9)\s*(?:pm|p)?/i, shift: 'Afternoon' },
      { pattern: /(6|7|8)\s*(?:pm|p)?\s*[-to]\s*(10|11|12)\s*(?:pm|p|am|a)?/i, shift: 'Evening' },
      { pattern: /(9|10|11)\s*(?:pm|p)?\s*[-to]\s*(12|1|2)\s*(?:am|a)?/i, shift: 'Night' },
    ];
    
    for (const { pattern, shift } of shortShiftPatterns) {
      if (pattern.test(text)) {
        return shift;
      }
    }
    
    return null;
  };
  
  // Check description first as it often contains more detailed shift information
  let result = checkTextForPatterns(descText);
  if (result) return result;
  
  // Check title if description didn't yield results
  result = checkTextForPatterns(titleText);
  if (result) return result;
  
  // Check combined text as fallback
  result = checkTextForPatterns(combinedText);
  if (result) return result;
  
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
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasUserAppliedFilters, setHasUserAppliedFilters] = useState(false);
  const { user, showLoginModal, refreshUser } = useAuth();
  const jobDetailsRef = useRef<HTMLDivElement>(null);

  // Handle Google OAuth token from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    if (token && email) {
      // Store email for display purposes only
      localStorage.setItem('user_email', email);
      
      // Clear the URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Refresh the auth context - backend handles authentication via cookies
      refreshUser();
    }
  }, [refreshUser]);

  const jobsPerPage = 18; // Show 18 jobs per page maximum

  // Load job data
  useEffect(() => {
    const initializeJobs = async () => {
      try {
        // Only shuffle if no filters are applied
        const shouldShuffle = !hasUserAppliedFilters;
        const jobData = await loadJobData(shouldShuffle);
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
  }, [hasUserAppliedFilters]);

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
    job_settings: Array.from(new Set(jobs.flatMap(job => (job.tags || []).filter(tag => tag.type === 'job_setting').map(tag => tag.label)))),
    employment_types: Array.from(new Set(jobs.flatMap(job => (job.tags || []).filter(tag => tag.type === 'employment_type').map(tag => tag.label)))),
    shifts: ['Morning', 'Afternoon', 'Evening', 'Night', 'Overnight'] // Only show basic shift names
  };

  // Available locations - dynamically generated from loaded data
  const allLocations = Array.from(new Set(jobs.map(job => job.location))).sort();

  // Location suggestions based on input (show after 2 characters)
  const locationSuggestions = locationInput.length >= 2 
    ? allLocations.filter(location => 
        location.toLowerCase().includes(locationInput.toLowerCase()) && 
        location.toLowerCase() !== locationInput.toLowerCase()
      ).slice(0, 5) // Limit to 5 suggestions
    : [];

  // Filter jobs based on search, location, and active filters
  useEffect(() => {
    const filtered = jobs.filter(job => {
      // Enhanced search functionality with role-specific matching
      const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      
      let matchesSearch = searchTerm === '';
      
      if (searchTerm !== '' && searchTerms.length > 0) {
        // Define healthcare role categories and their variations
        const roleCategories: Record<string, {
          primary: string[];
          exclude: string[];
          titlePatterns: RegExp[];
        }> = {
          'nurse': {
            primary: ['nurse', 'nursing', 'rn', 'lpn', 'lvn', 'registered nurse', 'licensed practical nurse', 'licensed vocational nurse', 'staff nurse', 'travel nurse', 'charge nurse', 'icu nurse', 'er nurse', 'or nurse', 'pediatric nurse', 'psychiatric nurse'],
            exclude: ['cna', 'certified nursing assistant', 'nursing assistant', 'caregiver', 'home health aide', 'hha', 'pca', 'patient care assistant'],
            titlePatterns: [/nurse/i, /rn\b/i, /lpn\b/i, /lvn\b/i, /registered nurse/i, /licensed practical nurse/i, /licensed vocational nurse/i, /staff nurse/i, /travel nurse/i, /charge nurse/i, /icu nurse/i, /er nurse/i, /or nurse/i, /pediatric nurse/i, /psychiatric nurse/i]
          },
          'cna': {
            primary: ['cna', 'certified nursing assistant', 'nursing assistant', 'caregiver', 'home health aide', 'hha', 'home care aide', 'hca', 'patient care assistant', 'pca', 'personal care aide', 'nursing aide', 'hospital aide', 'patient care technician', 'pct'],
            exclude: ['rn', 'lpn', 'lvn', 'registered nurse', 'licensed practical nurse', 'licensed vocational nurse', 'nurse'],
            titlePatterns: [/cna\b/i, /certified nursing assistant/i, /nursing assistant/i, /caregiver/i, /home health aide/i, /hha\b/i, /home care aide/i, /hca\b/i, /patient care assistant/i, /pca\b/i, /personal care aide/i, /nursing aide/i, /hospital aide/i, /patient care technician/i, /pct\b/i]
          },
          'therapist': {
            primary: ['therapist', 'therapy', 'pt', 'ot', 'st', 'rt', 'physical therapist', 'occupational therapist', 'speech therapist', 'respiratory therapist', 'speech language pathologist', 'slp', 'physical therapy assistant', 'pta', 'occupational therapy assistant', 'ota', 'recreational therapist', 'massage therapist', 'mt'],
            exclude: ['nurse', 'cna', 'caregiver', 'assistant'],
            titlePatterns: [/therapist/i, /pt\b/i, /ot\b/i, /st\b/i, /rt\b/i, /physical therapist/i, /occupational therapist/i, /speech therapist/i, /respiratory therapist/i, /speech language pathologist/i, /slp\b/i, /physical therapy assistant/i, /pta\b/i, /occupational therapy assistant/i, /ota\b/i, /recreational therapist/i, /massage therapist/i, /mt\b/i]
          },
          'aide': {
            primary: ['aide', 'assistant', 'hha', 'home health aide', 'personal care aide', 'pca', 'patient care assistant', 'medical assistant', 'ma', 'certified medical assistant', 'cma', 'clinical assistant', 'ca'],
            exclude: ['nurse', 'rn', 'lpn', 'lvn', 'therapist', 'pt', 'ot', 'st', 'rt'],
            titlePatterns: [/aide/i, /assistant/i, /hha\b/i, /home health aide/i, /personal care aide/i, /pca\b/i, /patient care assistant/i, /medical assistant/i, /ma\b/i, /certified medical assistant/i, /cma\b/i, /clinical assistant/i, /ca\b/i]
          },
          'manager': {
            primary: ['manager', 'supervisor', 'director', 'coordinator', 'lead', 'charge nurse', 'lead nurse', 'clinical manager', 'unit manager', 'department head', 'assistant director', 'nurse manager', 'director of nursing', 'don'],
            exclude: ['cna', 'aide', 'assistant'],
            titlePatterns: [/manager/i, /supervisor/i, /director/i, /coordinator/i, /lead/i, /charge nurse/i, /lead nurse/i, /clinical manager/i, /unit manager/i, /department head/i, /assistant director/i, /nurse manager/i, /director of nursing/i, /don\b/i]
          },
          'specialist': {
            primary: ['specialist', 'wound care nurse', 'infection control nurse', 'icn', 'quality assurance nurse', 'qa nurse', 'case manager', 'utilization review nurse', 'ur nurse', 'mds coordinator', 'mds', 'restorative nurse', 'staff development coordinator', 'sdc'],
            exclude: ['cna', 'aide', 'assistant'],
            titlePatterns: [/specialist/i, /wound care nurse/i, /infection control nurse/i, /icn\b/i, /quality assurance nurse/i, /qa nurse/i, /case manager/i, /utilization review nurse/i, /ur nurse/i, /mds coordinator/i, /mds\b/i, /restorative nurse/i, /staff development coordinator/i, /sdc\b/i]
          },
          'technician': {
            primary: ['technician', 'tech', 'phlebotomist', 'lab technician', 'lab tech', 'x-ray technician', 'x-ray tech', 'radiology technician', 'rad tech', 'ekg technician', 'ekg tech', 'ecg technician', 'ecg tech', 'ultrasound technician', 'sonographer', 'surgical technician', 'surg tech', 'sterile processing technician', 'spt'],
            exclude: ['nurse', 'cna', 'caregiver'],
            titlePatterns: [/technician/i, /tech\b/i, /phlebotomist/i, /lab technician/i, /lab tech/i, /x-ray technician/i, /x-ray tech/i, /radiology technician/i, /rad tech/i, /ekg technician/i, /ekg tech/i, /ecg technician/i, /ecg tech/i, /ultrasound technician/i, /sonographer/i, /surgical technician/i, /surg tech/i, /sterile processing technician/i, /spt\b/i]
          },
          'dietary': {
            primary: ['dietary', 'diet', 'nutrition', 'dietary aide', 'dietary technician', 'diet tech', 'nutritionist', 'registered dietitian', 'rd'],
            exclude: ['nurse', 'cna', 'therapist'],
            titlePatterns: [/dietary/i, /diet\b/i, /nutrition/i, /dietary aide/i, /dietary technician/i, /diet tech/i, /nutritionist/i, /registered dietitian/i, /rd\b/i]
          },
          'social_work': {
            primary: ['social worker', 'sw', 'licensed social worker', 'lsw', 'clinical social worker', 'lcsw', 'mental health technician', 'mht', 'behavioral health technician', 'bht', 'activity director', 'activities director', 'recreation therapist', 'rec therapist'],
            exclude: ['nurse', 'cna', 'therapist'],
            titlePatterns: [/social worker/i, /sw\b/i, /licensed social worker/i, /lsw\b/i, /clinical social worker/i, /lcsw\b/i, /mental health technician/i, /mht\b/i, /behavioral health technician/i, /bht\b/i, /activity director/i, /activities director/i, /recreation therapist/i, /rec therapist/i]
          },
          'support': {
            primary: ['housekeeper', 'environmental services', 'maintenance technician', 'maintenance tech', 'security officer', 'security'],
            exclude: ['nurse', 'cna', 'therapist'],
            titlePatterns: [/housekeeper/i, /environmental services/i, /maintenance technician/i, /maintenance tech/i, /security officer/i, /security/i]
          }
        };

        // Check if search terms match any specific role category
        let matchedRole = null;
        
        // Special handling for exact matches to avoid cross-category confusion
        if (searchTerms.length === 1) {
          const singleTerm = searchTerms[0];
          if (singleTerm === 'rn' || singleTerm === 'lpn') {
            matchedRole = 'nurse';
          } else if (singleTerm === 'cna') {
            matchedRole = 'cna';
          } else if (singleTerm === 'pt' || singleTerm === 'ot' || singleTerm === 'st' || singleTerm === 'rt') {
            matchedRole = 'therapist';
          } else if (singleTerm === 'hha') {
            matchedRole = 'aide';
          }
        }
        
        // If no exact match, check for general role matches
        if (!matchedRole) {
          for (const [roleKey, roleData] of Object.entries(roleCategories)) {
            const hasPrimaryMatch = searchTerms.some(term => 
              roleData.primary.some(primary => primary === term || primary.includes(term) || term.includes(primary))
            );
            
            if (hasPrimaryMatch) {
              matchedRole = roleKey;
              break;
            }
          }
        }

        if (matchedRole) {
          // Role-specific matching
          const roleData = roleCategories[matchedRole];
          const jobTitle = job.title.toLowerCase();
          const jobDescription = job.description?.toLowerCase() || '';
          
          // For single-term searches, be more specific
          if (searchTerms.length === 1) {
            const singleTerm = searchTerms[0];
            
            // Check if the job title contains the exact search term
            if (jobTitle.includes(singleTerm)) {
              // For specific abbreviations, only match if they appear as standalone terms
              if (['rn', 'lpn', 'pt', 'ot', 'st', 'rt', 'cna', 'hha'].includes(singleTerm)) {
                const wordBoundaryPattern = new RegExp(`\\b${singleTerm}\\b`, 'i');
                matchesSearch = wordBoundaryPattern.test(jobTitle);
                
                // Special case for CNA - also include "Nursing Assistant"
                if (singleTerm === 'cna' && jobTitle.includes('nursing assistant')) {
                  matchesSearch = true;
                }
              } else {
                matchesSearch = true;
              }
            } else {
              // Special case for CNA - also include "Nursing Assistant"
              if (singleTerm === 'cna' && jobTitle.includes('nursing assistant')) {
                matchesSearch = true;
              } else {
                matchesSearch = false;
              }
            }
          } else {
            // For multi-term searches, use the original logic
            const titleMatches = roleData.titlePatterns.some((pattern: RegExp) => pattern.test(jobTitle));
            
            if (titleMatches) {
              matchesSearch = true;
            } else {
              const titleHasPrimaryTerms = roleData.primary.some((term: string) => 
                jobTitle.includes(term)
              );
              
              const titleHasExcludedTerms = roleData.exclude.some((term: string) => 
                jobTitle.includes(term)
              );
              
              matchesSearch = titleHasPrimaryTerms && !titleHasExcludedTerms;
            }
          }
        } else {
          // Enhanced dynamic search - search across ALL job data
          const jobTitle = job.title.toLowerCase();
          const jobDescription = job.description?.toLowerCase() || '';
          const jobCompany = job.company.toLowerCase();
          const jobLocation = job.location.toLowerCase();
          const jobSalary = job.salary?.toLowerCase() || '';
          const jobRequirements = Array.isArray(job.requirements) 
            ? job.requirements.join(' ').toLowerCase()
            : (job.requirements?.toLowerCase() || '');
          const jobOverview = job.overview?.toLowerCase() || '';
          
          // Get all tags and their labels
          const jobTags = job.tags || [];
          const tagLabels = jobTags.map(tag => tag.label.toLowerCase()).join(' ');
          const tagTypes = jobTags.map(tag => tag.type.toLowerCase()).join(' ');
          
          // Create a comprehensive searchable text from all job data
          const comprehensiveJobText = [
            jobTitle,
            jobDescription,
            jobCompany,
            jobLocation,
            jobSalary,
            jobRequirements,
            jobOverview,
            tagLabels,
            tagTypes
          ].join(' ');
          
          // Check if ALL search terms are found in the comprehensive job data
          matchesSearch = searchTerms.every(term => {
            // Direct text matching
            if (comprehensiveJobText.includes(term)) {
              return true;
            }
            
            // Enhanced tag-based matching
            const hasMatchingTag = jobTags.some(tag => {
              const tagLabel = tag.label.toLowerCase();
              
              // Exact tag match
              if (tagLabel === term) {
                return true;
              }
              
              // Partial tag match
              if (tagLabel.includes(term) || term.includes(tagLabel)) {
                return true;
              }
              
              // Tag type matching (e.g., "shift", "employment", "setting")
              if (tag.type.toLowerCase().includes(term)) {
                return true;
              }
              
              return false;
            });
            
            if (hasMatchingTag) {
              return true;
            }
            
            // Enhanced salary matching
            if (jobSalary.includes(term)) {
              return true;
            }
            
            // Enhanced requirement matching
            if (jobRequirements.includes(term)) {
              return true;
            }
            
            // Enhanced company matching
            if (jobCompany.includes(term)) {
              return true;
            }
            
            // Enhanced location matching
            if (jobLocation.includes(term)) {
              return true;
            }
            
            // Enhanced title matching with fuzzy logic
            if (jobTitle.includes(term)) {
              return true;
            }
            
            // Enhanced description matching
            if (jobDescription.includes(term)) {
              return true;
            }
            
            return false;
          });
          
          // If no matches found with comprehensive search, try fuzzy matching
          if (!matchesSearch) {
            const fuzzyMatch = searchTerms.some(term => {
              // Calculate similarity scores for different job fields
              const titleSimilarity = calculateStringSimilarity(term, jobTitle);
              const companySimilarity = calculateStringSimilarity(term, jobCompany);
              const locationSimilarity = calculateStringSimilarity(term, jobLocation);
              
              // Check if any field has high similarity
              return titleSimilarity > 0.7 || companySimilarity > 0.7 || locationSimilarity > 0.7;
            });
            
            if (fuzzyMatch) {
              matchesSearch = true;
            }
          }
        }
      }
      
      // Enhanced location filtering with city validation
      let matchesLocation = true;
      if (locationInput !== '') {
        const inputLower = locationInput.toLowerCase().trim();
        
        const jobLocation = job.location.toLowerCase();
        
        // Extract city and state from location string
        const locationParts = jobLocation.split(',').map(part => part.trim());
        const jobCity = locationParts[0] || '';
        const jobState = locationParts[1] || '';
        
        // Check if input is a state code (2 letters)
        const isStateCode = /^[A-Z]{2}$/i.test(inputLower);
        
        // Check if input is a state name
        const isStateName = stateNameToCode[inputLower];
        
        // Check if input contains city and state (e.g., "Boston, MA" or "Boston MA")
        const cityStatePattern = /^([^,]+)\s*[,]?\s*([A-Z]{2}|[a-zA-Z\s]+)$/i;
        const cityStateMatch = inputLower.match(cityStatePattern);
        
        if (cityStateMatch) {
          // City, State format - use location validation
          const inputCity = cityStateMatch[1].trim();
          const inputState = cityStateMatch[2].trim();
          
          // Check if state is a code or name
          const targetState = stateNameToCode[inputState.toLowerCase()] || inputState.toUpperCase();
          
          // First try exact match
          matchesLocation = (jobCity.includes(inputCity) || jobLocation.includes(inputCity)) &&
                           (jobState.includes(targetState.toLowerCase()) || jobLocation.includes(targetState.toLowerCase()));
          
          // If no exact match, try to find closest city in the state
          if (!matchesLocation) {
            // This would ideally use the location validator, but for performance we'll do a simple check
            // In a full implementation, you'd want to pre-validate the input and store the closest matches
            const normalizedInputCity = inputCity.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            const normalizedJobCity = jobCity.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            
            // Simple similarity check - if cities are similar and in the same state
            if (normalizedInputCity.length > 2 && normalizedJobCity.length > 2) {
              const similarity = calculateStringSimilarity(normalizedInputCity, normalizedJobCity);
              matchesLocation = similarity > 0.7 && 
                               (jobState.includes(targetState.toLowerCase()) || jobLocation.includes(targetState.toLowerCase()));
            }
          }
        } else if (isStateCode || isStateName) {
          // State-only filtering
          const targetState = isStateCode ? inputLower.toUpperCase() : isStateName;
          matchesLocation = jobState.includes(targetState.toLowerCase()) || 
                           jobLocation.includes(targetState.toLowerCase()) ||
                           jobLocation.includes(inputLower);
        } else {
          // City-only or general location filtering
          matchesLocation = jobCity.includes(inputLower) || 
                           jobLocation.includes(inputLower) ||
                           jobState.includes(inputLower);
        }
      }
      
      const matchesFilters = activeFilters.length === 0 || 
                            activeFilters.some(filter => {
                              if (filter.type === 'shift') {
                                // Map time-based shifts to basic shift categories
                                const shiftMapping: Record<string, string[]> = {
                                  'Morning': ['Morning', '7AM-3PM', '6AM-2PM', '8AM-4PM', '9AM-5PM', '12-Hour Day', 'Day Shift'],
                                  'Afternoon': ['Afternoon', '3PM-11PM', '2PM-10PM', '4PM-12AM'],
                                  'Evening': ['Evening', '5PM-1AM', '4PM-12AM'],
                                  'Night': ['Night', 'Overnight', '11PM-7AM', '10PM-6AM', '12AM-8AM', '7PM-7AM', '6PM-6AM', '8PM-8AM', '12-Hour Night', 'Night Shift', 'Graveyard'],
                                  'Overnight': ['Overnight', 'Night', '11PM-7AM', '10PM-6AM', '12AM-8AM', '7PM-7AM', '6PM-6AM', '8PM-8AM', '12-Hour Night', 'Night Shift', 'Graveyard']
                                };
                                
                                const mappedShifts = shiftMapping[filter.label] || [filter.label];
                                return (job.tags || []).some(tag => 
                                  tag.type === 'shift' && mappedShifts.includes(tag.label)
                                );
                              } else {
                                return (job.tags || []).some(tag => tag.label === filter.label);
                              }
                            });
      
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
    if (term.trim() !== '') {
      setHasUserAppliedFilters(true);
    } else {
      // Check if other filters are active
      setHasUserAppliedFilters(locationInput.trim() !== '' || activeFilters.length > 0);
    }
  };

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    setIsFiltersOpen(false); // Close filters dropdown
    
    // Generate enhanced location suggestions
    const suggestions = generateLocationSuggestions(value);
    setShowLocationSuggestions(value.length >= 2 && suggestions.length > 0);
    
    // Update filter flag
    if (value.trim() !== '') {
      setHasUserAppliedFilters(true);
    } else {
      // Check if other filters are active
      setHasUserAppliedFilters(searchTerm.trim() !== '' || activeFilters.length > 0);
    }
  };

  const handleLocationSuggestionClick = (suggestion: { display: string; value: string; type: 'city_state' | 'state_only' }) => {
    setLocationInput(suggestion.value);
    setShowLocationSuggestions(false);
  };

  const handleLocationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputValue = locationInput.trim();
      
      if (inputValue) {
        // State name to code mapping
        const stateNameToCode: Record<string, string> = {
          'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
          'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
          'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
          'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
          'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
          'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
          'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
          'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
          'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
          'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
        };
        
        const inputLower = inputValue.toLowerCase();
        
        // Check if input is a state code (2 letters)
        const isStateCode = /^[A-Z]{2}$/i.test(inputLower);
        
        // Check if input is a state name
        const isStateName = stateNameToCode[inputLower];
        
        if (isStateCode || isStateName) {
          // Apply state-based filtering
          const targetState = isStateCode ? inputValue.toUpperCase() : isStateName;
          setLocationInput(targetState);
        }
      }
    }
  };

  const handleFiltersToggle = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };



  const handleFilterToggle = (filter: { label: string; type: TagType }) => {
    const newFilter: Tag = { 
      id: Date.now() + Math.random(), 
      label: filter.label, 
      type: filter.type 
    };
    
    setActiveFilters(prev => {
      const isActive = prev.some(f => f.label === filter.label);
      if (isActive) {
        const newFilters = prev.filter(f => f.label !== filter.label);
        // Update filter flag based on remaining filters
        setHasUserAppliedFilters(searchTerm.trim() !== '' || locationInput.trim() !== '' || newFilters.length > 0);
        return newFilters;
      } else {
        setHasUserAppliedFilters(true);
        return [...prev, newFilter];
      }
    });
  };

  const removeFilter = (filter: Tag) => {
    setActiveFilters(prev => {
      const newFilters = prev.filter(f => f.label !== filter.label);
      // Update filter flag based on remaining filters
      setHasUserAppliedFilters(searchTerm.trim() !== '' || locationInput.trim() !== '' || newFilters.length > 0);
      return newFilters;
    });
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    
    // On desktop, scroll to the job details container
    if (window.innerWidth >= 1024 && jobDetailsRef.current) {
      jobDetailsRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
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
    // Scroll to top of the page when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTagColor = (label: string) => {
    // Check tag type based on common patterns
    if (['Nursing Home', 'Assisted Living Facility', 'Home Care'].includes(label)) {
      return 'bg-purple-200'; // Purple for Job Setting
    } else if (['Full-Time', 'Part-Time', 'Per-Diem', 'Temp-To-Perm', 'Local Contract'].includes(label)) {
      return 'bg-[#8AADFC]'; // Blue for Employment Type
    } else if (['Morning', 'Afternoon', 'Evening', 'Night', 'Overnight', '7AM-3PM', '3PM-11PM', '11PM-7AM', '6AM-2PM', '2PM-10PM', '10PM-6AM', '8AM-4PM', '4PM-12AM', '12AM-8AM', '9AM-5PM', '5PM-1AM', '1AM-9AM', '7AM-7PM', '7PM-7AM', '6AM-6PM', '6PM-6AM', '8AM-8PM', '8PM-8AM', '12-Hour Shift', '8-Hour Shift', '10-Hour Shift', '16-Hour Shift', '12-Hour Day', '12-Hour Night'].includes(label)) {
      return 'bg-pink-200'; // Pink for Shift
    }
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

  // Calculate string similarity using Levenshtein distance
  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  };

  // Always generate pagination numbers when there are filtered jobs
  const paginationNumbers = filteredJobs.length > 0 ? generatePaginationNumbers(currentPage, totalPages) : [];

  // State name to code mapping - comprehensive with abbreviations and full names
  const stateNameToCode: Record<string, string> = {
    // Full state names
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
    // State abbreviations (for reverse lookup)
    'AL': 'AL', 'AK': 'AK', 'AZ': 'AZ', 'AR': 'AR', 'CA': 'CA',
    'CO': 'CO', 'CT': 'CT', 'DE': 'DE', 'FL': 'FL', 'GA': 'GA',
    'HI': 'HI', 'ID': 'ID', 'IL': 'IL', 'IN': 'IN', 'IA': 'IA',
    'KS': 'KS', 'KY': 'KY', 'LA': 'LA', 'ME': 'ME', 'MD': 'MD',
    'MA': 'MA', 'MI': 'MI', 'MN': 'MN', 'MS': 'MS', 'MO': 'MO',
    'MT': 'MT', 'NE': 'NE', 'NV': 'NV', 'NH': 'NH', 'NJ': 'NJ',
    'NM': 'NM', 'NY': 'NY', 'NC': 'NC', 'ND': 'ND', 'OH': 'OH',
    'OK': 'OK', 'OR': 'OR', 'PA': 'PA', 'RI': 'RI', 'SC': 'SC',
    'SD': 'SD', 'TN': 'TN', 'TX': 'TX', 'UT': 'UT', 'VT': 'VT',
    'VA': 'VA', 'WA': 'WA', 'WV': 'WV', 'WI': 'WI', 'WY': 'WY'
  };

  // State code to full name mapping for display
  const stateCodeToName: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  // Generate location suggestions with state autofill
  const generateLocationSuggestions = (input: string) => {
    if (input.length < 2) return [];
    
    const inputLower = input.toLowerCase().trim();
    const suggestions: Array<{ display: string; value: string; type: 'city_state' | 'state_only' }> = [];
    
    // Check if input is a state code or state name
    const isStateCode = /^[A-Z]{2}$/i.test(inputLower);
    const isStateName = stateNameToCode[inputLower];
    
    if (isStateCode || isStateName) {
      // State-only input - show state with full name
      const stateCode = isStateCode ? inputLower.toUpperCase() : isStateName;
      const stateName = stateCodeToName[stateCode];
      suggestions.push({
        display: `${stateName} (${stateCode})`,
        value: stateCode,
        type: 'state_only'
      });
      
      // Add popular cities in that state
      const popularCities = getPopularCitiesForState(stateCode);
      popularCities.forEach(city => {
        suggestions.push({
          display: `${city}, ${stateCode}`,
          value: `${city}, ${stateCode}`,
          type: 'city_state'
        });
      });
    } else {
      // Check if input contains a comma (city, state format)
      const commaIndex = inputLower.indexOf(',');
      if (commaIndex > 0) {
        const cityPart = inputLower.substring(0, commaIndex).trim();
        const statePart = inputLower.substring(commaIndex + 1).trim();
        
        // If state part is incomplete, suggest state completions
        if (statePart.length > 0 && statePart.length < 2) {
          Object.entries(stateNameToCode).forEach(([name, code]) => {
            if (name.toLowerCase().startsWith(statePart) && name.length > 2) {
              suggestions.push({
                display: `${cityPart}, ${stateCodeToName[code]} (${code})`,
                value: `${cityPart}, ${code}`,
                type: 'city_state'
              });
            }
          });
        } else if (statePart.length >= 2) {
          // Check if state part matches a state
          const matchingState = Object.entries(stateNameToCode).find(([name, code]) => 
            name.toLowerCase().startsWith(statePart) || code.toLowerCase().startsWith(statePart)
          );
          
          if (matchingState) {
            const [name, code] = matchingState;
            suggestions.push({
              display: `${cityPart}, ${stateCodeToName[code]} (${code})`,
              value: `${cityPart}, ${code}`,
              type: 'city_state'
            });
          }
        }
      } else {
        // No comma - could be city or state
        // Check if it matches a state name
        Object.entries(stateNameToCode).forEach(([name, code]) => {
          if (name.toLowerCase().includes(inputLower) && name.length > 2) {
            suggestions.push({
              display: `${stateCodeToName[code]} (${code})`,
              value: code,
              type: 'state_only'
            });
          }
        });
        
        // Check if it matches a city in existing job locations
        const matchingCities = allLocations.filter(location => 
          location.toLowerCase().includes(inputLower) && 
          location.toLowerCase() !== inputLower
        );
        
        matchingCities.forEach(location => {
          suggestions.push({
            display: location,
            value: location,
            type: 'city_state'
          });
        });
      }
    }
    
    return suggestions.slice(0, 8); // Limit to 8 suggestions
  };

  // Get popular cities for a given state
  const getPopularCitiesForState = (stateCode: string): string[] => {
    const popularCitiesByState: Record<string, string[]> = {
      'CA': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'],
      'NY': ['New York', 'Buffalo', 'Rochester', 'Syracuse', 'Albany'],
      'TX': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
      'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
      'IL': ['Chicago', 'Springfield', 'Peoria', 'Rockford', 'Naperville'],
      'PA': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
      'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
      'MI': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing'],
      'GA': ['Atlanta', 'Savannah', 'Athens', 'Augusta', 'Columbus'],
      'NC': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
      'VA': ['Richmond', 'Virginia Beach', 'Norfolk', 'Arlington', 'Alexandria'],
      'WA': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
      'MA': ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge'],
      'CT': ['Bridgeport', 'New Haven', 'Stamford', 'Hartford', 'Waterbury'],
      'NJ': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison'],
      'CO': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
      'AZ': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'],
      'TN': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
      'IN': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
      'MO': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence']
    };
    
    return popularCitiesByState[stateCode] || [];
  };

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
                  placeholder="Search Jobs..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 text-base lg:text-[20px] font-bold text-[#7691A4] placeholder-[#7691A4] bg-transparent outline-none font-avenir"
                />
              </div>
            </div>

            {/* Location Input */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-full px-4 lg:px-6 py-3 lg:py-3 shadow-sm w-full lg:min-w-[180px]">
                <MapPin className="w-5 h-5 lg:w-5 lg:h-5 text-[#7691A4] mr-2 flex-shrink-0" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="City, State"
                  value={locationInput}
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  onKeyPress={handleLocationKeyPress}
                  onFocus={() => {
                    const suggestions = generateLocationSuggestions(locationInput);
                    setShowLocationSuggestions(locationInput.length >= 2 && suggestions.length > 0);
                  }}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                  className="flex-1 text-base lg:text-[20px] font-bold text-[#7691A4] placeholder-[#7691A4] bg-transparent outline-none font-avenir"
                />
              </div>
              
              {/* Location Suggestions Dropdown */}
              {showLocationSuggestions && (() => {
                const suggestions = generateLocationSuggestions(locationInput);
                
                return suggestions.length > 0 ? (
                  <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-lg border border-gray-200 min-w-[250px] z-10">
                    <div className="max-h-48 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.value}-${index}`}
                          onClick={() => handleLocationSuggestionClick(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-2xl last:rounded-b-2xl font-avenir text-[#7691A4]"
                        >
                          {suggestion.display}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
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
                        <div className="flex-1 min-w-0 lg:pr-4 mb-4 lg:mb-0">
                          <h3 className="text-lg lg:text-[20px] font-black leading-[130%] text-[#2466D0] mb-3 font-avenir line-clamp-2">
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
                          {(job.tags || []).slice(0, 4).map((tag) => (
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
            <div 
              ref={jobDetailsRef}
              className="hidden lg:block lg:flex-1 lg:min-w-0 job-details-panel lg:sticky lg:top-8 lg:self-start" 
              style={{ 
              maxWidth: '55%', 
              overflowWrap: 'break-word',
              minHeight: '600px',
              height: 'min(1000px, 90vh)',
              maxHeight: '90vh'
              }}
            >
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
                      {(selectedJob.tags || []).map((tag) => (
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