"use client";

import React from "react";
import "../styles/brand.css";
import DashboardCard from "../components/dashboard-layout/card";

export default function UserDashboardPage() {
  const cardsData = [
    { number: 12, label: "Open Jobs" },
    { number: 4, label: "New Matches" },
    { number: 28, label: "Interest Applicant" },
  ];
  return (
    <div className="p-6 w-full bg-[#F4F5FF] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-900">
          Welcome to Your Dashboard
        </h1>
        <div className="flex flex-wrap gap-6 justify-start">
          {cardsData.map((card, index) => (
            <DashboardCard
              key={index}
              number={card.number}
              label={card.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
