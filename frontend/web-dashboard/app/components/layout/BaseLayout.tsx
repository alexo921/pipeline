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
}

export default function BaseLayout({
  children,
  showNav = true,
  showFooter = true,
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
    : "min-h-screen flex flex-col bg-[#F4F4F4]";

  return (
    <div className={`${backgroundClass} relative`} style={backgroundStyle}>
      {/* Top-right radial blue blur positioned in upper right */}
      <div 
        className="absolute pointer-events-none hidden md:block"
        style={{
          top: '-5%',
          right: '-10%',
          width: '1522px',
          height: '2585px',
          backgroundImage: 'url(/blur.svg)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          zIndex: -1
        }}
      ></div>
      
      {/* Mobile-only blur effect - smaller and properly contained */}
      <div 
        className="absolute pointer-events-none md:hidden"
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
          zIndex: -1,
          overflow: 'hidden'
        }}
      ></div>

      {/* Navbar navigation */}
      {showNav && (
        <Navbar
          onLoginClick={handleLoginClick}
        />
      )}

      {/* Main content */}
      <div className="flex-1 relative" style={{ zIndex: 1 }}>
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
              zIndex: -1,
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
              zIndex: -1,
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
