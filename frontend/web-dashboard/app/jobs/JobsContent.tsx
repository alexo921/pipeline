'use client';

import React, { useState, useEffect, useRef } from 'react';
import JobModal from '../components/JobModal';
import { Job, Tag, TagType } from '../types/job';
import { Search, MapPin, Filter, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { env } from 'process';
import { analyticsService } from '../services/analytics.service';

// Load job data from multiple enhanced JSON files
const loadJobData = async (shouldShuffle: boolean = true): Promise<Job[]> => {
  try {
    const allJobs: Record<string, unknown>[] = [];
    
    // List of all enhanced JSON files to load
    const jsonFiles = [
      '/live_data.json',
      '/new_manual_jobs.json',
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
          const data = await response.json();
          let jobs = [];
          
          // Handle different JSON structures
          if (Array.isArray(data)) {
            // Direct array of jobs
            jobs = data;
          } else if (data.jobs && Array.isArray(data.jobs)) {
            // Object with jobs array
            jobs = data.jobs;
          } else {
            console.warn(`Unexpected format in ${file}:`, data);
            continue;
          }
          
          allJobs.push(...jobs);
          console.log(`Loaded ${jobs.length} jobs from ${file}`);
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
    .replace(/\bis\s+a\b(?!\s*[0-9])/gi, '') // Remove "is a" from company names, but not when followed by a number (time format)
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
  
  // First, try to extract city/state from the original location without aggressive cleaning
  // This preserves good location data like "171 Main St East Windsor, Connecticut, 06088 United States"
  
  // Try to match: ... City, ST ... (with optional ZIP and country)
  const cityStateMatch = location.match(/([A-Za-z .'-]+),\s*([A-Z]{2})(?:\s*,?\s*\d{5}(?:-\d{4})?\s*,?\s*(?:United States|USA|US)?)?$/i);
  if (cityStateMatch) {
    return { 
      cityState: `${cityStateMatch[1].trim()}, ${cityStateMatch[2].trim()}`,
      stateOnly: null
    };
  }
  
  // Try to match: ... City, State ... (with optional ZIP and country)
  const cityFullStateMatch = location.match(/([A-Za-z .'-]+),\s*([A-Za-z\s]+)(?:\s*,?\s*\d{5}(?:-\d{4})?\s*,?\s*(?:United States|USA|US)?)?$/i);
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
  
  // If the above didn't work, try a more flexible pattern that looks for city, state anywhere in the string
  const flexibleCityStateMatch = location.match(/([A-Za-z .'-]+),\s*([A-Z]{2})/);
  if (flexibleCityStateMatch) {
    return { 
      cityState: `${flexibleCityStateMatch[1].trim()}, ${flexibleCityStateMatch[2].trim()}`,
      stateOnly: null
    };
  }
  
  const flexibleCityFullStateMatch = location.match(/([A-Za-z .'-]+),\s*([A-Za-z\s]+)/);
  if (flexibleCityFullStateMatch) {
    const city = flexibleCityFullStateMatch[1].trim();
    const fullState = flexibleCityFullStateMatch[2].trim();
    const stateCode = stateNameToCode[fullState.toLowerCase()];
    if (stateCode) {
      return { 
        cityState: `${city}, ${stateCode}`,
        stateOnly: null
      };
    }
  }
  
  // If we still haven't found a good pattern, apply the original aggressive cleaning
  // Clean the location string - remove common unwanted patterns
  let cleanLocation = location
    .replace(/\d{5}(-\d{4})?/g, '') // Remove ZIP codes
    .replace(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Way|Terrace|Ter)/gi, '') // Remove street addresses
    .replace(/\b(?:United States|USA|US)\b/gi, '') // Remove country names
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/^\s*,\s*|\s*,\s*$/g, '') // Remove leading/trailing commas
    .trim();
  
  // Try to match: ... City, ST ...
  const cleanCityStateMatch = cleanLocation.match(/([A-Za-z .'-]+),\s*([A-Z]{2})(?:\s|,|$)/);
  if (cleanCityStateMatch) {
    return { 
      cityState: `${cleanCityStateMatch[1].trim()}, ${cleanCityStateMatch[2].trim()}`,
      stateOnly: null
    };
  }
  
  // Try to match: ... City, State ...
  const cleanCityFullStateMatch = cleanLocation.match(/([A-Za-z .'-]+),\s*([A-Za-z\s]+)(?:\s|,|$)/);
  if (cleanCityFullStateMatch) {
    const city = cleanCityFullStateMatch[1].trim();
    const fullState = cleanCityFullStateMatch[2].trim();
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

// Utility to parse out individual facilities from multi-site parent companies
const parseFacilityFromCompany = (company: string, description: string, location: string): string => {
  if (!company) return '';
  
  const companyLower = company.toLowerCase();
  const descriptionLower = description.toLowerCase();
  const locationLower = (typeof location === 'string' ? location : '').toLowerCase();
  
  // Multi-site parent companies and their facility patterns
  const parentCompanyPatterns = {
    'rydershealth': {
      patterns: [
        // Bel-Air Manor variations
        /bel-air manor/gi,
        /bel air manor/gi,
        /belair manor/gi,
        
        // Cheshire House variations
        /cheshire house nursing & rehabilitation center/gi,
        /cheshire house/gi,
        
        // Douglas Manor variations
        /douglas manor nursing & rehabilitation center/gi,
        /douglas manor/gi,
        
        // Greentree Manor variations
        /greentree manor nursing & rehabilitation center/gi,
        /greentree manor/gi,
        
        // Aaron Manor variations
        /aaron manor nursing and rehabilitation center/gi,
        /aaron manor/gi,
        
        // West Haven Center variations
        /west haven center for nursing & rehabilitation/gi,
        /west haven center/gi,
        
        // Waterbury Center variations
        /waterbury center for nursing & rehabilitation/gi,
        /waterbury center/gi,
        
        // Torrington Center variations
        /torrington center for nursing & rehabilitation/gi,
        /torrington center/gi,
        
        // Southport Center variations
        /southport center for nursing & rehabilitation/gi,
        /southport center/gi,
        
        // New Haven Center variations
        /new haven center for nursing & rehabilitation/gi,
        /new haven center/gi,
        
        // General facility patterns for RydersHealth
        /([a-zA-Z\s&-]+(?:manor|house|center|facility|nursing|rehabilitation|care|health|medical|hospital|clinic|home))(?:\s+is\s+a|\s+is\s+an|\s+is\s+located|\s+specializes)/gi,
        /([a-zA-Z\s&-]+(?:manor|house|center|facility|nursing|rehabilitation|care|health|medical|hospital|clinic|home))(?:\s+in\s+[a-zA-Z\s]+,\s+connecticut)/gi,
        /company\s+description:\s*([a-zA-Z\s&-]+(?:manor|house|center|facility|nursing|rehabilitation|care|health|medical|hospital|clinic|home))/gi,
        /^([a-zA-Z\s&-]+(?:manor|house|center|facility|nursing|rehabilitation|care|health|medical|hospital|clinic|home))(?:\s+is\s+a|\s+is\s+an)/gi
      ],
      fallback: 'RydersHealth'
    },
    'athena health care systems': {
      patterns: [
        /athena hospice of rhode island/gi,
        /athena home health & hospice/gi,
        /athena home health and hospice/gi,
        /athena hospice/gi,
        /athena home health/gi
      ],
      fallback: 'Athena Health Care Systems'
    },
    'atlas healthcare': {
      patterns: [
        /atlas rehabilitation and healthcare at daughters of miriam campus/gi,
        /daughters of miriam campus/gi,
        /atlas post acute at woodbury country club/gi,
        /woodbury country club/gi,
        /atlas rehab and healthcare at maywood/gi,
        /atlas rehab at maywood/gi,
        /maywood/gi
      ],
      fallback: 'Atlas Healthcare'
    },
    'icare health network': {
      patterns: [
        // Touchpoints facilities
        /touchpoints at chestnut/gi,
        /touchpoints at bloomfield/gi,
        /touchpoints at manchester/gi,
        /touchpoints at farmington/gi,
        /touchpoints at newington/gi,
        /touchpoints at waterbury/gi,
        /touchpoints at torrington/gi,
        /touchpoints at southport/gi,
        /touchpoints at new haven/gi,
        /touchpoints at west haven/gi,
        /touchpoints at waterbury center/gi,
        /touchpoints at torrington center/gi,
        /touchpoints at southport center/gi,
        /touchpoints at new haven center/gi,
        /touchpoints at west haven center/gi,
        
        // Trinity Hill facilities
        /trinity hill care/gi,
        /trinity hill care center/gi,
        /trinity hill/gi,
        
        // Westside facilities
        /westside care center/gi,
        /westside/gi,
        
        // MissionCare facilities
        /missioncare at holyoke/gi,
        /missioncare/gi,
        
        // Parkville facilities
        /parkville care center/gi,
        /parkville/gi,
        
        // Silver Springs facilities
        /silver springs care center/gi,
        /silver springs/gi,
        
        // Other specific Icare facilities
        /60 west/gi,
        /60 west st/gi,
        /60 west street/gi,
        
        // General Icare patterns
        /icare health network/gi,
        /icare/gi
      ],
      fallback: 'iCare Health Network'
    }
  };
  
  // Check if this is a known parent company
  for (const [parentCompany, config] of Object.entries(parentCompanyPatterns)) {
    if (companyLower.includes(parentCompany)) {
      // Look for facility patterns in description and location
      for (const pattern of config.patterns) {
        const match = descriptionLower.match(pattern) || locationLower.match(pattern);
        if (match) {
          // For patterns with capture groups, use the first capture group
          let facilityName = match[0];
          if (match[1]) {
            facilityName = match[1];
          }
          
          // Clean up the facility name
          facilityName = facilityName.trim();
          facilityName = facilityName.replace(/\s+/g, ' '); // Remove extra spaces
          
          // Proper capitalization
          facilityName = facilityName.replace(/\b\w/g, l => l.toUpperCase());
          
          // Validate it's not too short or too long
          if (facilityName.length >= 3 && facilityName.length <= 100) {
            return facilityName;
          }
        }
      }
      
      // If no specific facility found, return the fallback
      return config.fallback;
    }
  }
  
  // If not a known parent company, return the original company name
  return company;
};

const transformJobData = (rawJobs: Record<string, unknown>[], shouldShuffle: boolean = true): Job[] => {
  const transformedJobs = rawJobs
    .map((job, index) => {
      const title = (job.title as string) || 'Unknown Position';
      const description = (job.description as string) || '';
      const url = (job.url as string) || '';
      const company = (job.company as string) || '';
      let location = (job.location as string) || '';
      
      // Parse out individual facilities from multi-site parent companies
      const parsedCompany = parseFacilityFromCompany(company, description, location);
      
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
        tags = generateTags(truncatedTitle, description, job.category as string, parsedCompany);
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
        company: cleanJobCardContent(parsedCompany, 50),
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
    // First check for first, second, third shift patterns
    const shiftNumberPatterns = [
      { pattern: /first\s*shift|1st\s*shift|first/i, shift: 'Morning' },
      { pattern: /second\s*shift|2nd\s*shift|second/i, shift: 'Evening' },
      { pattern: /third\s*shift|3rd\s*shift|third/i, shift: 'Overnight' },
    ];
    
    for (const { pattern, shift } of shiftNumberPatterns) {
      if (pattern.test(text)) {
        return shift;
      }
    }
    
    // Check for specific time patterns and return the exact time range
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
    
    // Check for explicit shift keywords - ENHANCED to catch more patterns
    if (text.includes('overnight shift') || text.includes('night shift') || text.includes('graveyard shift') || 
        text.includes('night nurses') || text.includes('night shift') || text.includes('overnight')) {
      return 'Night';
    } else if (text.includes('morning shift') || text.includes('early morning') || text.includes('morning')) {
      return 'Morning';
    } else if (text.includes('afternoon shift') || text.includes('midday') || text.includes('afternoon')) {
      return 'Afternoon';
    } else if (text.includes('evening shift') || text.includes('late afternoon') || text.includes('evening')) {
      return 'Evening';
    } else if (text.includes('day shift') || text.includes('daytime') || text.includes('day and evening')) {
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
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { user, showLoginModal } = useAuth();
  const desktopJobDetailsRef = useRef<HTMLDivElement>(null);

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
    job_settings: Array.from(new Set(jobs.flatMap(job => (job.tags || []).filter(tag => tag.type === 'job_setting').map(tag => tag.label)))),
    employment_types: Array.from(new Set(jobs.flatMap(job => (job.tags || []).filter(tag => tag.type === 'employment_type').map(tag => tag.label)))),
    shifts: Array.from(new Set(jobs.flatMap(job => (job.tags || []).filter(tag => tag.type === 'shift').map(tag => tag.label))))
  };

  // Available locations - dynamically generated from loaded data
  const allLocations = [
    "All Locations",
    ...Array.from(new Set(jobs.map(job => job.location))).sort(),
    // Add state names for better filtering
    "Connecticut", "CT",
    "Massachusetts", "MA", 
    "New York", "NY",
    "Rhode Island", "RI",
    "New Hampshire", "NH",
    "Vermont", "VT",
    "Maine", "ME",
    "Pennsylvania", "PA",
    "New Jersey", "NJ",
    "Delaware", "DE",
    "Maryland", "MD",
    "Virginia", "VA",
    "West Virginia", "WV",
    "Ohio", "OH",
    "Indiana", "IN",
    "Illinois", "IL",
    "Michigan", "MI",
    "Wisconsin", "WI",
    "Minnesota", "MN",
    "Iowa", "IA",
    "Missouri", "MO",
    "North Dakota", "ND",
    "South Dakota", "SD",
    "Nebraska", "NE",
    "Kansas", "KS",
    "Oklahoma", "OK",
    "Texas", "TX",
    "Arkansas", "AR",
    "Louisiana", "LA",
    "Mississippi", "MS",
    "Alabama", "AL",
    "Georgia", "GA",
    "Florida", "FL",
    "South Carolina", "SC",
    "North Carolina", "NC",
    "Tennessee", "TN",
    "Kentucky", "KY",
    "Colorado", "CO",
    "Utah", "UT",
    "Arizona", "AZ",
    "New Mexico", "NM",
    "California", "CA",
    "Nevada", "NV",
    "Oregon", "OR",
    "Washington", "WA",
    "Idaho", "ID",
    "Montana", "MT",
    "Wyoming", "WY",
    "Alaska", "AK",
    "Hawaii", "HI"
  ];

  // Filtered locations based on search
  const filteredLocations = allLocations.filter(location => 
    location.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Filter jobs based on search, location, and active filters
  useEffect(() => {
    console.log('Filtering jobs with selectedLocation:', selectedLocation);
    console.log('Total jobs before filtering:', jobs.length);
    
    const filtered = jobs.filter(job => {
      // Enhanced search functionality - search across all relevant fields with AND logic
      const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      const matchesSearch = searchTerm === '' || searchTerms.length === 0 || 
                           searchTerms.every(term => {
                             const jobText = [
                               job.title.toLowerCase(),
                               job.company.toLowerCase(),
                               job.location.toLowerCase(),
                               job.description?.toLowerCase() || '',
                               ...(job.requirements && Array.isArray(job.requirements) ? 
                                   job.requirements.map(req => req.toLowerCase()) : []),
                               ...(job.requirements && typeof job.requirements === 'string' ? 
                                   [job.requirements.toLowerCase()] : []),
                               ...(job.tags ? job.tags.map(tag => tag.label.toLowerCase()) : [])
                             ].join(' ');
                             return jobText.includes(term);
                           });
      
      // Enhanced location filtering - handle state-based filtering
      let matchesLocation = true;
      if (selectedLocation !== 'All Locations') {
        const inputLower = selectedLocation.toLowerCase().trim();
        const jobLocation = job.location.toLowerCase();
        
        console.log(`Checking location for job "${job.title}":`);
        console.log(`  - Job location: "${job.location}"`);
        console.log(`  - Selected location: "${selectedLocation}"`);
        console.log(`  - Input lower: "${inputLower}"`);
        console.log(`  - Job location lower: "${jobLocation}"`);
        
        // Check if input is a state code or state name
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
        
        // Check if input is a state code (2 letters)
        const isStateCode = /^[A-Z]{2}$/i.test(inputLower);
        console.log(`  - Is state code: ${isStateCode}`);
        
        // Check if input is a state name
        const isStateName = stateNameToCode[inputLower];
        console.log(`  - Is state name: ${isStateName ? 'Yes' : 'No'}`);
        
        if (isStateCode || isStateName) {
          // State-based filtering - show all jobs in that state
          const targetState = isStateCode ? inputLower.toUpperCase() : isStateName;
          console.log(`  - Target state: "${targetState}"`);
          
          // Check if job location contains the state code or state name
          const matchesTargetState = jobLocation.includes(targetState.toLowerCase());
          const matchesInputLower = jobLocation.includes(inputLower);
          const matchesSelectedLocation = jobLocation.includes(selectedLocation.toLowerCase());
          
          matchesLocation = matchesTargetState || matchesInputLower || matchesSelectedLocation;
          
          console.log(`  - Matches target state (${targetState.toLowerCase()}): ${matchesTargetState}`);
          console.log(`  - Matches input lower (${inputLower}): ${matchesInputLower}`);
          console.log(`  - Matches selected location (${selectedLocation.toLowerCase()}): ${matchesSelectedLocation}`);
          console.log(`  - Final location match: ${matchesLocation}`);
        } else {
          // Regular location filtering for cities or other locations
          matchesLocation = jobLocation.includes(inputLower);
          console.log(`  - Regular location match: ${matchesLocation}`);
        }
      }
      
      const matchesFilters = activeFilters.length === 0 || 
                            activeFilters.some(filter => 
                              (job.tags || []).some(tag => tag.label === filter.label)
                            );
      
      const finalMatch = matchesSearch && matchesLocation && matchesFilters;
      console.log(`  - Final result for "${job.title}": ${finalMatch} (search: ${matchesSearch}, location: ${matchesLocation}, filters: ${matchesFilters})`);
      
      return finalMatch;
    });
    
    console.log('Filtered jobs count:', filtered.length);
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
    
    // Track search if term is not empty
    if (term.trim()) {
      analyticsService.trackSearch({
        searchTerm: term,
        filters: {
          location: selectedLocation,
          activeFilters: activeFilters.map(f => ({ type: f.type, label: f.label })),
        },
        resultCount: filteredJobs.length,
        userId: user?.id,
      });
    }
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
    // If clicking the same location (and it's not "All Locations"), toggle back to "All Locations"
    if (location === selectedLocation && location !== 'All Locations') {
      setSelectedLocation('All Locations');
    } else {
      setSelectedLocation(location);
    }
    setIsLocationOpen(false);
    setLocationSearch(''); // Clear search when location is selected
  };

  const handleFilterToggle = (filter: { label: string; type: TagType }) => {
    const newFilter: Tag = { 
      id: Date.now() + Math.random(), 
      label: filter.label, 
      type: filter.type 
    };
    
    const isAdding = !activeFilters.some(f => f.label === filter.label);
    
    setActiveFilters(prev => 
      isAdding
        ? [...prev, newFilter]
        : prev.filter(f => f.label !== filter.label)
    );

    // Track filter event
    analyticsService.trackFilter({
      filterType: filter.type,
      filterValue: filter.label,
      resultCount: filteredJobs.length,
      userId: user?.id,
    });
  };

  const removeFilter = (filter: Tag) => {
    setActiveFilters(prev => prev.filter(f => f.label !== filter.label));
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    
    // Track job view
    analyticsService.trackJobView({
      jobId: String(job.id),
      jobTitle: job.title,
      companyName: job.company,
      location: job.location,
      salary: job.salary,
      tags: job.tags?.map(tag => tag.label) || [],
      source: 'job_list',
      userId: user?.id,
    });
    
    // Scroll desktop job details to top when switching jobs
    if (desktopJobDetailsRef.current) {
      const scrollableContent = desktopJobDetailsRef.current.querySelector('.overflow-y-auto') as HTMLElement;
      if (scrollableContent) {
        scrollableContent.scrollTop = 0;
      }
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

      // Track job apply analytics
      analyticsService.trackJobApply({
        jobId: String(selectedJob.id),
        jobTitle: selectedJob.title,
        companyName: selectedJob.company,
        location: selectedJob.location,
        salary: selectedJob.salary,
        tags: selectedJob.tags?.map(tag => tag.label) || [],
        source: 'job_details',
        userId: user.id,
      });

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

  // Generate pagination numbers - show first 5 numbers and then "..."
  const generatePaginationNumbers = (current: number, total: number): (number | string)[] => {
    const numbers: (number | string)[] = [];
    const maxVisible = 5;
    
    if (total <= maxVisible) {
      // If total pages is 5 or less, show all pages except the last one
      for (let i = 1; i <= Math.min(total - 1, maxVisible); i++) {
        numbers.push(i);
      }
    } else {
      // Show first 5 numbers and then "..."
      for (let i = 1; i <= maxVisible; i++) {
        numbers.push(i);
      }
      numbers.push('...');
    }
    
    return numbers;
  };

  // Always generate pagination numbers when there are filtered jobs
  const paginationNumbers = filteredJobs.length > 0 ? generatePaginationNumbers(currentPage, totalPages) : [];

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
                  placeholder="Search"
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
                      className={`bg-white rounded-xl lg:rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] p-6 lg:p-8 cursor-pointer hover:shadow-[6px_4px_15px_rgba(36,102,208,0.6)] transition-all duration-200 w-full overflow-hidden job-card ${
                        selectedJob?.id === job.id ? 'ring-2 ring-[#2466D0]' : ''
                      }`}
                      style={{
                        minHeight: '140px',
                        height: 'auto'
                      }}
                      data-job-id={job.id}
                      data-title={job.title}
                      data-location={job.location}
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
              ref={desktopJobDetailsRef}
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
                        className="bg-[#2CB3BF] text-white font-black text-[20px] py-3 px-6 rounded-[12px] hover:bg-[#269aa5] transition-colors shadow-lg font-avenir apply-button"
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