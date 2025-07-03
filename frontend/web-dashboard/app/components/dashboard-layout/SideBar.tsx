"use client";

import React, { useState } from "react";
import { LayoutDashboard, Bell, Briefcase, Users } from "lucide-react";

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("Dashboard");

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Notifications", icon: Bell },
    { name: "Jobs", icon: Briefcase },
    { name: "Applicants", icon: Users },
  ];

  return (
    <div className="w-64 bg-[#FFFFFF66] h-100% border-none border-gray-200 flex flex-col py-8 px-4">
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.name;

            return (
              <li key={item.name}>
                <button
                  onClick={() => setActiveItem(item.name)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all font-medium gap-3
                    ${
                      isActive
                        ? "bg-[#E6F0FF] text-[#0057D9]"
                        : "text-[#0F172A] hover:bg-[#EDF3FF] hover:text-[#0057D9]"
                    }`}
                >
                  <Icon
                    size={20}
                    className={`${
                      isActive
                        ? "text-[#0057D9]"
                        : "text-[#0F172A] group-hover:text-[#0057D9]"
                    }`}
                  />
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
