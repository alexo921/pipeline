import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const jobTitles = [
  'Registered Nurse (RN)',
  'Certified Nursing Assistant (CNA)',
  'Licensed Practical Nurse (LPN)',
  'Home Health Aide',
  'Medical Assistant',
  'Physical Therapist',
  'Occupational Therapist',
  'Healthcare Administrator',
  'Patient Care Technician',
  'Nurse Practitioner',
] as const;

type JobTitle = typeof jobTitles[number];

const facilityTypes = [
  'Hospital',
  'Nursing Home',
  'Rehabilitation Center',
  'Home Healthcare',
  'Assisted Living Facility',
  'Medical Clinic',
  'Urgent Care Center',
];

const locations = [
  'San Francisco, CA',
  'Los Angeles, CA',
  'New York, NY',
  'Chicago, IL',
  'Houston, TX',
  'Miami, FL',
  'Seattle, WA',
  'Boston, MA',
  'Denver, CO',
  'Atlanta, GA',
];

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Per Diem', 'Temporary'];

function generateSalary(title: JobTitle) {
  // Base salaries for different roles
  const baseSalaries: Record<JobTitle, { min: number; max: number }> = {
    'Registered Nurse (RN)': { min: 75000, max: 110000 },
    'Certified Nursing Assistant (CNA)': { min: 35000, max: 50000 },
    'Licensed Practical Nurse (LPN)': { min: 48000, max: 65000 },
    'Home Health Aide': { min: 30000, max: 45000 },
    'Medical Assistant': { min: 35000, max: 52000 },
    'Physical Therapist': { min: 85000, max: 120000 },
    'Occupational Therapist': { min: 80000, max: 115000 },
    'Healthcare Administrator': { min: 65000, max: 95000 },
    'Patient Care Technician': { min: 32000, max: 48000 },
    'Nurse Practitioner': { min: 95000, max: 140000 },
  };

  const defaultSalary = { min: 40000, max: 80000 };
  const salary = baseSalaries[title] || defaultSalary;

  // Add some randomization within a reasonable range
  const variation = 5000;
  return {
    min: salary.min + Math.floor(Math.random() * variation),
    max: salary.max + Math.floor(Math.random() * variation),
    currency: 'USD',
    period: 'year'
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const minSalary = searchParams.get('minSalary');
    const maxSalary = searchParams.get('maxSalary');

    // Path to the Connecticut healthcare jobs JSON file
    const filePath = path.join(process.cwd(), 'brightstar_ct_jobs_1000_20250625_002803_enhanced_descriptions.json');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('Connecticut job data file not found, returning empty array');
      return NextResponse.json([]);
    }

    // Read and parse the JSON file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    let jobData = JSON.parse(fileContents);

    if (!Array.isArray(jobData)) {
      console.log('Invalid job data format');
      return NextResponse.json([]);
    }

    // Apply filters
    let filteredJobs = jobData;

    if (category && category !== 'all') {
      filteredJobs = filteredJobs.filter((job: any) => 
        job.category && job.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (location && location !== 'all') {
      filteredJobs = filteredJobs.filter((job: any) => 
        job.location && job.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (minSalary) {
      filteredJobs = filteredJobs.filter((job: any) => 
        job.salary_min >= parseInt(minSalary)
      );
    }

    if (maxSalary) {
      filteredJobs = filteredJobs.filter((job: any) => 
        job.salary_max <= parseInt(maxSalary)
      );
    }

    // Sort by quality score (highest first) and then by posted date
    filteredJobs.sort((a: any, b: any) => {
      if (a.quality_score !== b.quality_score) {
        return (b.quality_score || 0) - (a.quality_score || 0);
      }
      return new Date(b.posted_date || 0).getTime() - new Date(a.posted_date || 0).getTime();
    });

    // Limit results for performance
    const limitedData = filteredJobs.slice(0, limit);
    
    // Parse salary range from BrightStar format (e.g., "$15-25/hour" or "$45-65k/year")
    function parseSalaryRange(salaryRange: string) {
      if (!salaryRange) return { min: 0, max: 0 };
      
      // Extract numbers from salary range
      const numbers = salaryRange.match(/\d+/g);
      if (!numbers || numbers.length < 2) return { min: 0, max: 0 };
      
      let min = parseInt(numbers[0]);
      let max = parseInt(numbers[1]);
      
      // Convert hourly to annual (assuming 40 hours/week, 52 weeks/year)
      if (salaryRange.includes('/hour')) {
        min = min * 40 * 52;
        max = max * 40 * 52;
      } else if (salaryRange.includes('k')) {
        min = min * 1000;
        max = max * 1000;
      }
      
      return { min, max };
    }

    // Transform data to match expected format
    const transformedData = limitedData.map((job: any) => {
      const salaryData = parseSalaryRange(job.salary_range);
      
      return {
        id: job.id || `job_${Math.random().toString(36).substr(2, 9)}`,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.job_type || 'Full-time',
        salary: {
          min: job.salary_min || salaryData.min || 0,
          max: job.salary_max || salaryData.max || 0,
          currency: 'USD',
          period: 'year'
        },
        description: job.description || (Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements) || '',
        requirements: Array.isArray(job.requirements) ? job.requirements.join('\n• ') : (job.requirements || ''),
        benefits: Array.isArray(job.benefits) ? job.benefits.join(', ') : (job.benefits || ''),
        postedDate: job.posted_date || job.scraped_date?.split('T')[0] || job.scraped_at?.split('T')[0],
        url: job.url,
        category: job.category,
        qualityScore: job.quality_score || 0,
        source: job.source || 'brightstar_care'
      };
    });

    console.log(`Returning ${transformedData.length} Connecticut healthcare jobs`);
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error reading Connecticut job data:', error);
    return NextResponse.json([]);
  }
} 