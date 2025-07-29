"use client";

import React, { useState, useEffect } from "react";
import "../../styles/brand.css";
import AuthModal from "../AuthModal";
import Footer from "./Footer";
import Navbar from "./Navbar";
import BaseAuthModal from "../BaseAuthModal";
import { useAuth } from "../../contexts/AuthContext";


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
      {/* Navbar navigation */}
      {showNav && (
        <Navbar
          onLoginClick={() => setIsAuthModalOpen(true)}
        />
      )}
      {/* Navbar navigation */}

      {/* Main content */}
      <main className="flex-grow relative z-10">{children}</main>
      {/* Main content */}

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
