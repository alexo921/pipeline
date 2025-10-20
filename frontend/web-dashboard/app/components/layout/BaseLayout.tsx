"use client";

import React, { useState } from "react";
import "../../styles/brand.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BaseAuthModal from "../BaseAuthModal";
import { useAuth } from "../../contexts/AuthContext";

interface BaseLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  showFooter?: boolean;
  backgroundImage?: string;
  backgroundStyle?: React.CSSProperties;
  navBackgroundClassName?: string;
  isBlurred?: boolean;
}

export default function BaseLayout({
  children,
  showNav = true,
  showFooter = true,
  backgroundImage,
  backgroundStyle,
  navBackgroundClassName,
  isBlurred = false,
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
    : "min-h-screen flex flex-col bg-[#F4F4F4]";

  const blurClass = isBlurred ? "blur-sm pointer-events-none transition duration-200" : "transition duration-200";

  return (
    <div className={`${backgroundClass} relative`} style={{...backgroundStyle, minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>

      {/* Navbar navigation */}
      {showNav && (
        <div className={blurClass}>
          <Navbar
            onLoginClick={handleLoginClick}
            backgroundClassName={navBackgroundClassName}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative" style={{ zIndex: 10 }}>
        {children}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className={`relative ${blurClass}`}>
          {/* Footer blur image - Desktop */}
          <img
            src="/footer_blur.svg"
            alt="Footer blur"
            className="absolute pointer-events-none hidden md:block left-1/2 -translate-x-1/2 w-[2100px] h-[600px] max-w-none"
            style={{ bottom: 0, zIndex: 0 }}
          />
          
          {/* Footer blur image - Mobile */}
          <img
            src="/footer_blur.svg"
            alt="Footer blur"
            className="absolute pointer-events-none md:hidden left-1/2 -translate-x-1/2 w-[750px] h-[450px] max-w-none"
            style={{ bottom: 0, zIndex: 0 }}
          />
          <Footer />
        </div>
      )}

      {/* Auth Modal */}
      <BaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
      />
    </div>
  );
}
