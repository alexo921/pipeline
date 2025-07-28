"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import "../../styles/brand.css";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

type NavbarProps = {
  onLoginClick: () => void;
  onMobileMenuToggle: () => void;
};

const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
  onMobileMenuToggle,
}) => {
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
        {user || true ? (
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-200">
              {/* Username */}
              <span className="logout-button-custom">
                {(user && user.name) || "Demo User"}
              </span>

              {/* Sign Out Button */}
              <button onClick={onLogoutClick} className="logout-button-custom">
                Sign Out
              </button>
            </div>

            {/* Profile icon with online indicator */}
            <Link
              href="/dashboard"
              className="relative flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <User
                className="w-6 h-6 text-[#01253F]"
                strokeWidth={2}
              />
              {/* Online indicator dot */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </Link>
          </div>
        ) : null}

        {/* Mobile Menu Button */}
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
  );
};

export default Navbar;
