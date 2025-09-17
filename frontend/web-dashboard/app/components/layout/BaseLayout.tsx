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
}

export default function BaseLayout({
  children,
  showNav = true,
  showFooter = true,
  backgroundImage,
  backgroundStyle,
  navBackgroundClassName,
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

  return (
    <div className={`${backgroundClass} relative`} style={{...backgroundStyle, minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      {/* Top-right radial blue blur - contained and safe */}
      <div 
        className="absolute pointer-events-none hidden md:block overflow-hidden"
        style={{
          top: '15%',
          right: '-50px',
          width: '400px',
          height: '1000px',
          background: `
            radial-gradient(
              ellipse at center,
              rgba(36, 102, 208, 0.5) 0%,
              rgba(36, 102, 208, 0.4) 20%,
              rgba(36, 102, 208, 0.3) 40%,
              rgba(36, 102, 208, 0.2) 60%,
              rgba(36, 102, 208, 0.15) 70%,
              rgba(255, 0, 229, 0.15) 75%,
              rgba(255, 0, 229, 0.12) 80%,
              rgba(255, 0, 229, 0.1) 85%,
              rgba(255, 0, 229, 0.08) 90%,
              transparent 95%
            )
          `,
          filter: 'blur(80px)',
          zIndex: 0
        }}
      ></div>
      
      {/* Mobile-only blur effect - smaller and properly contained */}
      <div 
        className="absolute pointer-events-none md:hidden overflow-hidden"
        style={{
          top: '0',
          right: '0',
          width: '150px',
          height: '200px',
          background: `
            radial-gradient(
              ellipse at center,
              rgba(36, 102, 208, 0.1) 0%,
              rgba(36, 102, 208, 0.05) 40%,
              transparent 70%
            )
          `,
          filter: 'blur(30px)',
          zIndex: 0
        }}
      ></div>

      {/* Navbar navigation */}
      {showNav && (
        <div style={{ zIndex: 20 }}>
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
        <div className="relative z-10">
          {/* Pink/Blue Sun Radial Blur Effect - Desktop */}
          <div
            className="absolute pointer-events-none hidden md:block"
            style={{
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '1400px',
              height: '400px',
              background: `
                radial-gradient(
                  ellipse at center bottom,
                  rgba(36, 102, 208, 0.5) 0%,
                  rgba(36, 102, 208, 0.4) 15%,
                  rgba(36, 102, 208, 0.3) 30%,
                  rgba(36, 102, 208, 0.2) 45%,
                  rgba(36, 102, 208, 0.1) 60%,
                  rgba(255, 0, 229, 0.08) 75%,
                  transparent 90%
                )
              `,
              filter: 'blur(80px)',
              zIndex: 0,
            }}
          />
          
          {/* Pink/Blue Sun Radial Blur Effect - Mobile */}
          <div
            className="absolute pointer-events-none md:hidden"
            style={{
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '500px',
              height: '400px',
              background: `
                radial-gradient(
                  ellipse at center bottom,
                  rgba(36, 102, 208, 0.45) 0%,
                  rgba(36, 102, 208, 0.35) 20%,
                  rgba(36, 102, 208, 0.25) 40%,
                  rgba(36, 102, 208, 0.15) 60%,
                  rgba(255, 0, 229, 0.06) 80%,
                  transparent 95%
                )
              `,
              filter: 'blur(60px)',
              zIndex: 0,
            }}
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
