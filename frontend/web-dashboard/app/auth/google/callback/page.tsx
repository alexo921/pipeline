"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          console.error('Google OAuth error:', error);
          router.push('/jobs?error=google_auth_failed');
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          router.push('/jobs?error=no_auth_code');
          return;
        }

        // Forward the request to the backend
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback?${searchParams.toString()}`;
        
        // Make a request to the backend to handle the OAuth
        const response = await fetch(backendUrl, {
          method: 'GET',
          credentials: 'include',
          redirect: 'manual', // Don't follow redirects automatically
        });

        if (response.ok || response.status === 302) {
          // Success - the backend has set the cookie and redirected
          // Refresh the user authentication state
          await refreshUser();
          // Redirect to jobs page
          router.push('/jobs?signed_in=true');
        } else {
          // Error - redirect with error
          router.push('/jobs?error=google_auth_failed');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        router.push('/jobs?error=google_auth_failed');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
        <p className="text-[#7691A4] text-lg">Completing Google sign-in...</p>
      </div>
    </div>
  );
} 