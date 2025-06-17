'use client';

import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import Image from 'next/image';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface JobCardProps {
  title: string;
  facilityType: string;
  location: string;
  companyLogo?: string;
  applyUrl: string;
  onSave?: (jobId: string) => void;
  jobId: string;
  isSaved?: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  type?: string;
  postedAt?: string;
}

function formatSalary(min: number, max: number, currency: string, period: string) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  return `${formatter.format(min)} - ${formatter.format(max)} per ${period}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function JobCard({
  title,
  facilityType,
  location,
  companyLogo,
  applyUrl,
  onSave,
  jobId,
  isSaved = false,
  salary,
  type,
  postedAt,
}: JobCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    onSave?.(jobId);
  };

  return (
    <div ref={targetRef as React.RefObject<HTMLDivElement>}>
      {isIntersecting && (
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <div className="relative rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {companyLogo && (
                    <div className="mb-4">
                      <Image
                        src={companyLogo}
                        alt="Company logo"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                        loading="lazy"
                        sizes="(max-width: 768px) 48px, 48px"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-indigo-700">
                    {title}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">{facilityType}</p>
                    <p className="text-sm text-gray-600">{location}</p>
                    {salary && (
                      <p className="text-sm font-medium text-gray-900">
                        {formatSalary(
                          salary.min,
                          salary.max,
                          salary.currency,
                          salary.period
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                  aria-label={saved ? "Remove from saved jobs" : "Save job"}
                >
                  {saved ? (
                    <HeartSolidIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {type && (
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                    {type}
                  </span>
                )}
                {postedAt && (
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
                    Posted {formatDate(postedAt)}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <button
                  className="w-full rounded-lg bg-teal-500 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(applyUrl, '_blank');
                  }}
                >
                  See More
                </button>
              </div>
            </div>
          </div>
        </a>
      )}
    </div>
  );
} 