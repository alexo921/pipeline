"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";

const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  terms: z.literal(true, {
    errorMap: () => ({
      message: "You must agree to the terms and policy",
    }),
  }),
});

type SignupSchema = z.infer<typeof signupSchema>;

interface SignupModalFormProps {
  onClose: () => void;
  openAuthModal: () => void;
}

const SignupModalForm: React.FC<SignupModalFormProps> = ({
  onClose,
  openAuthModal,
}) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupSchema) => {
    setIsLoading(true);
    setSignupError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Signup failed");
      }

      reset();
      onClose();
      router.push("/verify-email"); // Or redirect as needed
    } catch (error: any) {
      setSignupError(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="text-sm font-medium text-black mb-1 block"
        >
          Name
        </label>
        <div className="relative">
          <User
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            id="name"
            {...register("name")}
            placeholder="Enter your name"
            disabled={isLoading}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm ${
              errors.name
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="text-sm font-medium text-black mb-1 block"
        >
          Email
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
            disabled={isLoading}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm ${
              errors.email
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
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
            disabled={isLoading}
            className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm ${
              errors.password
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
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

      {/* Terms Checkbox */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms"
          {...register("terms")}
          disabled={isLoading}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="terms" className="text-sm text-black">
          I agree to the{" "}
          <span className="text-blue-600 underline cursor-pointer">
            terms & policy
          </span>
        </label>
      </div>
      {errors.terms && (
        <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
      )}

      {/* Signup Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#2CB3BF] hover:bg-[#289ea8] text-white font-semibold py-2.5 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Creating Account..." : "Sign Up"}
      </button>

      {/* Error */}
      {signupError && (
        <p className="text-sm text-red-600 text-center">{signupError}</p>
      )}

      {/* Existing account link */}
      <div className="text-center">
        <p className="text-sm text-black">
          Already have an account?{" "}
          <button
            type="button"
            className="text-blue-600 font-medium hover:underline"
            onClick={() => {
              onClose(); // Close sign up modal
              openAuthModal(); // Open sign in modal
            }}
          >
            Sign In
          </button>
        </p>
      </div>
    </form>
  );
};

export default SignupModalForm;
