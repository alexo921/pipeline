'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export default function MobileMenu({ isOpen, onClose, onLoginClick }: MobileMenuProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function onLogoutClick() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    logout();
    localStorage.removeItem("user");
    onClose();
    router.push("/");
  }

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

          {/* User section */}
          {user ? (
            <div className="px-4 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="relative flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                  <User className="w-5 h-5 text-gray-600" strokeWidth={2} />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 font-avenir">
                    {user.name || user.email || "User"}
                  </p>
                  <p className="text-xs text-gray-500">Signed in</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Navigation links */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            <Link
              href="/jobs"
              className="block text-base font-medium text-gray-900 hover:text-blue-600 font-avenir"
              onClick={onClose}
            >
              Find Jobs
            </Link>
            
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block text-base font-medium text-gray-900 hover:text-blue-600 font-avenir"
                  onClick={onClose}
                >
                  Dashboard
            </Link>
            <Link
              href="/saved"
              className="block text-base font-medium text-gray-900 hover:text-blue-600 font-avenir"
              onClick={onClose}
            >
                  Saved Jobs
            </Link>
            <Link
              href="/profile"
              className="block text-base font-medium text-gray-900 hover:text-blue-600 font-avenir"
              onClick={onClose}
            >
              Profile
            </Link>
              </>
            ) : null}
          </nav>

          {/* Auth section */}
          <div className="px-4 py-4 border-t border-gray-200">
            {user ? (
              <button
                onClick={onLogoutClick}
                className="w-full text-left text-base font-medium text-red-600 hover:text-red-700 font-avenir"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onLoginClick();
                }}
                className="w-full text-left text-base font-medium text-blue-600 hover:text-blue-700 font-avenir"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 