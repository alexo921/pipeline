"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "../schemas/ChangePasswordSchema";
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

type FormData = {
  newPassword: string;
  confirmPassword: string;
};

const ChangePasswordScreen: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (values: FormData) => {
    if (!token) {
      alert("invalid or missing token");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Change password error:", error);
      alert(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <button
          onClick={() => router.push("/jobs")}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-6"
          type="button"
          disabled={isLoading}
        >
          <ArrowLeft size={20} className="mr-2" />
          <span className="text-sm font-medium">Back to Home page</span>
        </button>

        {!isSuccess ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Change Password
              </h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Choose a new secure password.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    {...register("newPassword")}
                    type={showPasswords.new ? "text" : "password"}
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
                      errors.newPassword
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPasswords.new ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    {...register("confirmPassword")}
                    type={showPasswords.confirm ? "text" : "password"}
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
                      errors.confirmPassword
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Confirm your new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password requirements */}
              <div className="p-4 bg-blue-50 rounded-lg text-xs text-blue-800 space-y-1">
                <p className="font-medium mb-2">Password Requirements:</p>
                <ul className="list-disc list-inside text-blue-700">
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2CB3BF] text-white hover:bg-[#269aa5] py-3 px-4 rounded-lg font-medium text-sm disabled:opacity-50"
              >
                {isLoading ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Password Updated!
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
              Your password has been successfully updated.
            </p>
            <button
              onClick={() => router.push("/jobs")}
              className="w-full bg-[#2CB3BF] text-white hover:bg-[#269aa5] py-3 px-4 rounded-lg font-medium text-sm"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordScreen;
