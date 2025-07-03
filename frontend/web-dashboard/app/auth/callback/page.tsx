"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const GoogleCallbackContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (token) {
      localStorage.setItem("access_token", token);
      localStorage.setItem("user_email", email || "");
      router.push("/");
    } else {
      router.push("/login");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-baloo flex items-center justify-center flex-col">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
      <p className="text-[#7691A4] text-lg">Logging you in...</p>
    </div>
  );
};

const GoogleCallbackPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleCallbackContent />
    </Suspense>
  );
};

export default GoogleCallbackPage;
