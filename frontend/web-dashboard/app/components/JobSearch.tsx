'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';
import { Tag } from '../types/job';

interface JobSearchProps {
  onSearch: (term: string) => void;
  activeTags: Tag[];
  onTagToggle: (tag: Tag) => void;
}

export default function JobSearch({ onSearch, activeTags, onTagToggle }: JobSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  
  const locationRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFiltersDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleTagClick = (tag: Tag) => {
    onTagToggle(tag);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Board</h1>
      
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location Dropdown */}
          <div className="relative" ref={locationRef}>
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="w-full md:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span>Location</span>
              </div>
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {showLocationDropdown && (
              <div className="absolute z-10 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search locations..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                  />
                  <div className="mt-2 space-y-1">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                      New Haven, CT
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                      Boston, MA
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                      New York, NY
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters Dropdown */}
          <div className="relative" ref={filtersRef}>
            <button
              onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
              className="w-full md:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span>Filters</span>
              </div>
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {showFiltersDropdown && (
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="p-2">
                  <div className="space-y-2">
                    <div className="font-medium text-sm text-gray-900 px-3 py-2">
                      Job Type
                    </div>
                    <button
                      onClick={() => handleTagClick({ label: "Full-Time", type: "primary" })}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      Full-Time
                    </button>
                    <button
                      onClick={() => handleTagClick({ label: "Part-Time", type: "primary" })}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      Part-Time
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="font-medium text-sm text-gray-900 px-3 py-2">
                      Experience Level
                    </div>
                    <button
                      onClick={() => handleTagClick({ label: "Entry-Level", type: "accent" })}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      Entry Level
                    </button>
                    <button
                      onClick={() => handleTagClick({ label: "Mid-Level", type: "accent" })}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      Mid Level
                    </button>
                    <button
                      onClick={() => handleTagClick({ label: "Senior", type: "accent" })}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      Senior
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeTags.map((tag, index) => (
              <span
                key={index}
                className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer
                  ${tag.type === 'primary' ? 'bg-blue-100 text-blue-800' : ''}
                  ${tag.type === 'secondary' ? 'bg-gray-100 text-gray-800' : ''}
                  ${tag.type === 'accent' ? 'bg-pink-100 text-pink-800' : ''}
                `}
                onClick={() => handleTagClick(tag)}
              >
                {tag.label}
                <button className="ml-1.5 hover:text-gray-600">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 