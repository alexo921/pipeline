"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2 } from 'lucide-react';

const AdminDashboardNav: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="bg-blue-50 border-b border-blue-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-800">Admin Navigation:</span>
          </div>
          
          <div className="flex space-x-4">
            <Link
              href="/my-pipeline"
              className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                isActive('/my-pipeline')
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-700 hover:bg-blue-100'
              }`}
            >
              <img src="/user_icon.svg" alt="User" className="w-4 h-4" />
              <span>Employee Dashboard</span>
            </Link>
            
            <Link
              href="/your-pipeline"
              className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                isActive('/your-pipeline')
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Employer Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardNav;
