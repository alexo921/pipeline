"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

type NavbarProps = {
  onLoginClick: () => void;
  onMobileMenuToggle: () => void; // Optional prop for mobile menu toggle
};

const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
  onMobileMenuToggle,
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  async function onLogoutClick() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    logout();
    localStorage.removeItem("user");

    router.push("/");
  }

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
                src="/pipeline_logo_p.png"
                alt="Pipeline P"
                width={38}
                height={38}
                style={{ marginRight: 12 }}
                priority
              />
              <Image
                src="/pipeline_logo.png"
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

              {user ? (
                <button
                  onClick={onLogoutClick}
                  className="text-sm font-medium transition-colors px-4 py-2 rounded-full text-slate-700 hover:text-blue-600 font-avenir"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="text-sm font-medium transition-colors px-4 py-2 rounded-full text-slate-700 font-avenir"
                >
                  Login
                </button>
              )}
            </div>

            {/* Enhanced Profile icon with user indicator */}
            {user ? (
              <div className="flex items-center space-x-3 bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200">
                {/* User indicator text */}
                <span className="text-sm text-slate-700 font-medium font-avenir">
                  {user.name || user.email || "User"}
                </span>
                
                {/* Profile icon with online indicator */}
                <Link
                  href="/dashboard"
                  className="relative flex items-center justify-center w-10 h-10 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <User
                    className="w-5 h-5 text-[#01253F]"
                    strokeWidth={2}
                  />
                  {/* Online indicator dot */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={onMobileMenuToggle}>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
