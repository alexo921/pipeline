"use client";

import React, { useState } from "react";
import "../../styles/brand.css";
import Navbar from "./CandidateNavbar";
import BaseAuthModal from "../BaseAuthModal";
import { useAuth } from "../../contexts/AuthContext";

interface BaseLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  backgroundImage?: string;
  backgroundStyle?: React.CSSProperties;
}

export default function DashboardLayout({
  children,
  showNav = true,
  backgroundImage,
  backgroundStyle,
}: BaseLayoutProps) {
  const { showLoginModal } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const backgroundClass = backgroundImage
    ? "min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
    : "min-h-screen flex flex-col bg-tertiary";

  return (
    <div className={backgroundClass} style={backgroundStyle}>
      {/* Navbar navigation */}
      {showNav && (
        <Navbar
          onLoginClick={handleLoginClick}
        />
      )}

      {/* Main content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Auth Modal */}
      <BaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
      />
    </div>
  );
}
