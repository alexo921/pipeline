"use client";

import React, { useState } from "react";
import "../../styles/brand.css";
import Navbar from "./CandidateNavbar";

interface BaseLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  showFooter?: boolean;
  customBackground?: string;
}

export default function DashboardLayout({
  children,
  showNav = true,
  showFooter = true,
  customBackground,
}: BaseLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const backgroundStyle = customBackground
    ? { background: customBackground }
    : {};

  const backgroundClass = customBackground
    ? "min-h-screen flex flex-col"
    : "min-h-screen flex flex-col bg-tertiary";

  return (
    <div className={backgroundClass} style={backgroundStyle}>
      {/* Navbar navigation */}
      {showNav && (
        <Navbar
          onLoginClick={() => setIsAuthModalOpen(true)}
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
        />
      )}

      {/* Main content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      {/* {showFooter && <Footer />} */}
    </div>
  );
}
