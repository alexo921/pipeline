export type TagType = 'category' | 'employment' | 'experience';

export interface Tag {
  id: number;
  label: string;
  type: TagType;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: Tag[];
  overview: string;
  description?: string; // Full job description from scraper
  requirements?: string[] | string; // Job requirements
  url?: string; // Optional URL for job application
} 