"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import "../../styles/brand.css";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown } from "lucide-react";

type NavbarProps = {
  onLoginClick: () => void;
};

const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
}) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  async function onLogoutClick() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    logout();
    localStorage.removeItem("user");
    setIsUserDropdownOpen(false);
    router.push("/");
  }

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  return (
    <nav className="w-full">
      <div className="max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div
            className="bg-white rounded-[50px] shadow-[0px_0px_30.2px_rgba(0,0,0,0.1)] flex items-center justify-center"
            style={{ width: "200px", height: "50px", padding: "8px 20px" }}
          >
            <Image
              //   src="/images/yourpipelinelogo.png"
              src="/images/Frame-1894.svg"
              alt="Pipeline"
              width={200}
              height={50}
              priority
            />
          </div>
        </Link>

        {/* Right side user info */}
        {user ? (
          <div className="hidden md:flex items-center space-x-4">
            {/* User Icon with Dropdown */}
            <div className="relative">
              <button
                onClick={toggleUserDropdown}
                className="relative flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <User
                  className="w-6 h-6 text-[#01253F]"
                  strokeWidth={2}
                />
                {/* Online indicator dot */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                
                {/* Dropdown arrow */}
                <ChevronDown 
                  className={`absolute -bottom-6 w-4 h-4 text-slate-700 transition-transform duration-200 ${
                    isUserDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    {/* User Info */}
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">
                        {(user && user.firstName) ? `${user.firstName} ${user.lastName}` : user?.email || "Demo User"}
                      </div>
                    </div>
                    
                    <button
                      onClick={onLogoutClick}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-avenir flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="text-sm font-medium transition-colors px-4 py-2 rounded-full text-slate-700 font-avenir"
          >
            Login
          </button>
        )}

        {/* Mobile sign in/sign out */}
        <div className="md:hidden">
          {user ? (
            <button
              onClick={onLogoutClick}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 font-avenir px-3 py-2 rounded-full bg-white shadow-sm border"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 font-avenir px-3 py-2 rounded-full bg-white shadow-sm border"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isUserDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserDropdownOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
