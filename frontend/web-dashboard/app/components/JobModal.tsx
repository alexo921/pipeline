'use client';

import React, { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Job } from '../types/job';
import { useAuth } from '../contexts/AuthContext';
import { createPortal } from 'react-dom';

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
}

export default function JobModal({ job, onClose }: JobModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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

  // Prevent body scrolling when modal is open (mobile only)
  useEffect(() => {
    if (job) {
      // Only lock body scroll on mobile devices
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      
      if (isMobile) {
        // Store original body styles
        const originalStyle = window.getComputedStyle(document.body);
        const scrollY = window.scrollY;
        
        // Lock body scroll
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        
        return () => {
          // Restore original body styles
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflow = '';
          window.scrollTo(0, scrollY);
        };
      }
    }
  }, [job]);

  // Scroll to top when job changes
  useEffect(() => {
    if (contentRef.current && job) {
      contentRef.current.scrollTop = 0;
    }
  }, [job]);

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
    } else if (['Morning', 'Afternoon', 'Evening', 'Night', 'Overnight', '7AM-3PM', '3PM-11PM', '11PM-7AM', '6AM-2PM', '2PM-10PM', '10PM-6AM', '8AM-4PM', '4PM-12AM', '12AM-8AM', '9AM-5PM', '5PM-1AM', '1AM-9AM', '7AM-7PM', '7PM-7AM', '6AM-6PM', '6PM-6AM', '8AM-8PM', '8PM-8AM', '12-Hour Shift', '8-Hour Shift', '10-Hour Shift', '16-Hour Shift', '12-Hour Day', '12-Hour Night'].includes(label)) {
      return 'bg-pink-200'; // Pink for Shift
    }
    return 'bg-gray-200';
  };

  // Create portal to render modal at root level, completely isolated from page elements
  const modalContent = (
    <div 
      className="fixed inset-0 modal-backdrop bg-black bg-opacity-50 lg:hidden"
      style={{ 
        zIndex: 2147483647,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        isolation: 'isolate' // Create new stacking context
      }}
    >
      {/* Mobile-only bottom sheet modal */}
      <div 
        ref={modalRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl flex flex-col lg:hidden"
        style={{ 
          zIndex: 2147483647,
          maxHeight: '80vh',
          isolation: 'isolate' // Create new stacking context
        }}
      >
        {/* Header - Fixed at top */}
        <div className="p-6 border-b bg-white flex-shrink-0">
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
          <div className="flex flex-wrap gap-3">
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
        </div>

        {/* Content - Scrollable area */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc',
          }}
        >
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

          {/* Extra spacing at bottom to ensure content doesn't get hidden behind sticky button */}
          <div className="h-24"></div>
        </div>

        {/* Floating Apply Button - No background container */}
        <div className="p-6 flex justify-center">
          <button
            onClick={handleApplyClick}
            className="w-full sm:w-auto bg-[#2CB3BF] text-white font-black text-[20px] py-4 px-6 rounded-[12px] hover:bg-[#269aa5] transition-colors shadow-lg font-avenir"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Custom scrollbar styles */}
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
        
        /* Ensure modal is always on top */
        .modal-backdrop {
          z-index: 2147483647 !important;
        }
        
        /* Force modal content above everything */
        .modal-backdrop > div {
          z-index: 2147483647 !important;
        }
        
        /* Override any other z-index values */
        .modal-backdrop,
        .modal-backdrop * {
          z-index: 2147483647 !important;
        }
      `}</style>
    </div>
  );

  // Use portal to render modal at document root, completely isolated from page elements
  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
} 