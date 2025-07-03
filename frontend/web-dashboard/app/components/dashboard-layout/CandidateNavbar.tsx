"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import "../../styles/brand.css";
import { useRouter } from "next/navigation";

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
              src="images/Frame-1894.svg"
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

              {/* Logout Button */}
              <button onClick={onLogoutClick} className="logout-button-custom">
                Logout
              </button>
            </div>
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
