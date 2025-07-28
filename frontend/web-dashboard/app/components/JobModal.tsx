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

  // No body scroll locking - let the modal handle its own scrolling
  useEffect(() => {
    if (job) {
      // Scroll to top when modal opens
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
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

    // Use job_url if available, otherwise fall back to url
    const applyUrl = job.job_url || job.url;
    
    if (!applyUrl) {
      alert('Application URL not available for this job.');
      return;
    }

    window.open(applyUrl, '_blank', 'noopener,noreferrer');
  };

  const formatDescription = (description: string) => {
    console.log('Original description:', description.substring(0, 200));
    
    // More aggressive HTML stripping
    let cleaned = description
      // Remove all HTML tags and their attributes
      .replace(/<[^>]*>/g, '')
      // Remove HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '...')
      .replace(/&copy;/g, '©')
      .replace(/&reg;/g, '®')
      .replace(/&trade;/g, '™')
      // Remove any remaining HTML-like patterns
      .replace(/class="[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '')
      .replace(/id="[^"]*"/g, '')
      .replace(/lang="[^"]*"/g, '')
      .replace(/mso-[^"]*="[^"]*"/g, '')
      .replace(/font-family:[^;]*;/g, '')
      .replace(/font-size:[^;]*;/g, '')
      .replace(/line-height:[^;]*;/g, '')
      .replace(/color:[^;]*;/g, '')
      .replace(/background:[^;]*;/g, '');
    
    console.log('After aggressive HTML stripping:', cleaned.substring(0, 200));
    
    // Clean up description and format it nicely
    cleaned = cleaned
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
    
    console.log('Final cleaned description:', cleaned.substring(0, 200));
    
    return cleaned;
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
      {/* Mobile-only full screen modal with safe area support */}
      <div 
        ref={modalRef}
        className="fixed inset-0 bg-white flex flex-col lg:hidden"
        style={{ 
          zIndex: 2147483647,
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
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
              
              {/* Rich data info */}
              <div className="mt-3 space-y-1">
                {job.date_posted && (
                  <p className="text-sm text-gray-600">
                    Posted: {new Date(job.date_posted).toLocaleDateString()}
                  </p>
                )}
                {job.employment_type && (
                  <p className="text-sm text-gray-600">
                    Employment: {Array.isArray(job.employment_type) 
                      ? job.employment_type.map(t => t.replace('_', ' ')).join(', ')
                      : job.employment_type.replace('_', ' ')
                    }
                  </p>
                )}
                {job.industry && (
                  <p className="text-sm text-gray-600">
                    Industry: {job.industry}
                  </p>
                )}

              </div>
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

        {/* Content - Scrollable area with sticky button */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc',
          }}
        >
          <div className="p-6 space-y-6">
            {/* Job Description */}
            {job.description && (
              <div>
                <h3 className="text-[18px] font-bold leading-[130%] text-[#01253F] mb-4 font-avenir">
                  Job Description
                </h3>
                <div className="text-[16px] font-[350] leading-[196%] tracking-[0%] text-[#01253F] font-avenir">
                  {(() => {
                    const formattedDescription = formatDescription(job.description);
                    console.log('Formatted description being rendered:', formattedDescription.substring(0, 200));
                    return formattedDescription.split('\n').map((paragraph, index) => (
                      paragraph.trim() && (
                        <p key={index} className="mb-3 last:mb-0 leading-relaxed">
                          {paragraph.trim()}
                        </p>
                      )
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Extra spacing at bottom to ensure content doesn't get hidden behind sticky button */}
            <div className="h-32"></div>
          </div>

          {/* Sticky Apply Button - Safe area aware */}
          <div className="sticky bottom-0 p-6 pb-safe flex justify-center bg-white border-t shadow-lg">
            <button
              onClick={handleApplyClick}
              className="w-3/4 sm:w-auto bg-[#2CB3BF] text-white font-black text-[20px] py-4 px-6 rounded-[12px] hover:bg-[#269aa5] transition-colors shadow-lg font-avenir"
            >
              Apply
            </button>
          </div>
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