import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface BaseAuthModalFormProps {
  onClose: () => void;
  openSignUpModal: () => void;
}

// Define the schema for form validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

const AuthModalForm: React.FC<BaseAuthModalFormProps> = ({ onClose,openSignUpModal }) => {
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      await refreshUser();

      handleClose();
    } catch (error: unknown) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        setLoginError(error.message || "login failed");
      } else {
        setLoginError("login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setShowPassword(false);
    onClose();
  };

  const handleForgotPassword = () => {
    handleClose();
    router.push("/forgot-password");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="text-sm font-medium text-black mb-1 block"
        >
          Email address
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter your email"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm ${
              errors.email
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="text-sm font-medium text-black mb-1 block"
        >
          Password
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="Enter your password"
            className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm ${
              errors.password
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Remember me and Forgot Password */}
      <div className="flex items-center justify-between">
        {/* <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="rememberMe" className="text-sm text-black">
            Remember me
          </label>
        </div> */}
        <button
          type="button"
          className="text-blue-600 hover:underline ml-auto text-sm font-medium"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </button>
      </div>

      {/* Login Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#2CB3BF] hover:bg-[#289ea8] text-white transition font-semibold py-2.5 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </button>

      {loginError && (
        <p className="text-sm text-red-600 text-center">{loginError}</p>
      )}

      {/* Divider */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-gray-200" />
        <span className="px-4 text-sm text-gray-500">Or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Social Buttons */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Google */}
        <button
          type="button"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-300 py-2.5 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
        >
          <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
          <span
            className="text-sm text-black font-medium"
            onClick={() =>
              (window.location.href = "http://localhost:3001/api/auth/google")
            }
          >
            Sign in with Google
          </span>
        </button>

        {/* Apple */}
        <button
          type="button"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-300 py-2.5 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
        >
          <Image src="/apple-logo.svg" alt="Apple" width={20} height={20} />
          <span className="text-sm text-black font-medium">
            Sign in with Apple
          </span>
        </button>
      </div>

      {/* Account Prompt */}
      <div className="text-center">
        <p className="text-sm text-black">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-blue-600 font-medium hover:underline"
            onClick={() => {
              onClose(); // Close login modal
              openSignUpModal(); // Open signup modal
            }}
          >
            Sign Up
          </button>
        </p>
      </div>
    </form>
  );
};

export default AuthModalForm;
