"use client";

import React from "react";
import { MapPin, Home, Navigation } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupStep2Schema, SignupStep2Schema } from "../schemas/AuthSchema";
import { useRouter } from "next/navigation";


interface SignupStep2Props {
  onNext: (data: SignupStep2Schema) => void;
}

const SignupStep2: React.FC<SignupStep2Props> = ({ onNext }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupStep2Schema>({
    resolver: zodResolver(signupStep2Schema),
  });

  const onSubmit = async (data: SignupStep2Schema) => {
    try {
      await onNext(data);
      localStorage.setItem("signup_step", "3");
    } catch (error) {
      console.error("Step 2 error:", error);
    }
  };

  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Step 2 of 3 - Location Information
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-[#2CB3BF]">Step 2</span>
            <span className="text-xs text-gray-500">33% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#2CB3BF] h-2 rounded-full w-1/3 transition-all duration-300"></div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          {/* ZIP Code */}
          <div>
            <label
              htmlFor="signup-zipcode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ZIP Code
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="signup-zipcode"
                type="text"
                {...register("zipCode")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${errors.zipCode ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                placeholder="Enter your ZIP code"
                disabled={isSubmitting}
              />
            </div>
            {errors.zipCode && (
              <p className="mt-1 text-sm text-red-600">
                {errors.zipCode.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="signup-address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Address
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-3 text-gray-400" size={18} />
              <textarea
                id="signup-address"
                {...register("address")}
                rows={3}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm resize-none ${errors.address ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                placeholder="Enter your full address"
                disabled={isSubmitting}
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Max Travel Distance */}
          <div>
            <label
              htmlFor="signup-travel"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Maximum Travel Distance (miles)
            </label>
            <div className="relative">
              <Navigation
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="signup-travel"
                type="number"
                min="1"
                max="100"
                {...register("maxTravelDistance", { valueAsNumber: true })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${errors.maxTravelDistance ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                placeholder="e.g. 10"
                disabled={isSubmitting}
              />
            </div>
            {errors.maxTravelDistance && (
              <p className="mt-1 text-sm text-red-600">
                {errors.maxTravelDistance.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              How far are you willing to travel for work?
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#2CB3BF] text-white hover:bg-[#269aa5] py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Continue to Step 3"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?
            <button
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              type="button"
              disabled={isSubmitting}
              onClick={() => router.push("/jobs")}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupStep2;
