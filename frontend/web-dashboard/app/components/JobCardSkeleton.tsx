'use client';

export default function JobCardSkeleton() {
  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
          </div>
          <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="mt-6">
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  );
} 