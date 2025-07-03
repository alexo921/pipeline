"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

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
              <Image
                src="/logo-full-color.svg"
                alt="Pipeline"
                width={160}
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
                  className="text-sm font-medium transition-colors px-4 py-2 rounded-full text-slate-700 hover:text-blue-600"
                >
                  Logout
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

            {/* Profile icon */}
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <svg
                  className="w-5 h-5 text-[#01253F]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
            ) : (
              false
            )}
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
