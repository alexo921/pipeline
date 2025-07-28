'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Filter, ChevronDown, X, Clock, Building, Briefcase, DollarSign, Tag, CheckCircle } from 'lucide-react';
import { Job, Tag as JobTag, TagType } from '../types/job';

interface DynamicSearchBarProps {
  onSearch: (term: string) => void;
  onLocationChange: (location: string) => void;
  onFilterToggle: (filter: { label: string; type: TagType }) => void;
  jobs: Job[];
  searchTerm: string;
  locationInput: string;
  activeFilters: JobTag[];
  isFiltersOpen: boolean;
  onFiltersToggle: () => void;
  filterOptions: {
    job_settings: string[];
    employment_types: string[];
    shifts: string[];
  };
}

interface SearchSuggestion {
  type: 'job_setting' | 'employment_type' | 'shift' | 'job_title' | 'location' | 'company' | 'salary' | 'tag' | 'tag_type' | 'requirement';
  label: string;
  icon: React.ReactNode;
  description?: string;
}



export default function DynamicSearchBar({
  onSearch,
  onLocationChange,
  onFilterToggle,
  jobs,
  searchTerm,
  locationInput,
  activeFilters,
  isFiltersOpen,
  onFiltersToggle,
  filterOptions
}: DynamicSearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Generate all possible suggestions from job data
  const generateSuggestions = (input: string): SearchSuggestion[] => {
    if (!input.trim()) return [];
    
    const inputLower = input.toLowerCase();
    // Enhanced suggestions from actual job data
    const allSuggestions: SearchSuggestion[] = [];

    // Get all unique values from job data for suggestions
    const allJobTitles = Array.from(new Set(jobs.map(job => job.title)));
    const allCompanies = Array.from(new Set(jobs.map(job => job.company)));
    const allLocations = Array.from(new Set(jobs.map(job => job.location)));
    const allSalaries = Array.from(new Set(jobs.map(job => job.salary).filter(Boolean)));
    
    // Get all unique tag labels and types
    const allTagLabels = Array.from(new Set(
      jobs.flatMap(job => (job.tags || []).map(tag => tag.label))
    ));
    const allTagTypes = Array.from(new Set(
      jobs.flatMap(job => (job.tags || []).map(tag => tag.type))
    ));
    
    // Get all unique requirements
    const allRequirements = Array.from(new Set(
      jobs.flatMap(job => {
        if (Array.isArray(job.requirements)) {
          return job.requirements;
        } else if (typeof job.requirements === 'string') {
          return job.requirements.split(',').map(req => req.trim());
        }
        return [];
      })
    ));

    // Job titles matching input
    const matchingTitles = allJobTitles.filter(title => 
      title.toLowerCase().includes(inputLower)
    );
    matchingTitles.forEach(title => {
      allSuggestions.push({
        type: 'job_title',
        label: title,
        icon: <Briefcase className="w-4 h-4" />,
        description: 'Job Title'
      });
    });

    // Companies matching input
    const matchingCompanies = allCompanies.filter(company => 
      company.toLowerCase().includes(inputLower)
    );
    matchingCompanies.forEach(company => {
      allSuggestions.push({
        type: 'company',
        label: company,
        icon: <Building className="w-4 h-4" />,
        description: 'Company'
      });
    });

    // Locations matching input
    const matchingLocations = allLocations.filter(location => 
      location.toLowerCase().includes(inputLower)
    );
    matchingLocations.forEach(location => {
      allSuggestions.push({
        type: 'location',
        label: location,
        icon: <MapPin className="w-4 h-4" />,
        description: 'Location'
      });
    });

    // Salaries matching input
    const matchingSalaries = allSalaries.filter(salary => 
      salary.toLowerCase().includes(inputLower)
    );
    matchingSalaries.forEach(salary => {
      allSuggestions.push({
        type: 'salary',
        label: salary,
        icon: <DollarSign className="w-4 h-4" />,
        description: 'Salary'
      });
    });

    // Tag labels matching input
    const matchingTagLabels = allTagLabels.filter(label => 
      label.toLowerCase().includes(inputLower)
    );
    matchingTagLabels.forEach(label => {
      allSuggestions.push({
        type: 'tag',
        label: label,
        icon: <Tag className="w-4 h-4" />,
        description: 'Tag'
      });
    });

    // Tag types matching input
    const matchingTagTypes = allTagTypes.filter(type => 
      type.toLowerCase().includes(inputLower)
    );
    matchingTagTypes.forEach(type => {
      allSuggestions.push({
        type: 'tag_type',
        label: type,
        icon: <Tag className="w-4 h-4" />,
        description: 'Tag Type'
      });
    });

    // Requirements matching input
    const matchingRequirements = allRequirements.filter(req => 
      req.toLowerCase().includes(inputLower)
    );
    matchingRequirements.forEach(req => {
      allSuggestions.push({
        type: 'requirement',
        label: req,
        icon: <CheckCircle className="w-4 h-4" />,
        description: 'Requirement'
      });
    });

    // Remove duplicates and limit to top 10
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.label === suggestion.label)
    );

    return uniqueSuggestions.slice(0, 10);
  };

  // Update suggestions when search term changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(searchTerm);
    setSuggestions(newSuggestions);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(searchTerm.length > 0 && newSuggestions.length > 0);
  }, [searchTerm, jobs]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSearch(suggestion.label);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSuggestionBgColor = (type: SearchSuggestion['type'], isSelected: boolean) => {
    if (isSelected) return 'bg-blue-100';
    
    switch (type) {
      case 'job_title':
        return 'bg-gray-50';
      case 'job_setting':
        return 'bg-purple-50';
      case 'employment_type':
        return 'bg-blue-50';
      case 'shift':
        return 'bg-pink-50';
      case 'location':
        return 'bg-green-50';
      case 'company':
        return 'bg-yellow-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto" ref={searchRef}>
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={handleKeyDown}
                placeholder="Search Jobs"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
        </div>

        {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                    key={index}
                    type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 focus:outline-none ${getSuggestionBgColor(suggestion.type, index === selectedSuggestionIndex)}`}
                >
                    <div className="flex items-center gap-3">
                    {suggestion.icon}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{suggestion.label}</div>
                    {suggestion.description && (
                          <div className="text-sm text-gray-500">{suggestion.description}</div>
                        )}
                      </div>
                  </div>
                </button>
              ))}
            </div>
        )}
      </div>

      {/* Location Input */}
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={locationInput}
            onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Location (city, state)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
      </div>

          {/* Filters Button */}
        <button
          onClick={onFiltersToggle}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            {activeFilters.length > 0 && (
              <span className="bg-white text-blue-600 rounded-full px-2 py-1 text-xs font-medium">
                {activeFilters.length}
            </span>
            )}
        </button>
              </div>
              
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => onFilterToggle({ label: filter.label, type: filter.type })}
                  className="hover:bg-blue-200 rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 