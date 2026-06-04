"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown, BarChart3, FileText, LayoutDashboard, Users } from "lucide-react";

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
  const company = useCompany();
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

  return (
    <>
      <nav className={`w-full ${backgroundClassName}`}>
        <div className="max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {company.logoType === 'text' ? (
              <div
                className="bg-white rounded-[50px] shadow-[0px_0px_30.2px_rgba(0,0,0,0.1)] flex items-center justify-center px-5"
                style={{ height: "50px", minWidth: "200px" }}
              >
                <span
                  className="font-bold text-base tracking-tight"
                  style={{ color: company.primaryColor }}
                >
                  {company.logoText ?? company.name}
                </span>
                {company.isPoweredByPipeline && (
                  <span className="ml-2 text-[10px] text-gray-400 font-normal whitespace-nowrap">
                    by Pipeline
                  </span>
                )}
              </div>
            ) : (
              <div
                className="bg-white rounded-[50px] shadow-[0px_0px_30.2px_rgba(0,0,0,0.1)] flex items-center justify-center"
                style={{ width: "200px", height: "50px", padding: "6px 12px" }}
              >
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
            )}
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-6">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: company.navyColor }}
                    >
                      <img src="/user_icon.svg" alt="User" className="w-5 h-5" />
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-50 border">
                      {/* Employer dashboard — visible to EMPLOYER and ADMIN */}
                      {(user.role === 'EMPLOYER' || user.role === 'ADMIN') && (
                        <Link
                          href="/my-pipeline"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>My Pipeline</span>
                        </Link>
                      )}
                      {/* Candidate dashboard — visible to CANDIDATE */}
                      {user.role === 'CANDIDATE' && (
                        <Link
                          href="/your-pipeline"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Users className="w-4 h-4" />
                          <span>Your Pipeline</span>
                        </Link>
                      )}
                      {/* Analytics — visible to EMPLOYER and ADMIN */}
                      {(user.role === 'EMPLOYER' || user.role === 'ADMIN') && (
                        <Link
                          href="/analytics"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span>Analytics</span>
                        </Link>
                      )}
                      {/* Intake Forms — ADMIN only */}
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
                  className="text-sm font-medium font-avenir px-4 py-2 rounded-full text-slate-700 transition-colors hover:bg-[#8AADFC] hover:text-white"
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
                className="text-sm font-medium font-avenir px-3 py-2 rounded-full bg-white shadow-sm border text-slate-700 transition-colors hover:bg-[#8AADFC] hover:text-white"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

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
