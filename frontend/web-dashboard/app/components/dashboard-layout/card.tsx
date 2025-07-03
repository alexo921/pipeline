// components/DashboardCard.tsx
import React from "react";

type DashboardCardProps = {
  number: number | string;
  label: string;
};

const DashboardCard: React.FC<DashboardCardProps> = ({ number, label }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm w-[200px] h-[200px] flex flex-col justify-center items-center text-center">
      <div className="baloo-number text-[#0071DC] mb-1">{number}</div>
      <div className="dashboard-label">{label}</div>
    </div>
  );
};

export default DashboardCard;
