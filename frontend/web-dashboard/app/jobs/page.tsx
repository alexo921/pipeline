'use client';

import { useEffect, useState } from 'react';
import JobCard from '../components/JobCard';
import JobCardSkeleton from '../components/JobCardSkeleton';
import JobSearch from '../components/JobSearch';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface Job {
  id: string;
  title: string;
  facilityType: string;
  location: string;
  companyLogo: string;
  applyUrl: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  type: string;
  postedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalJobs: number;
  totalPages: number;
  hasMore: boolean;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px',
  });

  const loadMoreJobs = async () => {
    try {
      console.log('Loading more jobs...');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        ...(searchTerm && { search: searchTerm }),
        ...(locationFilter && { location: locationFilter }),
      });

      console.log('Fetching jobs with params:', queryParams.toString());
      const response = await fetch(`/api/jobs?${queryParams}`);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Received jobs data:', data);

      if (!data.jobs || !Array.isArray(data.jobs)) {
        throw new Error('Invalid jobs data received');
      }

      setJobs((prevJobs) => {
        console.log('Previous jobs:', prevJobs);
        console.log('New jobs to add:', data.jobs);
        return [...prevJobs, ...data.jobs];
      });
      setHasMore(data.pagination.hasMore);
      setPage((prevPage) => prevPage + 1);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string, location: string) => {
    console.log('Search triggered:', { search, location });
    setSearchTerm(search);
    setLocationFilter(location);
    setJobs([]);
    setPage(1);
    setHasMore(true);
  };

  // Initial load
  useEffect(() => {
    console.log('Initial load effect running');
    loadMoreJobs();
  }, []); // Empty dependency array for initial load

  // Handle search changes
  useEffect(() => {
    console.log('Search/location changed:', { searchTerm, locationFilter });
    setJobs([]);
    setPage(1);
    setHasMore(true);
    loadMoreJobs();
  }, [searchTerm, locationFilter]);

  // Handle infinite scroll
  useEffect(() => {
    console.log('Intersection observer effect:', { isIntersecting, hasMore });
    if (isIntersecting && hasMore && !loading) {
      loadMoreJobs();
    }
  }, [isIntersecting]);

  // Test component to verify Tailwind CSS
  const TestComponent = () => (
    <div className="p-4 m-4 bg-blue-500 text-white rounded-lg shadow-lg">
      This is a test component with Tailwind CSS
    </div>
  );

  return (
    <main className="min-h-screen bg-page-gradient py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-indigo-900 sm:text-5xl">
            Healthcare Jobs
          </h1>
          <p className="mt-3 text-lg text-indigo-600">
            Find your next career opportunity in healthcare
          </p>
        </div>

        {/* Test component */}
        <TestComponent />

        <div className="mt-8">
          <JobSearch onSearch={handleSearch} />
        </div>

        {error && (
          <div className="mt-8 rounded-md bg-red-50 p-4">
            <p className="text-center text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <>
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </>
          )}
          
          {!loading && jobs.map((job) => (
            <JobCard
              key={job.id}
              jobId={job.id}
              title={job.title}
              facilityType={job.facilityType}
              location={job.location}
              companyLogo={job.companyLogo}
              applyUrl={job.applyUrl}
              salary={job.salary}
              type={job.type}
              postedAt={job.postedAt}
              onSave={(jobId) => {
                console.log('Saving job:', jobId);
                // Implement save functionality
              }}
            />
          ))}
        </div>

        {/* Debug info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Loading: {loading ? 'true' : 'false'}</p>
          <p>Jobs count: {jobs.length}</p>
          <p>Has more: {hasMore ? 'true' : 'false'}</p>
          <p>Page: {page}</p>
        </div>

        {/* Infinite scroll trigger */}
        <div ref={targetRef as React.RefObject<HTMLDivElement>} className="h-10" />

        {!hasMore && jobs.length > 0 && (
          <p className="mt-8 text-center text-indigo-600">
            No more jobs to load. Check back later for new opportunities!
          </p>
        )}

        {!loading && jobs.length === 0 && !error && (
          <p className="mt-8 text-center text-indigo-600">
            No jobs found. Please try adjusting your search criteria.
          </p>
        )}
      </div>
    </main>
  );
} 