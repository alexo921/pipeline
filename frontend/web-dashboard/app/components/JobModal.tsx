'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Job } from '../types/job';

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
}

export default function JobModal({ job, onClose }: JobModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!job) return null;

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
        className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-semibold text-blue-600">{job.title}</h2>
              <p className="text-gray-600">{job.company}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {job.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${tag.type === 'primary' ? 'bg-blue-100 text-blue-800' : ''}
                    ${tag.type === 'secondary' ? 'bg-gray-100 text-gray-800' : ''}
                    ${tag.type === 'accent' ? 'bg-pink-100 text-pink-800' : ''}
                  `}
                >
                  {tag.label}
                </span>
              ))}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Overview</h3>
                <p className="text-gray-600">
                  {job.overview || "Community Focused. Care Driven."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="text-gray-900">{job.location}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Salary</dt>
                    <dd className="text-gray-900">{job.salary}</dd>
                  </div>
                  {job.hours && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Hours</dt>
                      <dd className="text-gray-900">{job.hours}</dd>
                    </div>
                  )}
                  {job.shift && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Shift</dt>
                      <dd className="text-gray-900">{job.shift}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {job.requirements && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-2">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t">
            <button
              onClick={() => console.log('Apply clicked')}
              className="w-full bg-teal-500 text-white font-medium py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 