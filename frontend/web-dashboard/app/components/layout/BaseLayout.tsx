'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import MobileMenu from './MobileMenu';
import '../../styles/brand.css';
import AuthModal from '../AuthModal';

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
  customBackground
}: BaseLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pathname = usePathname();

  const backgroundStyle = customBackground
    ? { background: customBackground }
    : {};

  const backgroundClass = customBackground
    ? "min-h-screen flex flex-col"
    : "min-h-screen flex flex-col bg-tertiary";

  return (
    <div className={backgroundClass} style={backgroundStyle}>
      {showNav && (
        <nav className="w-full">
          <div className="max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between">
            {/* Pipeline Logo with rounded white background */}
            <Link href="/" className="flex items-center">
              <div
                className="bg-white rounded-[50px] shadow-[0px_0px_30.2px_rgba(0,0,0,0.1)] flex items-center justify-center"
                style={{
                  width: '200px',
                  height: '50px',
                  padding: '8px 20px'
                }}
              >
                <Image
                  src="/logo-full-color.svg"
                  alt="Pipeline"
                  width={120}
                  height={32}
                  priority
                />
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              {/* Navigation items in white circular container */}
              <div className="flex items-center space-x-6 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-200">
                <Link
                  href="/jobs"
                  className={`text-sm font-medium transition-colors px-4 py-2 rounded-full ${pathname === '/jobs'
                    ? 'bg-[#01253F] text-white'
                    : 'text-slate-700 hover:text-blue-600'
                    }`}
                >
                  Find Jobs
                </Link>
                <Link
                  href="/post-job"
                  className={`text-sm font-medium transition-colors px-4 py-2 rounded-full ${pathname === '/post-job'
                    ? 'bg-[#01253F] text-white'
                    : 'text-slate-700 hover:text-blue-600'
                    }`}
                >
                  Post a Job
                </Link>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-sm font-medium transition-colors px-4 py-2 rounded-full text-slate-700 hover:text-blue-600"
                >
                  Login
                </button>
              </div>

              {/* Profile icon */}
              <Link
                href="/profile"
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <svg
                  className="w-5 h-5 text-[#01253F]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
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
      )}

      {/* Mobile menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {showFooter && (
        <footer className="text-[#01253F] py-16">
          <div className="max-w-[1400px] mx-auto px-8">
            <div className="flex justify-between items-start">
              {/* Left side - Logo and description */}
              <div className="flex flex-col max-w-[345px]">
                <div className="flex items-center mb-6">
                  <Image
                    src="/logo-navy.svg"
                    alt="Pipeline"
                    width={207}
                    height={48}
                    priority
                  />
                </div>

                <p className="text-[20px] font-normal leading-[167%] text-[#01253F] mb-6 font-avenir">
                  Lorem ipsum dolor sit amet consectetur adipiscing elit aliquam
                </p>

                {/* Social Media Icons */}
                <div className="flex items-center gap-6">
                  {/* Facebook */}
                  <div className="w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#01253F" />
                    </svg>
                  </div>

                  {/* Twitter */}
                  <div className="w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" fill="#01253F" />
                    </svg>
                  </div>

                  {/* Instagram */}
                  <div className="w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#01253F" />
                    </svg>
                  </div>

                  {/* LinkedIn */}
                  <div className="w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#01253F" />
                    </svg>
                  </div>

                  {/* YouTube */}
                  <div className="w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#01253F" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Middle columns */}
              <div className="flex gap-16">
                {/* Product Column */}
                <div className="flex flex-col">
                  <h4 className="text-[22px] font-bold leading-[110%] text-[#01253F] mb-11 font-avenir">
                    Product
                  </h4>
                  <ul className="space-y-5">
                    <li>
                      <Link href="/features" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link href="/pricing" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <Link href="/case-studies" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Case studies
                      </Link>
                    </li>
                    <li>
                      <Link href="/reviews" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Reviews
                      </Link>
                    </li>
                    <li>
                      <Link href="/updates" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Updates
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Company Column */}
                <div className="flex flex-col">
                  <h4 className="text-[22px] font-bold leading-[110%] text-[#01253F] mb-11 font-avenir">
                    Company
                  </h4>
                  <ul className="space-y-5">
                    <li>
                      <Link href="/about" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        About
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Contact us
                      </Link>
                    </li>
                    <li>
                      <Link href="/careers" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Careers
                      </Link>
                    </li>
                    <li>
                      <Link href="/culture" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Culture
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Blog
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Support Column */}
                <div className="flex flex-col">
                  <h4 className="text-[22px] font-bold leading-[110%] text-[#01253F] mb-11 font-avenir">
                    Support
                  </h4>
                  <ul className="space-y-5">
                    <li>
                      <Link href="/getting-started" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Getting started
                      </Link>
                    </li>
                    <li>
                      <Link href="/help-center" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Help center
                      </Link>
                    </li>
                    <li>
                      <Link href="/server-status" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Server status
                      </Link>
                    </li>
                    <li>
                      <Link href="/report-bug" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Report a bug
                      </Link>
                    </li>
                    <li>
                      <Link href="/chat-support" className="text-[20px] font-normal leading-[111%] text-[#01253F] hover:underline font-avenir">
                        Chat support
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right side - Contact us */}
              <div className="flex flex-col max-w-[252px]">
                <h4 className="text-[22px] font-bold leading-[110%] text-[#01253F] mb-11 font-avenir">
                  Contacts us
                </h4>

                <div className="space-y-5">
                  {/* Email */}
                  <div className="flex items-center">
                    <div className="w-6 h-6 mr-2">
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                        <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="#01253F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-[18px] font-normal leading-[111%] text-[#01253F] font-avenir">
                      contact@company.com
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center">
                    <div className="w-6 h-6 mr-2">
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                        <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.59531 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="#01253F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-[18px] font-normal leading-[111%] text-[#01253F] font-avenir">
                      (414) 687 - 5892
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start">
                    <div className="w-6 h-6 mr-2 mt-1">
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#01253F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#01253F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="text-[20px] font-normal leading-[167%] text-[#01253F] font-avenir">
                      794 Mcallister St<br />
                      San Francisco, 94102
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="flex justify-between items-center mt-16 pt-8">
              <div className="text-[18px] font-normal leading-[167%] text-[#01253F] font-avenir">
                Copyright © 2025 Pipeline
              </div>
              <div className="text-[18px] font-normal leading-[167%] text-[#01253F] font-avenir">
                All Rights Reserved | Terms and Conditions | Privacy Policy
              </div>
            </div>
          </div>
        </footer>
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
} 