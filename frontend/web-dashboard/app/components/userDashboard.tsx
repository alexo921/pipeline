"use client";

import React, { useState } from "react";
import { Bell, Briefcase, Users, BarChart3 } from "lucide-react";

const UserDashboard = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const logout = () => {
    alert("Logged out successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5fd] to-[#e7ebf5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">
              YourPipeline
            </span>
          </div>

          {/* Profile Dropdown */}
          <div className="relative flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
              <span className="text-gray-700">St. Mary's Hospital</span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400 cursor-pointer"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              onClick={toggleDropdown}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <ul className="py-1">
                  <li
                    className="px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-100"
                    onClick={logout}
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        {/* <div className="w-full lg:w-64 bg-white border-r border-gray-200 min-h-screen lg:block hidden">
          <nav className="p-4 space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg">
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <Briefcase className="w-5 h-5" />
              <span>Jobs</span>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <Users className="w-5 h-5" />
              <span>Applicants</span>
            </div>
          </nav>
        </div> */}

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="text-2xl font-semibold text-gray-900 mb-6">
            User Dashboard
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Profile Section */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  My Profile
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Full Name</span>
                    <span className="text-gray-900">John Doe</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="text-gray-900">john.doe@example.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Phone</span>
                    <span className="text-gray-900">+1234567890</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Applications Section */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  My Applications
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Applied For</span>
                    <span className="text-gray-900">Software Engineer</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Application Status</span>
                    <span className="text-green-600">Accepted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Right */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Notifications */}
              {/* <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <button className="text-blue-600 text-sm">See All</button>
                </div>
                <div className="text-gray-600 text-sm">12 Unread Messages</div>
              </div> */}

              {/* Account Settings */}
              {/* <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Account Settings
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Change Password</span>
                    <button className="text-blue-600 text-sm">Change</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Update Email</span>
                    <button className="text-blue-600 text-sm">Update</button>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
