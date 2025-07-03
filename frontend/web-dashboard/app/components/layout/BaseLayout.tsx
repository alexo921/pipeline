"use client";

import React, { useState, useEffect } from "react";
import MobileMenu from "./MobileMenu";
import "../../styles/brand.css";
import AuthModal from "../AuthModal";
import Footer from "./Footer";
import Navbar from "./Navbar";
import BaseAuthModal from "../BaseAuthModal";

interface BaseLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  showFooter?: boolean;
  customBackground?: string;
}

export default function BaseLayout({
  children,
  showNav = true,
  showFooter = true,
  customBackground,
}: BaseLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { registerLoginModalTrigger } = useAuth();

  useEffect(() => {
    registerLoginModalTrigger(() => setIsAuthModalOpen(true));
  }, [registerLoginModalTrigger]);

  const backgroundStyle = customBackground
    ? { background: customBackground }
    : {};

  const backgroundClass = customBackground
    ? "min-h-screen flex flex-col"
    : "min-h-screen flex flex-col bg-[#F4F4F4]";

  return (
    <div className={`${backgroundClass} relative`} style={backgroundStyle}>
      {/* Bottom Blur Effect */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '0%',
          left: '45%',
          transform: 'translateX(-50%)',
          width: '1200px',
          height: '550px',
          background: `linear-gradient(to top,
            rgba(36, 102, 208, 0.4) 0%, 
            rgba(36, 102, 208, 0.25) 30%, 
            rgba(36, 102, 208, 0.1) 60%, 
            transparent 100%)`,
          filter: 'blur(40px)',
          zIndex: 5,
        }}
      />
      
      {/* Navbar navigation */}
      {showNav && (
        <Navbar
          onLoginClick={() => setIsAuthModalOpen(true)}
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
        />
      )}
      {/* Navbar navigation */}

      {/* Mobile menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="flex-grow relative z-10">{children}</main>
      {/* Main content */}

      {/* Footer */}
      {showFooter && <div className="relative z-10"><Footer /></div>}
      {/* Footer */}

      {/* <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      /> */}
      <BaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
