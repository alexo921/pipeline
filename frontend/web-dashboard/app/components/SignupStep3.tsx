"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Mail,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupStep3Schema, SignupStep3Schema } from "../schemas/AuthSchema";

interface SignupStep3Props {
  onNext: (data: SignupStep3Schema) => void;
  error?: string | null;
  isLoading?: boolean;
  userEmail?: string; // Add email prop to show in confirmation
}

const SignupStep3: React.FC<SignupStep3Props> = ({
  onNext,
  error,
  isLoading = false,
  userEmail = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [registrationData, setRegistrationData] =
    useState<SignupStep3Schema | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<SignupStep3Schema>({
    resolver: zodResolver(signupStep3Schema),
    defaultValues: {
      workType: [],
      shiftType: [],
      currentJobStatus: undefined,
    },
  });

  const [openDropdown, setOpenDropdown] = useState<
    "workType" | "shiftType" | "currentJobStatus" | null
  >(null);
  const router = useRouter();
  const workType = watch("workType");
  const shiftType = watch("shiftType");
  const currentJobStatus = watch("currentJobStatus");

  const workTypeRef = useRef<HTMLDivElement>(null);
  const shiftTypeRef = useRef<HTMLDivElement>(null);
  const currentJobStatusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        workTypeRef.current &&
        !workTypeRef.current.contains(e.target as Node) &&
        shiftTypeRef.current &&
        !shiftTypeRef.current.contains(e.target as Node) &&
        currentJobStatusRef.current &&
        !currentJobStatusRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown: typeof openDropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const toggleWorkTypeSelection = (
    value: SignupStep3Schema["workType"][number]
  ) => {
    const newValues = workType.includes(value)
      ? workType.filter((v) => v !== value)
      : [...workType, value];
    setValue("workType", newValues, { shouldValidate: true });
  };

  const toggleShiftTypeSelection = (
    value: SignupStep3Schema["shiftType"][number]
  ) => {
    const newValues = shiftType.includes(value)
      ? shiftType.filter((v) => v !== value)
      : [...shiftType, value];
    setValue("shiftType", newValues, { shouldValidate: true });
  };

  const onSubmit = async (data: SignupStep3Schema) => {
    setLoading(true);
    if (isLoading) return;

    try {
      // Call the onNext function to handle the registration
      await onNext(data);
      localStorage.removeItem("signup_step");
      // Store the registration data and show confirmation
      setRegistrationData(data);
      setShowConfirmation(true);
    } catch (error) {
      // Handle error if needed
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push("/jobs"); // Adjust the path as needed
  };

  // Show confirmation screen after successful registration
  if (showConfirmation) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto my-4">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Registration Complete!
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mb-4 leading-relaxed">
              Your account has been created successfully.
            </p>
            {userEmail && (
              <>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-gray-900 font-medium text-sm sm:text-base break-all">
                    {userEmail}
                  </p>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mb-4">
                  A confirmation email has been sent to verify your account.
                </p>
              </>
            )}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-sm font-medium text-blue-900">
                  Check Your Email
                </h3>
              </div>
              <div className="space-y-2 text-xs text-blue-800">
                <p className="leading-relaxed">
                  Please check your email and click the verification link to
                  activate your account.
                </p>
                <p className="font-medium">
                  Don't forget to check your spam folder if you don't see it in
                  your inbox!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoToLogin}
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original form view
  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto my-4 ">
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Step 3 of 3 - Work Preferences
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-[#2CB3BF]">Step 3</span>
            <span className="text-xs text-gray-500">67% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#2CB3BF] h-2 rounded-full w-2/3 transition-all duration-300"></div>
          </div>
        </div>
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          {/* Work Type Dropdown */}
          <div ref={workTypeRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("workType")}
                disabled={isLoading}
                className={`w-full flex items-center justify-between pl-3 pr-3 py-2 border rounded-lg transition-all outline-none text-left ${errors.workType ? "border-red-300" : "border-gray-300"} ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center">
                  <Briefcase className="text-gray-400 mr-2" size={18} />
                  <span
                    className={workType.length === 0 ? "text-gray-400" : ""}
                  >
                    {workType.length === 0
                      ? "Select work types"
                      : workType
                          .map((w) => w.replace(/([A-Z])/g, " $1").trim())
                          .join(", ")}
                  </span>
                </div>
                {openDropdown === "workType" ? (
                  <ChevronUp className="text-gray-400" size={18} />
                ) : (
                  <ChevronDown className="text-gray-400" size={18} />
                )}
              </button>
              {openDropdown === "workType" && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {(["FullTime", "PartTime", "PerDiem", "LiveIn"] as const).map(
                    (type) => (
                      <div
                        key={type}
                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${workType.includes(type) ? "bg-blue-50" : ""}`}
                        onClick={() => toggleWorkTypeSelection(type)}
                      >
                        <input
                          type="checkbox"
                          checked={workType.includes(type)}
                          readOnly
                          className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span>{type.replace(/([A-Z])/g, " $1").trim()}</span>
                      </div>
                    )
                  )}
                </div>
              )}
              {errors.workType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.workType.message}
                </p>
              )}
            </div>
          </div>

          {/* Shift Type Dropdown */}
          <div ref={shiftTypeRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shift Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("shiftType")}
                disabled={isLoading}
                className={`w-full flex items-center justify-between pl-3 pr-3 py-2 border rounded-lg transition-all outline-none text-left ${errors.shiftType ? "border-red-300" : "border-gray-300"} ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center">
                  <Clock className="text-gray-400 mr-2" size={18} />
                  <span
                    className={shiftType.length === 0 ? "text-gray-400" : ""}
                  >
                    {shiftType.length === 0
                      ? "Select shift types"
                      : shiftType.join(", ")}
                  </span>
                </div>
                {openDropdown === "shiftType" ? (
                  <ChevronUp className="text-gray-400" size={18} />
                ) : (
                  <ChevronDown className="text-gray-400" size={18} />
                )}
              </button>
              {openDropdown === "shiftType" && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {(
                    [
                      "Day",
                      "Night",
                      "Weekend",
                      "Overnight",
                      "Flexible",
                    ] as const
                  ).map((type) => (
                    <div
                      key={type}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${shiftType.includes(type) ? "bg-blue-50" : ""}`}
                      onClick={() => toggleShiftTypeSelection(type)}
                    >
                      <input
                        type="checkbox"
                        checked={shiftType.includes(type)}
                        readOnly
                        className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span>{type}</span>
                    </div>
                  ))}
                </div>
              )}
              {errors.shiftType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.shiftType.message}
                </p>
              )}
            </div>
          </div>

          {/* Current Job Status Dropdown */}
          <div ref={currentJobStatusRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Employment Status
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("currentJobStatus")}
                disabled={isLoading}
                className={`w-full flex items-center justify-between pl-3 pr-3 py-2 border rounded-lg transition-all outline-none text-left ${errors.currentJobStatus ? "border-red-300" : "border-gray-300"} ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center">
                  <Calendar className="text-gray-400 mr-2" size={18} />
                  <span className={!currentJobStatus ? "text-gray-400" : ""}>
                    {!currentJobStatus
                      ? "Select your status"
                      : currentJobStatus
                          .replace(/([A-Z])/g, " $1")
                          .trim()
                          .replace("Available", "(Available for more work)")
                          .replace("Open Offers", "(Open to offers)")}
                  </span>
                </div>
                {openDropdown === "currentJobStatus" ? (
                  <ChevronUp className="text-gray-400" size={18} />
                ) : (
                  <ChevronDown className="text-gray-400" size={18} />
                )}
              </button>
              {openDropdown === "currentJobStatus" && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {(
                    [
                      "WorkingFullTime",
                      "WorkingFullTimeAvailable",
                      "WorkingPartTimeAvailable",
                      "NotWorkingAvailable",
                      "NotWorkingOpenOffers",
                    ] as const
                  ).map((status) => (
                    <div
                      key={status}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${currentJobStatus === status ? "bg-blue-50" : ""}`}
                      onClick={() => {
                        setValue("currentJobStatus", status, {
                          shouldValidate: true,
                        });
                        setOpenDropdown(null);
                      }}
                    >
                      {status
                        .replace(/([A-Z])/g, " $1")
                        .trim()
                        .replace("Available", "(Available for more work)")
                        .replace("Open Offers", "(Open to offers)")}
                    </div>
                  ))}
                </div>
              )}
              {errors.currentJobStatus && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentJobStatus.message}
                </p>
              )}
            </div>
          </div>

          {/* Complete Registration Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2CB3BF] text-white hover:bg-[#269aa5] py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                <span>Processing...</span>
              </span>
            ) : (
              "Complete Registration"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p
            className={`text-gray-600 text-sm ${isLoading ? "opacity-50" : ""}`}
          >
            Already have an account?
            <button
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              type="button"
              disabled={isLoading}
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

export default SignupStep3;
