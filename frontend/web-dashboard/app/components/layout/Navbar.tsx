"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown, BarChart3, FileText } from "lucide-react";

type NavbarProps = {
  onLoginClick: () => void;
  backgroundClassName?: string;
};

const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
  backgroundClassName = "bg-[#F4F4F4]",
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
      <nav className={`w-full ${backgroundClassName}`}>
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

          <div className="hidden md:flex items-center space-x-6">
            {/* Plain text navigation (no container) */}
            <div className="flex items-center space-x-6">
              <Link
                href="/jobs"
                className={`text-sm font-medium transition-colors font-avenir hover:text-[#8AADFC] ${
                  pathname === "/jobs" ? "text-[#01253F]" : "text-slate-700"
                }`}
              >
                Find Jobs
              </Link>
              
              <Link
                href="/employer-intake"
                className={`text-sm font-medium transition-colors font-avenir hover:text-[#8AADFC] ${
                  pathname === "/employer-intake" ? "text-[#01253F]" : "text-slate-700"
                }`}
              >
                Hire Talent
              </Link>
              
              <Link
                href="/employee-intake"
                className={`text-sm font-medium transition-colors font-avenir hover:text-[#8AADFC] ${
                  pathname === "/employee-intake" ? "text-[#01253F]" : "text-slate-700"
                }`}
              >
                Find Work
              </Link>

              {/* User Icon with Dropdown or Login Button */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#01253F] rounded-full flex items-center justify-center">
                      <img src="/user_icon.svg" alt="User" className="w-5 h-5" />
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      {/* Analytics Dashboard (Admin Only) */}
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/analytics"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span>Analytics</span>
                        </Link>
                      )}
                      
                      {/* Intake Forms Dashboard (Admin Only) */}
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin/intake-forms"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <FileText className="w-4 h-4" />
                          <span>Intake Forms</span>
                        </Link>
                      )}
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
                  className="text-sm font-medium transition-colors text-slate-700 hover:text-[#8AADFC] font-avenir"
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
