"use client";

import React, { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ForgotPasswordSchema,
  forgotPasswordSchema,
} from "../schemas/ForgotPasswordSchema";

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // react-hook-form setup with zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordSchema) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: values.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
      }

      setIsSubmitted(true);
      return response.json();

    } catch (error: any) {
      alert(error.message || "Failed to send reset link");
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push("/jobs");
  };

  const handleResendEmail = () => {
    setIsSubmitted(false);
    reset();
  };

  const handleTryAgain = () => {
    reset();
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        {/* Back Button */}
        <button
          onClick={handleBackToHome}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-6"
          type="button"
          disabled={isLoading}
        >
          <ArrowLeft size={20} className="mr-2" />
          <span className="text-sm font-medium">Back to Home page</span>
        </button>

        {!isSubmitted ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Forgot Password?
              </h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                No worries! Enter your email address and we'll send you a link
                to reset your password.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    id="reset-email"
                    type="email"
                    {...register("email")}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
                      errors.email
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your email address"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full bg-[#2CB3BF] text-white hover:bg-[#269aa5] py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending Reset Link...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-xs sm:text-sm">
                <strong>Note:</strong> If you don't receive an email within a
                few minutes, please check your spam folder or contact support.
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs leading-relaxed">
                For your security, we'll only send reset instructions to email
                addresses associated with an active account.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Check Your Email
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-4 leading-relaxed">
                We've sent a password reset link to:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-gray-900 font-medium text-sm sm:text-base break-all">
                  {getValues("email")}
                </p>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm">
                Click the link in the email to reset your password. The link
                will expire in 24 hours.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleResendEmail}
                className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm mb-3"
              >
                Resend Email
              </button>

              {/* <button
                onClick={handleTryAgain}
                className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm mb-3"
              >
                Try Different Email
              </button> */}

              <button
                onClick={handleBackToHome}
                className="w-full bg-[#2CB3BF] text-white hover:bg-[#269aa5] py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm"
              >
                Back to Home Page
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-xs">
                Still having trouble?
                <button className="ml-1 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Contact Support
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
