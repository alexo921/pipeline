"use client";

import React, { useState } from "react";
import MobileMenu from "./MobileMenu";
import "../../styles/brand.css";
import AuthModal from "../AuthModal";
import Footer from "./Footer";
import Navbar from "./Navbar";

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
      {/* Navbar navigation */}

      {/* Mobile menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="flex-grow">{children}</main>
      {/* Main content */}

      {/* Footer */}
      {showFooter && <Footer />}
      {/* Footer */}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
