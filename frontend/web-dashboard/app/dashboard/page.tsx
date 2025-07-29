"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UserDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect to jobs page if user tries to access dashboard
  useEffect(() => {
    if (user) {
      router.push("/jobs");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Dashboard in Development
        </h1>
        
        <p className="text-gray-600 mb-6">
          The dashboard feature is currently under development and not available yet. 
          Please check back later for updates.
        </p>
        
        <Link 
          href="/jobs"
          className="inline-flex items-center space-x-2 bg-[#01253F] text-white px-6 py-3 rounded-lg hover:bg-[#011a2e] transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
      </div>
    </div>
  );
}
