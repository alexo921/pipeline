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
  url?: string; // Optional URL for job application
} 