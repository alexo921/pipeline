import JobCardSkeleton from '../components/JobCardSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-64 animate-pulse rounded-lg bg-gray-200" />
          <div className="mx-auto mt-3 h-6 w-96 animate-pulse rounded-lg bg-gray-200" />
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <div className="h-16 animate-pulse rounded-lg bg-gray-200" />
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
} 