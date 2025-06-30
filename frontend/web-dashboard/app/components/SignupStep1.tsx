"use client";

import React from "react";
import { User, Mail, Briefcase, Award } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupStep1Schema, signupStep1Schema } from "../schemas/AuthSchema";
import { useRouter } from "next/navigation";

interface SignupStep1Props {
  onNext: (data: SignupStep1Schema) => void;
}

const SignupStep1: React.FC<SignupStep1Props> = ({ onNext }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupStep1Schema>({
    resolver: zodResolver(signupStep1Schema),
  });

  const router = useRouter();



  const onSubmit = async (data: SignupStep1Schema) => {
    try {
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
      onNext(data);
      localStorage.setItem("signup_step", "2");
    } catch (error) {
      console.error("Step 1 error:", error);
    }
  };

  const healthcareRoles = [
    { value: "CNA", label: "Certified Nursing Assistant (CNA)" },
    { value: "LPN", label: "Licensed Practical Nurse (LPN)" },
    { value: "RN", label: "Registered Nurse (RN)" },
    { value: "PCA", label: "Patient Care Assistant (PCA)" },
    { value: "HHA", label: "Home Health Aide (HHA)" },
    { value: "OTHER", label: "Other" },
  ];

  const certificationStatuses = [
    { value: "Certified", label: "Certified" },
    { value: "NotCertified", label: "Not Certified" },
    { value: "Pending", label: "Pending" },
    { value: "Inprogress", label: "In Progress" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full">
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Step 1 of 3 - Basic Information
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-[#2CB3BF]">Step 1</span>
            <span className="text-xs text-gray-500">0% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#2CB3BF] h-2 rounded-full w-2 transition-all duration-300"></div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          {/* Full Name */}
          <div>
            <label
              htmlFor="signup-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="signup-name"
                type="text"
                {...register("name")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
                  errors.name
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="signup-email"
                type="email"
                {...register("email")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
                  errors.email
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Enter your email address"
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Healthcare Role */}
          <div>
            <label
              htmlFor="signup-role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Healthcare Role
            </label>
            <div className="relative">
              <Briefcase
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                id="signup-role"
                {...register("healthcareRole")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm appearance-none bg-white ${
                  errors.healthcareRole
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select your healthcare role</option>
                {healthcareRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {errors.healthcareRole && (
              <p className="mt-1 text-sm text-red-600">
                {errors.healthcareRole.message}
              </p>
            )}
          </div>

          {/* Certification Status */}
          <div>
            <label
              htmlFor="signup-certification"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Certification Status
            </label>
            <div className="relative">
              <Award
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                id="signup-certification"
                {...register("certificationStatus")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm appearance-none bg-white ${
                  errors.certificationStatus
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select certification status</option>
                {certificationStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {errors.certificationStatus && (
              <p className="mt-1 text-sm text-red-600">
                {errors.certificationStatus.message}
              </p>
            )}
          </div>

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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Continue to Step 2"
            )}
          </button>
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

export default SignupStep1;
