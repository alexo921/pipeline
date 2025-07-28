export type TagType = 'job_setting' | 'employment_type' | 'shift';

export interface Tag {
  id: number;
  label: string;
  type: TagType;
}

export interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: Tag[];
  overview: string;
  description?: string; // Full job description from scraper
  requirements?: string[] | string; // Job requirements
  url?: string; // Optional URL for job application
  
  // New rich data fields from JSON
  job_url?: string; // Direct job application URL
  date_posted?: string; // When the job was posted
  employment_type?: string[] | string; // FULL_TIME, PART_TIME, etc.
  base_salary?: {
    currency?: string;
    value?: number;
  };
  industry?: string; // Healthcare, etc.
  education_requirements?: {
    credential_category?: string; // CERTIFICATE, etc.
  };
  organization_logo?: string; // Company logo URL
  organization_name?: string; // Full organization name
  organization_website?: string; // Company website
  address?: {
    city?: string;
    state?: string;
    zip_code?: string;
    street_address?: string;
    latitude?: string;
    longitude?: string;
  };
  scraped_at?: string; // When the job was scraped
  source_url?: string; // Original source URL
} 