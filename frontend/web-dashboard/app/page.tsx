import React from 'react';
import Link from 'next/link';
import { Building2, User, Search } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Find Your Perfect Long-Term Care Job
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Pipeline connects healthcare professionals with the best long-term care opportunities. 
            Whether you're a CNA, LPN, RN, or caregiver, we have the right position for you.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/jobs"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="w-5 h-5 mr-2" />
              Find Jobs
            </Link>
            <Link
              href="/employee-intake"
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <User className="w-5 h-5 mr-2" />
              Find Work
            </Link>
            <Link
              href="/employer-intake"
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Hire Talent
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
