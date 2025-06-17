'use client';

import { MagnifyingGlassIcon, MapPinIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';
import debounce from 'lodash/debounce';

interface JobSearchProps {
  onSearch: (search: string, location: string) => void;
}

export default function JobSearch({ onSearch }: JobSearchProps) {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  const debouncedSearch = useCallback(
    debounce((search: string, location: string) => {
      onSearch(search, location);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value, location);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    debouncedSearch(search, e.target.value);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-4">
        <div className="flex flex-1 items-center gap-2">
          <MagnifyingGlassIcon className="h-5 w-5 text-indigo-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={handleSearchChange}
            className="w-full border-0 bg-transparent text-indigo-900 placeholder:text-indigo-400 focus:ring-0"
          />
        </div>
        <div className="flex h-px w-full bg-indigo-100 sm:h-8 sm:w-px" />
        <div className="flex flex-1 items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-indigo-400" />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={handleLocationChange}
            className="w-full border-0 bg-transparent text-indigo-900 placeholder:text-indigo-400 focus:ring-0"
          />
        </div>
        <button className="flex items-center justify-center rounded-lg bg-indigo-100 p-2 text-indigo-600 hover:bg-indigo-200">
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        </button>
      </div>
      {(search || location) && (
        <div className="mt-4 flex gap-2">
          {search && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
              {search}
              <button
                onClick={() => {
                  setSearch('');
                  debouncedSearch('', location);
                }}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          {location && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
              {location}
              <button
                onClick={() => {
                  setLocation('');
                  debouncedSearch(search, '');
                }}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
} 