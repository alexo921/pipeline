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

export async function GET() {
  try {
    // Path to the JSON file in the root directory
    const filePath = path.join(process.cwd(), '..', '..', 'jobs_output_20250617_135843.json');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('Job data file not found, returning empty array');
      return NextResponse.json([]);
    }

    // Read and parse the JSON file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const jobData = JSON.parse(fileContents);

    // Return the job data (limit to reasonable number for performance)
    const limitedData = Array.isArray(jobData) ? jobData.slice(0, 100) : [];
    
    return NextResponse.json(limitedData);
  } catch (error) {
    console.error('Error reading job data:', error);
    return NextResponse.json([]);
  }
} 