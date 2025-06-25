'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Job } from '../types/job';

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
}

export default function JobModal({ job, onClose }: JobModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const descriptionHeaderRef = useRef<HTMLHeadingElement>(null);
  const [isDescriptionSticky, setIsDescriptionSticky] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleScroll = () => {
      if (descriptionHeaderRef.current) {
        const rect = descriptionHeaderRef.current.getBoundingClientRect();
        const headerHeight = 100; // Approximate height of the modal header
        setIsDescriptionSticky(rect.top <= headerHeight);
      }
    };

    const modalContent = modalRef.current?.querySelector('.modal-content');
    if (modalContent) {
      modalContent.addEventListener('scroll', handleScroll);
      return () => modalContent.removeEventListener('scroll', handleScroll);
    }
  }, [job]);

  if (!job) return null;

  const handleApplyClick = () => {
    if (job.url) {
      window.open(job.url, '_blank');
    } else {
      console.log('Apply clicked - no URL available');
    }
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

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div 
        ref={modalRef}
        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b bg-white z-10">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold text-blue-600 truncate">{job.title}</h2>
              <p className="text-gray-600 truncate">{job.company}</p>
              <p className="text-sm text-gray-500">{job.location} • {job.salary}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto modal-content" style={{ scrollBehavior: 'smooth' }}>
            <div className="p-6 space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`
                      inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      ${tag.type === 'category' ? 'bg-blue-100 text-blue-800' : ''}
                      ${tag.type === 'employment' ? 'bg-gray-100 text-gray-800' : ''}
                      ${tag.type === 'experience' ? 'bg-pink-100 text-pink-800' : ''}
                    `}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>

              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Overview</h3>
                <p className="text-gray-700 leading-relaxed">
                  {job.overview || "Community Focused. Care Driven."}
                </p>
              </div>

              {/* Job Description - This will become sticky */}
              {job.description && (
                <div className="relative">
                  <h3 
                    ref={descriptionHeaderRef}
                    className={`text-lg font-semibold mb-3 text-gray-900 transition-all duration-200 ${
                      isDescriptionSticky 
                        ? 'sticky top-0 bg-white py-3 border-b shadow-sm z-10' 
                        : ''
                    }`}
                  >
                    Job Description
                  </h3>
                  <div 
                    className={`bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto ${
                      isDescriptionSticky ? 'border border-gray-200' : ''
                    }`}
                    style={{ 
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e0 #f7fafc'
                    }}
                  >
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {formatDescription(job.description).split('\n').map((paragraph, index) => (
                        paragraph.trim() && (
                          <p key={index} className="mb-3 last:mb-0 leading-relaxed">
                            {paragraph.trim()}
                          </p>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Requirements</h3>
                  <ul className="list-disc pl-5 text-gray-700 space-y-2">
                    {formatRequirements(job.requirements).map((req, index) => (
                      <li key={index} className="leading-relaxed">{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional spacing for sticky behavior */}
              <div className="h-8"></div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="p-6 border-t bg-white">
            <button
              onClick={handleApplyClick}
              className="w-full bg-teal-500 text-white font-medium py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
            >
              Apply Now
              {job.url && <ExternalLink className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-content::-webkit-scrollbar {
          width: 6px;
        }
        .modal-content::-webkit-scrollbar-track {
          background: #f7fafc;
        }
        .modal-content::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
} 