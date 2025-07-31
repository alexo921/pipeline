'use client';

import React, { useEffect } from 'react';
import { Tag } from '../types/job';
import { Calendar, MapPin, Building, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: Tag[];
  onClick?: () => void;
  isSelected?: boolean;
  jobId?: string; // Add jobId for GTM tracking
  // New rich data fields
  date_posted?: string;
  employment_type?: string[] | string;
  organization_logo?: string;
  organization_name?: string;
  industry?: string;
}

export default function JobCard({
  title,
  company,
  location,
  salary,
  tags,
  onClick,
  isSelected = false,
  jobId,
  date_posted,
  employment_type,
  organization_logo,
  organization_name,
  industry
}: JobCardProps) {
  const { user } = useAuth();

  // Track job view when card is clicked
  const trackJobView = async () => {
    if (!jobId) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/track/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          userId: user?.id,
        }),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to track job view:', error);
    }
  };

  const handleClick = () => {
    trackJobView();
    if (onClick) onClick();
  };
  // Format employment type for display
  const formatEmploymentType = (type: string[] | string): string => {
    if (Array.isArray(type)) {
      return type.map(t => t.replace('_', ' ')).join(', ');
    }
    return (type as string)?.replace('_', ' ') || '';
  };

  // Format date posted
  const formatDatePosted = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Posted today';
      if (diffDays <= 7) return `Posted ${diffDays} days ago`;
      if (diffDays <= 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        bg-white rounded-lg border transition-all cursor-pointer
        ${isSelected 
          ? 'border-blue-500 shadow-md' 
          : 'border-gray-200 hover:border-blue-500 hover:shadow-md'
        }
        p-6
      `}
      data-job-id={jobId}
      data-title={title}
      data-location={location}
    >
      <div className="space-y-3">
        {/* Header with logo and company info */}
        <div className="flex items-start gap-3">
          {organization_logo && (
            <img 
              src={organization_logo} 
              alt={`${organization_name || company} logo`}
              className="w-12 h-12 rounded-lg object-cover border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-700 truncate">
              {title}
            </h3>
            <p className="text-gray-700 font-medium truncate">
              {company}
            </p>
          </div>
        </div>

        {/* Location and salary */}
        <div className="space-y-1">
          {location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{location}</span>
            </div>
          )}
          {salary && (
            <p className="text-green-600 font-medium">{salary}</p>
          )}
        </div>

        {/* Rich data info */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {date_posted && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDatePosted(date_posted)}</span>
            </div>
          )}
          {employment_type && (
            <div className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              <span>{formatEmploymentType(employment_type)}</span>
            </div>
          )}

          {industry && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {industry}
            </span>
          )}
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${tag.type === 'job_setting' ? 'bg-blue-100 text-blue-800' : ''}
                ${tag.type === 'employment_type' ? 'bg-gray-100 text-gray-800' : ''}
                ${tag.type === 'shift' ? 'bg-pink-100 text-pink-800' : ''}
              `}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 