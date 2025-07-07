"use client";
import type React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { $ZodVoidInternals } from "zod/v4/core";

// Enums
export enum HealthcareRole {
  CNA = "CNA",
  LPN = "LPN",
  RN = "RN",
  PCA = "PCA",
  HHA = "HHA",
  OTHER = "Other",
}

export enum PreferredSetting {
  LTC = "Long Term Care",
  HomeCare = "Home Care",
  Hospital = "Hospital",
  Rehab = "Rehabilitation",
  Open = "Open to any",
}

export enum WorkType {
  FullTime = "Full-Time",
  PartTime = "Part-Time",
  PerDiem = "Per Diem",
  LiveIn = "Live-In",
}

// Zod schema
const formSchema = z.object({
  phoneNumber: z.string().min(10, "Enter a valid phone number"),
  currentRole: z.nativeEnum(HealthcareRole, {
    errorMap: () => ({ message: "Select a valid role" }),
  }),
  preferredSetting: z.nativeEnum(PreferredSetting, {
    errorMap: () => ({ message: "Select a preferred setting" }),
  }),
  jobType: z.nativeEnum(WorkType, {
    errorMap: () => ({ message: "Select a job type" }),
  }),
});

type FormData = z.infer<typeof formSchema>;

interface PostSignUpStepModalFormProps {
  onClose: () => void;
  openAuthModal: () => void;
  onComplete: () => void;
  email: string;
}

const PostSignUpStepModalForm: React.FC<PostSignUpStepModalFormProps> = ({
  onClose,
  openAuthModal,
  onComplete,
  email,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Reverse lookup to find the enum key from the value
      const getEnumKey = <T extends Record<string, any>>(
        enumObj: T,
        value: string
      ): keyof T | undefined => {
        return (Object.keys(enumObj) as Array<keyof T>).find(
          (key) => enumObj[key] === value
        );
      };

      const preferredSettingKey = getEnumKey(
        PreferredSetting,
        data.preferredSetting
      );
      const jobTypeKey = getEnumKey(WorkType, data.jobType);

      if (!preferredSettingKey || !jobTypeKey) {
        throw new Error("Invalid enum value provided");
      }

      const payload = {
        email,
        phoneNumber: data.phoneNumber,
        healthcareRole: data.currentRole, // already a key
        preferredSetting: [preferredSettingKey],
        workType: [jobTypeKey],
      };

      console.log("payload", payload);

      const response = await fetch("/api/user-onboarding/complete-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to complete profile");
      }

      onClose();
      onComplete();
    } catch (err: any) {
      console.error("Form submission error:", err);
      alert(err.message || "Something went wrong");
    }
  };

  const handleSetUpLater = () => {
    onClose();
  };

  const renderSelectOptions = (enumObj: object) =>
    Object.entries(enumObj).map(([key, value]) => (
      <option key={value} value={value}>
        {value}
      </option>
    ));

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-avenir">
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="Enter phone number"
            {...register("phoneNumber")}
            className="font-avenir w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {errors.phoneNumber && (
            <p className="text-red-500 text-sm mt-1">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        {/* Current Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-avenir">
            Current Role
          </label>
          <select
            {...register("currentRole")}
            defaultValue=""
            className="font-avenir w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
          >
            <option value="" disabled>
              Select a role
            </option>
            {renderSelectOptions(HealthcareRole)}
          </select>
          {errors.currentRole && (
            <p className="text-red-500 text-sm mt-1">
              {errors.currentRole.message}
            </p>
          )}
        </div>

        {/* Preferred Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-avenir">
            Preferred Setting
          </label>
          <select
            {...register("preferredSetting")}
            defaultValue=""
            className="font-avenir w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
          >
            <option value="" disabled>
              Select a setting
            </option>
            {renderSelectOptions(PreferredSetting)}
          </select>
          {errors.preferredSetting && (
            <p className="text-red-500 text-sm mt-1">
              {errors.preferredSetting.message}
            </p>
          )}
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 font-avenir">
            Job Type
          </label>
          <select
            {...register("jobType")}
            defaultValue=""
            className="font-avenir w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
          >
            <option value="" disabled>
              Select a job type
            </option>
            {renderSelectOptions(WorkType)}
          </select>
          {errors.jobType && (
            <p className="text-red-500 text-sm mt-1">
              {errors.jobType.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="font-avenir w-full bg-[#2CB3BF] hover:bg-[#239CA7] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Submit
          </button>
        </div>
      </form>

      {/* Set Up Later Link */}
      <div className="text-center">
        <button
          onClick={handleSetUpLater}
          className="font-avenir text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
        >
          Set Up Later
        </button>
      </div>
    </div>
  );
};

export default PostSignUpStepModalForm;
