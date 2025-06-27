"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const GoogleCallbackPage = () => {
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

  return <div>Logging you in...</div>;
};

export default GoogleCallbackPage;
