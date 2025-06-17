import { NextRequest, NextResponse } from 'next/server';

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
    console.log('API route called');
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const search = (searchParams.get('search') || '').toLowerCase();
    const locationFilter = (searchParams.get('location') || '').toLowerCase();

    console.log('Search params:', { page, limit, search, locationFilter });

    // Generate all jobs first
    let jobs = Array.from({ length: 50 }, (_, i) => {
      const title = jobTitles[i % jobTitles.length];
      const location = locations[i % locations.length];
      const facilityType = facilityTypes[i % facilityTypes.length];
      const type = jobTypes[i % jobTypes.length];
      const salary = generateSalary(title);
      
      return {
        id: `job-${i + 1}`,
        title,
        facilityType,
        location,
        companyLogo: '/placeholder-logo.svg',
        applyUrl: `https://example.com/apply/${i + 1}`,
        salary,
        type,
        postedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        description: `Join our team as a ${title} in ${location}. We're looking for dedicated healthcare professionals to provide exceptional care to our patients.`,
        requirements: [
          'Valid license/certification',
          'Previous healthcare experience',
          'Strong communication skills',
          'Ability to work various shifts',
        ],
        benefits: [
          'Competitive salary',
          'Health insurance',
          '401(k) matching',
          'Paid time off',
          'Professional development opportunities',
        ],
      };
    });

    // Apply filters if any
    if (search) {
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(search) ||
        job.description.toLowerCase().includes(search) ||
        job.facilityType.toLowerCase().includes(search)
      );
    }

    if (locationFilter) {
      jobs = jobs.filter(job => 
        job.location.toLowerCase().includes(locationFilter)
      );
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = jobs.slice(startIndex, endIndex);
    const totalJobs = jobs.length;
    const totalPages = Math.ceil(totalJobs / limit);
    const hasMore = page < totalPages;

    console.log('Sending response:', {
      jobsCount: paginatedJobs.length,
      totalJobs,
      totalPages,
      hasMore
    });

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      jobs: paginatedJobs,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 