'use client';

import React, { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Job } from '../types/job';
import { useAuth } from '../contexts/AuthContext';

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
}

export default function JobModal({ job, onClose }: JobModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { user, showLoginModal } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Only close if clicking on the actual backdrop, not on any child elements
      const target = event.target as Element;
      if (target.classList.contains('modal-backdrop')) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!job) return null;

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showLoginModal();
      return;
    }

    if (!job.url) {
      alert('Application URL not available for this job.');
      return;
    }

    window.open(job.url, '_blank', 'noopener,noreferrer');
  };

  const formatRequirements = (requirements: string[] | string | undefined) => {
    if (!requirements) return [];
    if (typeof requirements === 'string') {
      // Try to split by common delimiters
      return requirements.split(/[•\n\r]/).filter(req => req.trim().length > 0).map(req => req.trim());
    }
    return requirements;
  };

  const formatDescription = (description: string) => {
    // Clean up description and format it nicely
    return description
      .replace(/Skip to content/g, '')
      .replace(/Back to search/g, '')
      .replace(/EASY APPLY.*?Apply Now/g, '')
      .replace(/Local Agency:/g, '\n\nLocal Agency:')
      .replace(/Location:/g, '\nLocation:')
      .replace(/Position Type:/g, '\nPosition Type:')
      .replace(/Req ID:/g, '\nReq ID:')
      .replace(/Benefits:/g, '\n\nBenefits:')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Tag color function to match main page
  const getTagColor = (label: string) => {
    // Check tag type based on common patterns
    if (['Nursing Home', 'Assisted Living Facility', 'Home Care'].includes(label)) {
      return 'bg-purple-200'; // Purple for Job Setting
    } else if (['Full-Time', 'Part-Time', 'Per-Diem', 'Temp-To-Perm', 'Local Contract'].includes(label)) {
      return 'bg-[#8AADFC]'; // Blue for Employment Type
    } else if (['Morning', 'Afternoon', 'Evening', 'Night', 'Overnight', '7AM-3PM', '3PM-11PM', '11PM-7AM'].includes(label)) {
      return 'bg-pink-200'; // Pink for Shift
    }
    return 'bg-gray-200';
  };

  return (
    <div className="fixed inset-0 z-50 modal-backdrop bg-black bg-opacity-50">
      {/* Full Screen Modal */}
      <div 
        ref={modalRef}
        className="fixed inset-0 bg-white overflow-y-auto"
      >
        {/* Header - Not sticky, scrolls with content */}
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-[#2466D0] font-avenir leading-[130%] mb-2">{job.title}</h2>
              <p className="text-[16px] font-bold text-[#01253F] font-avenir">{job.company}</p>
              {job.location && job.location.trim() !== '' && job.location.trim().toLowerCase() !== 'unknown location' && (
                <p className="text-[16px] text-[#01253F] font-avenir">{job.location}</p>
              )}
              {job.salary && job.salary.trim() !== '' && job.salary.trim().toLowerCase() !== 'salary not specified' && (
                <p className="text-[16px] text-[#01253F] font-avenir">{job.salary}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-3 mb-4">
            {(job.tags || []).map((tag) => (
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

          {/* Apply Button */}
          <button
            onClick={handleApplyClick}
            className="w-full bg-[#2CB3BF] text-white font-black text-[20px] py-3 px-6 rounded-[12px] hover:bg-[#269aa5] transition-colors shadow-lg font-avenir"
          >
            Apply
          </button>
        </div>

        {/* Content - Single scroll, no dual scroll */}
        <div className="p-6 space-y-6">
          {/* Job Description */}
          {job.description && (
            <div>
              <h3 className="text-[18px] font-bold leading-[130%] text-[#01253F] mb-4 font-avenir">
                Job Description
              </h3>
              <div className="text-[16px] font-[350] leading-[196%] tracking-[0%] text-[#01253F] font-avenir">
                {formatDescription(job.description).split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-3 last:mb-0 leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h3 className="text-[18px] font-bold leading-[130%] text-[#01253F] mb-4 font-avenir">
                Requirements
              </h3>
              <div className="text-[16px] font-[350] leading-[196%] tracking-[0%] text-[#01253F] font-avenir">
                {Array.isArray(job.requirements) ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {formatRequirements(job.requirements).map((req, index) => (
                      <li key={index} className="leading-relaxed">{req}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="leading-relaxed">{job.requirements}</p>
                )}
              </div>
            </div>
          )}

          {/* Extra spacing at bottom */}
          <div className="h-24"></div>
        </div>
      </div>
    </div>
  );
} 