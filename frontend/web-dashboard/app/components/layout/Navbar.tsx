"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown } from "lucide-react";

type NavbarProps = {
  onLoginClick: () => void;
};

const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
}) => {
  const pathname = usePathname();
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
    <>
      <nav className="w-full bg-[#F4F4F4]">
        <div className="max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between">
          {/* Pipeline Logo with rounded white background */}
          <Link href="/" className="flex items-center">
            <div
              className="bg-white rounded-[50px] shadow-[0px_0px_30.2px_rgba(0,0,0,0.1)] flex items-center justify-center"
              style={{
                width: "200px",
                height: "50px",
                padding: "6px 12px",
              }}
            >
              {/* Combined logo: P icon + wordmark */}
              <Image
                src="/images/pipeline_logo_p.png"
                alt="Pipeline P"
                width={38}
                height={38}
                style={{ marginRight: 12 }}
                priority
              />
              <Image
                src="/images/pipeline_logo.png"
                alt="Pipeline Wordmark"
                width={120}
                height={38}
                priority
              />
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {/* Navigation items in white circular container */}
            <div className="flex items-center space-x-6 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-200">
              <Link
                href="/jobs"
                className={`text-sm font-medium transition-colors px-4 py-2 rounded-full font-avenir ${
                  pathname === "/jobs"
                    ? "bg-[#01253F] text-white"
                    : "text-slate-700"
                }`}
              >
                Find Jobs
              </Link>

              {/* User Icon with Dropdown or Login Button */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      {/* User Info */}
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">
                          {(user && user.firstName) ? `${user.firstName} ${user.lastName}` : user?.email || "Demo User"}
                        </div>
                      </div>
                      
                      {/* Sign Out Option */}
                      <button
                        onClick={onLogoutClick}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="text-sm font-medium transition-colors px-4 py-2 rounded-full text-slate-700 font-avenir"
                >
                  Login
                </button>
              )}
            </div>
          </div>

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
      </nav>

      {/* Click outside to close dropdown */}
      {isUserDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserDropdownOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
