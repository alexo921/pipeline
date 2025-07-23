'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Filter, ChevronDown, X, Clock, Building, Briefcase } from 'lucide-react';
import { Job, Tag, TagType } from '../types/job';

interface DynamicSearchBarProps {
  onSearch: (term: string) => void;
  onLocationChange: (location: string) => void;
  onFilterToggle: (filter: { label: string; type: TagType }) => void;
  jobs: Job[];
  searchTerm: string;
  locationInput: string;
  activeFilters: Tag[];
  isFiltersOpen: boolean;
  onFiltersToggle: () => void;
  filterOptions: {
    job_settings: string[];
    employment_types: string[];
    shifts: string[];
  };
}

interface SearchSuggestion {
  type: 'job_title' | 'job_setting' | 'employment_type' | 'shift' | 'location' | 'company';
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
    const allSuggestions: SearchSuggestion[] = [];

    // Predefined healthcare role suggestions
    const healthcareRoles = [
      // Nurse roles
      { label: 'RN', description: 'Registered Nurse', type: 'job_title' as const },
      { label: 'LPN', description: 'Licensed Practical Nurse', type: 'job_title' as const },
      { label: 'Registered Nurse', description: 'RN', type: 'job_title' as const },
      { label: 'Licensed Practical Nurse', description: 'LPN', type: 'job_title' as const },
      { label: 'Nurse', description: 'Nursing Position', type: 'job_title' as const },
      
      // CNA and Assistant roles
      { label: 'CNA', description: 'Certified Nursing Assistant', type: 'job_title' as const },
      { label: 'Certified Nursing Assistant', description: 'CNA', type: 'job_title' as const },
      { label: 'Nursing Assistant', description: 'CNA', type: 'job_title' as const },
      { label: 'Caregiver', description: 'Personal Care', type: 'job_title' as const },
      { label: 'HHA', description: 'Home Health Aide', type: 'job_title' as const },
      { label: 'Home Health Aide', description: 'HHA', type: 'job_title' as const },
      
      // Therapist roles
      { label: 'PT', description: 'Physical Therapist', type: 'job_title' as const },
      { label: 'OT', description: 'Occupational Therapist', type: 'job_title' as const },
      { label: 'ST', description: 'Speech Therapist', type: 'job_title' as const },
      { label: 'RT', description: 'Respiratory Therapist', type: 'job_title' as const },
      { label: 'Physical Therapist', description: 'PT', type: 'job_title' as const },
      { label: 'Occupational Therapist', description: 'OT', type: 'job_title' as const },
      { label: 'Speech Therapist', description: 'ST', type: 'job_title' as const },
      { label: 'Respiratory Therapist', description: 'RT', type: 'job_title' as const },
      
      // Management roles
      { label: 'Nurse Manager', description: 'Management', type: 'job_title' as const },
      { label: 'Director of Nursing', description: 'DON', type: 'job_title' as const },
      { label: 'DON', description: 'Director of Nursing', type: 'job_title' as const },
      { label: 'Supervisor', description: 'Management', type: 'job_title' as const },
      { label: 'Coordinator', description: 'Management', type: 'job_title' as const }
    ];

    // Add healthcare role suggestions that match input
    healthcareRoles.forEach(role => {
      if (role.label.toLowerCase().includes(inputLower) || 
          (role.description && role.description.toLowerCase().includes(inputLower))) {
        allSuggestions.push({
          type: role.type,
          label: role.label,
          icon: <Briefcase className="w-4 h-4" />,
          description: role.description
        });
      }
    });

    // Job titles (from actual job data)
    const jobTitles = Array.from(new Set(jobs.map(job => job.title))).filter(title => 
      title.toLowerCase().includes(inputLower)
    );
    jobTitles.forEach(title => {
      allSuggestions.push({
        type: 'job_title',
        label: title,
        icon: <Briefcase className="w-4 h-4" />
      });
    });

    // Job settings (from tags)
    const jobSettings = Array.from(new Set(
      jobs.flatMap(job => 
        (job.tags || []).filter(tag => tag.type === 'job_setting').map(tag => tag.label)
      )
    )).filter(setting => setting.toLowerCase().includes(inputLower));
    jobSettings.forEach(setting => {
      allSuggestions.push({
        type: 'job_setting',
        label: setting,
        icon: <Building className="w-4 h-4" />,
        description: 'Job Setting'
      });
    });

    // Employment types (from tags)
    const employmentTypes = Array.from(new Set(
      jobs.flatMap(job => 
        (job.tags || []).filter(tag => tag.type === 'employment_type').map(tag => tag.label)
      )
    )).filter(type => type.toLowerCase().includes(inputLower));
    employmentTypes.forEach(type => {
      allSuggestions.push({
        type: 'employment_type',
        label: type,
        icon: <Clock className="w-4 h-4" />,
        description: 'Employment Type'
      });
    });

    // Shift suggestions (predefined and from tags)
    const shiftSuggestions = [
      // Time-based shifts
      { label: '7AM-3PM', description: 'Morning Shift', type: 'shift' as const },
      { label: '3PM-11PM', description: 'Afternoon Shift', type: 'shift' as const },
      { label: '11PM-7AM', description: 'Night Shift', type: 'shift' as const },
      { label: '6AM-2PM', description: 'Early Morning', type: 'shift' as const },
      { label: '2PM-10PM', description: 'Evening Shift', type: 'shift' as const },
      { label: '10PM-6AM', description: 'Overnight', type: 'shift' as const },
      { label: '8AM-4PM', description: 'Day Shift', type: 'shift' as const },
      { label: '4PM-12AM', description: 'Late Afternoon', type: 'shift' as const },
      { label: '12AM-8AM', description: 'Graveyard', type: 'shift' as const },
      { label: '9AM-5PM', description: 'Business Hours', type: 'shift' as const },
      { label: '5PM-1AM', description: 'Late Evening', type: 'shift' as const },
      { label: '1AM-9AM', description: 'Early Morning', type: 'shift' as const },
      { label: '7AM-7PM', description: '12-Hour Day', type: 'shift' as const },
      { label: '7PM-7AM', description: '12-Hour Night', type: 'shift' as const },
      { label: '6AM-6PM', description: '12-Hour Day', type: 'shift' as const },
      { label: '6PM-6AM', description: '12-Hour Night', type: 'shift' as const },
      { label: '8AM-8PM', description: '12-Hour Day', type: 'shift' as const },
      { label: '8PM-8AM', description: '12-Hour Night', type: 'shift' as const },
      
      // General shift terms
      { label: 'Morning', description: 'Morning Shift', type: 'shift' as const },
      { label: 'Afternoon', description: 'Afternoon Shift', type: 'shift' as const },
      { label: 'Evening', description: 'Evening Shift', type: 'shift' as const },
      { label: 'Night', description: 'Night Shift', type: 'shift' as const },
      { label: 'Overnight', description: 'Overnight Shift', type: 'shift' as const },
      { label: 'Day Shift', description: 'Day Shift', type: 'shift' as const },
      { label: 'Night Shift', description: 'Night Shift', type: 'shift' as const },
      { label: 'Graveyard', description: 'Graveyard Shift', type: 'shift' as const },
      
      // Duration-based shifts
      { label: '12-Hour Shift', description: '12-Hour Shift', type: 'shift' as const },
      { label: '8-Hour Shift', description: '8-Hour Shift', type: 'shift' as const },
      { label: '10-Hour Shift', description: '10-Hour Shift', type: 'shift' as const },
      { label: '16-Hour Shift', description: '16-Hour Shift', type: 'shift' as const },
      
      // Alternative formats
      { label: '7A-3P', description: 'Morning Shift', type: 'shift' as const },
      { label: '3P-11P', description: 'Afternoon Shift', type: 'shift' as const },
      { label: '11P-7A', description: 'Night Shift', type: 'shift' as const },
      { label: '6A-2P', description: 'Early Morning', type: 'shift' as const },
      { label: '2P-10P', description: 'Evening Shift', type: 'shift' as const },
      { label: '10P-6A', description: 'Overnight', type: 'shift' as const },
      { label: '8A-4P', description: 'Day Shift', type: 'shift' as const },
      { label: '4P-12A', description: 'Late Afternoon', type: 'shift' as const },
      { label: '12A-8A', description: 'Graveyard', type: 'shift' as const },
      { label: '9A-5P', description: 'Business Hours', type: 'shift' as const },
      { label: '5P-1A', description: 'Late Evening', type: 'shift' as const },
      { label: '1A-9A', description: 'Early Morning', type: 'shift' as const },
      { label: '7A-7P', description: '12-Hour Day', type: 'shift' as const },
      { label: '7P-7A', description: '12-Hour Night', type: 'shift' as const },
      { label: '6A-6P', description: '12-Hour Day', type: 'shift' as const },
      { label: '6P-6A', description: '12-Hour Night', type: 'shift' as const },
      { label: '8A-8P', description: '12-Hour Day', type: 'shift' as const },
      { label: '8P-8A', description: '12-Hour Night', type: 'shift' as const }
    ];

    // Add shift suggestions that match input
    shiftSuggestions.forEach(shift => {
      if (shift.label.toLowerCase().includes(inputLower) || 
          (shift.description && shift.description.toLowerCase().includes(inputLower))) {
        allSuggestions.push({
          type: shift.type,
          label: shift.label,
          icon: <Clock className="w-4 h-4" />,
          description: shift.description
        });
      }
    });

    // Shifts from actual job tags
    const jobShifts = Array.from(new Set(
      jobs.flatMap(job => 
        (job.tags || []).filter(tag => tag.type === 'shift').map(tag => tag.label)
      )
    )).filter(shift => shift.toLowerCase().includes(inputLower));
    jobShifts.forEach(shift => {
      allSuggestions.push({
        type: 'shift',
        label: shift,
        icon: <Clock className="w-4 h-4" />,
        description: 'Shift'
      });
    });

    // Companies
    const companies = Array.from(new Set(jobs.map(job => job.company))).filter(company => 
      company.toLowerCase().includes(inputLower)
    );
    companies.forEach(company => {
      allSuggestions.push({
        type: 'company',
        label: company,
        icon: <Building className="w-4 h-4" />,
        description: 'Company'
      });
    });

    // Locations
    const locations = Array.from(new Set(jobs.map(job => job.location))).filter(location => 
      location.toLowerCase().includes(inputLower)
    );
    locations.forEach(location => {
      allSuggestions.push({
        type: 'location',
        label: location,
        icon: <MapPin className="w-4 h-4" />,
        description: 'Location'
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
                placeholder="Search jobs, shifts, locations..."
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