'use client';

import React from 'react';
import { Tag } from '../types/job';

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: Tag[];
  onClick?: () => void;
  isSelected?: boolean;
}

export default function JobCard({
  title,
  company,
  location,
  salary,
  tags,
  onClick,
  isSelected = false
}: JobCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-lg border transition-all cursor-pointer
        ${isSelected 
          ? 'border-blue-500 shadow-md' 
          : 'border-gray-200 hover:border-blue-500 hover:shadow-md'
        }
        p-6
      `}
    >
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-700">
          {title}
        </h3>
        <p className="text-gray-600">{company}</p>
        <p className="text-gray-600">{location}</p>
        <p className="text-gray-600">{salary}</p>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`
                inline-flex items-center px-4 py-2 rounded-full text-base font-medium
                ${tag.type === 'primary' ? 'bg-blue-100 text-blue-800' : ''}
                ${tag.type === 'secondary' ? 'bg-gray-100 text-gray-800' : ''}
                ${tag.type === 'accent' ? 'bg-pink-100 text-pink-800' : ''}
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