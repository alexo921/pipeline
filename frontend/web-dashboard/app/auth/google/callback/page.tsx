"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (token && email) {
      // Store email for display purposes only
      localStorage.setItem("user_email", email);
      
      // Redirect to homepage - the backend will handle authentication via cookies
      router.push("/");
    } else {
      // If no token, redirect to homepage
      router.push("/");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-baloo flex items-center justify-center flex-col">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
      <p className="text-[#7691A4] text-lg">Logging you in...</p>
    </div>
  );
} 