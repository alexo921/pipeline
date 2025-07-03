"use client";

import React from "react";
import "../styles/brand.css";

export default function UserDashboardPage() {
  return (
    <div className="p-6 w-full bg-[#F4F5FF] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-900">
          Welcome to Your Dashboard
        </h1>

        {/* Cards Row */}
        <div className="flex flex-wrap gap-6 justify-start">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-sm w-[200px] h-[200px] flex flex-col justify-center items-center text-center">
            <div className="baloo-number text-[#0071DC] mb-1">12</div>
            <div className="dashboard-label">Open Jobs</div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl shadow-sm w-[200px] h-[200px] flex flex-col justify-center items-center text-center">
            <div className="baloo-number text-[#0071DC] mb-1">4</div>
            <div className="dashboard-label">New Matches</div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl shadow-sm w-[200px] h-[200px] flex flex-col justify-center items-center text-center">
            <div className="baloo-number text-[#0071DC] mb-1">28</div>
            <div className="dashboard-label">Interest Applicant</div>
          </div>
        </div>
      </div>
    </div>
  );
}
