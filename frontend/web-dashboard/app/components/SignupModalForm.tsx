"use client";

import React, { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Briefcase, Award } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { signupBasicSchema } from "../schemas/AuthSchema";

// Basic signup schema
type SignupBasicSchema = z.infer<typeof signupBasicSchema>;

// Intake schema based on signupStep1Schema
const intakeSchema = z.object({
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  currentRole: z.string().min(1, 'Please select your current role')
    .refine(
      (val) => ['RN', 'LPN', 'CNA', 'HHA', 'PCA', 'OTHER'].includes(val),
      { message: 'Please select a valid role' }
    ),
  preferredSetting: z.string().min(1, 'Please select your preferred setting')
    .refine(
      (val) => ['HOSPITAL', 'NURSING_HOME', 'HOME_HEALTH', 'ASSISTED_LIVING', 'OTHER'].includes(val),
      { message: 'Please select a valid setting' }
    ),
  jobType: z.string().min(1, 'Please select your job type')
    .refine(
      (val) => ['FULL_TIME', 'PART_TIME', 'PRN', 'CONTRACT'].includes(val),
      { message: 'Please select a valid job type' }
    ),
});

type IntakeSchema = z.infer<typeof intakeSchema>;

interface SignupModalFormProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onStep1?: () => void;
  onStep2?: () => void;
}

const SignupModalForm: React.FC<SignupModalFormProps> = ({ 
  onClose, 
  onSwitchToLogin,
  onStep1,
  onStep2
}) => {
  const [isStep1, setIsStep1] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  const {
    register: registerBasic,
    handleSubmit: handleSubmitBasic,
    formState: { errors: errorsBasic },
  } = useForm<SignupBasicSchema>({
    resolver: zodResolver(signupBasicSchema),
  });

  const {
    register: registerIntake,
    handleSubmit: handleSubmitIntake,
    formState: { errors: errorsIntake },
  } = useForm<IntakeSchema>({
    resolver: zodResolver(intakeSchema),
  });

  const onSubmitBasic = async (data: SignupBasicSchema) => {
    setIsLoading(true);
    setSignupError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Signup failed");
      }

      await refreshUser();
      setIsStep1(false); // Move to step 2 after successful signup
      onStep2?.(); // Call onStep2 callback when moving to step 2
    } catch (error: unknown) {
      console.error("Signup error:", error);
      if (error instanceof Error) {
        setSignupError(error.message || "Signup failed");
      } else {
        setSignupError("Signup failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitIntake = async (data: IntakeSchema) => {
    setIsLoading(true);
    try {
      // Get the current user to get their ID
      const userResponse = await fetch("/api/auth/profile", {
        credentials: "include",
      });
      
      if (!userResponse.ok) {
        throw new Error("Failed to get user profile");
      }
      
      const userData = await userResponse.json();
      
      // Submit intake details
      const response = await fetch("/api/user-onboarding/step-1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          step: "INTAKE_DETAILS",
          userId: userData.id,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save profile details");
      }

      // Refresh user data to include candidate information
      await refreshUser();
      
      onClose();
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      if (error instanceof Error) {
        setSignupError(error.message || "Failed to save profile details");
      } else {
        setSignupError("Failed to save profile details");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const roles = [
    { value: "RN", label: "Registered Nurse (RN)" },
    { value: "LPN", label: "Licensed Practical Nurse (LPN)" },
    { value: "CNA", label: "Certified Nursing Assistant (CNA)" },
    { value: "HHA", label: "Home Health Aide (HHA)" },
    { value: "PCA", label: "Patient Care Assistant (PCA)" },
    { value: "OTHER", label: "Other" },
  ];

  const settings = [
    { value: "HOSPITAL", label: "Hospital" },
    { value: "NURSING_HOME", label: "Nursing Home" },
    { value: "HOME_HEALTH", label: "Home Health" },
    { value: "ASSISTED_LIVING", label: "Assisted Living" },
    { value: "OTHER", label: "Other" },
  ];

  const jobTypes = [
    { value: "FULL_TIME", label: "Full Time" },
    { value: "PART_TIME", label: "Part Time" },
    { value: "PRN", label: "PRN" },
    { value: "CONTRACT", label: "Contract" },
  ];

  if (!isStep1) {
    return (
      <form onSubmit={handleSubmitIntake(onSubmitIntake)} className="space-y-6">
        {signupError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            {signupError}
          </div>
        )}

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            {...registerIntake("phoneNumber")}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
              errorsIntake.phoneNumber ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Enter phone number"
            disabled={isLoading}
          />
          {errorsIntake.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{errorsIntake.phoneNumber.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="currentRole" className="block text-sm font-medium text-gray-700 mb-1">
            Current Role
          </label>
          <select
            id="currentRole"
            {...registerIntake("currentRole")}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
              errorsIntake.currentRole ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={isLoading}
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errorsIntake.currentRole && (
            <p className="mt-1 text-sm text-red-600">{errorsIntake.currentRole.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="preferredSetting" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Setting
          </label>
          <select
            id="preferredSetting"
            {...registerIntake("preferredSetting")}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
              errorsIntake.preferredSetting ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={isLoading}
          >
            <option value="">Select a setting</option>
            {settings.map((setting) => (
              <option key={setting.value} value={setting.value}>
                {setting.label}
              </option>
            ))}
          </select>
          {errorsIntake.preferredSetting && (
            <p className="mt-1 text-sm text-red-600">{errorsIntake.preferredSetting.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">
            Job Type
          </label>
          <select
            id="jobType"
            {...registerIntake("jobType")}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
              errorsIntake.jobType ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={isLoading}
          >
            <option value="">Select a job type</option>
            {jobTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errorsIntake.jobType && (
            <p className="mt-1 text-sm text-red-600">{errorsIntake.jobType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2CB3BF] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#269aa5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Up Later
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmitBasic(onSubmitBasic)} className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Your Account</h3>
        <p className="text-gray-600 text-sm">Join Pipeline to find your next healthcare job</p>
      </div>

      {signupError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {signupError}
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              id="firstName"
              type="text"
              {...registerBasic("firstName")}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
                errorsBasic.firstName ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Enter your first name"
              disabled={isLoading}
            />
          </div>
          {errorsBasic.firstName && (
            <p className="mt-1 text-sm text-red-600">{errorsBasic.firstName.message}</p>
          )}
        </div>

        <div className="flex-1">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              id="lastName"
              type="text"
              {...registerBasic("lastName")}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
                errorsBasic.lastName ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Enter your last name"
              disabled={isLoading}
            />
          </div>
          {errorsBasic.lastName && (
            <p className="mt-1 text-sm text-red-600">{errorsBasic.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            id="email"
            type="email"
            {...registerBasic("email")}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
              errorsBasic.email ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>
        {errorsBasic.email && (
          <p className="mt-1 text-sm text-red-600">{errorsBasic.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            {...registerBasic("password")}
            className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm ${
              errorsBasic.password ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Create a password"
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
        {errorsBasic.password && (
          <p className="mt-1 text-sm text-red-600">{errorsBasic.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#2CB3BF] text-white hover:bg-[#269aa5] py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
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
            Creating Account...
          </span>
        ) : (
          "Create Account"
        )}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={isLoading}
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
};

export default SignupModalForm; 