'use client';

import React from 'react';
import Link from 'next/link';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25"
        onClick={onClose}
      />

      {/* Menu panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-avenir">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            <Link
              href="/jobs"
              className="block text-base font-medium text-gray-900 hover:text-blue-600 font-avenir"
              onClick={onClose}
            >
              Jobs
            </Link>
            <Link
              href="/saved"
              className="block text-base font-medium text-gray-900 hover:text-blue-600 font-avenir"
              onClick={onClose}
            >
              Saved
            </Link>
            <Link
              href="/profile"
              className="block text-base font-medium text-gray-900 hover:text-blue-600 font-avenir"
              onClick={onClose}
            >
              Profile
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
} 