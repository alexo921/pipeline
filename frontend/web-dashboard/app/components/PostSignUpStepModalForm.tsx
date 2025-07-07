"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
}

const PostSignUpStepModalForm: React.FC<PostSignUpStepModalFormProps> = ({
  onClose,
  openAuthModal,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log("Form Data:", data);
    onClose(); // Or continue to next step
  };

  const renderSelectOptions = (enumObj: object) =>
    Object.entries(enumObj).map(([value, label]) => (
      <option key={value} value={value}>
        {label}
      </option>
    ));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number</label>
        <input
          type="tel"
          placeholder="Enter phone number"
          {...register("phoneNumber")}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.phoneNumber && (
          <p className="text-red-500 text-sm mt-1">
            {errors.phoneNumber.message}
          </p>
        )}
      </div>

      {/* Current Role */}
      <div>
        <label className="block text-sm font-medium mb-1">Current Role</label>
        <select
          {...register("currentRole")}
          defaultValue=""
          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium mb-1">
          Preferred Setting
        </label>
        <select
          {...register("preferredSetting")}
          defaultValue=""
          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium mb-1">Job Type</label>
        <select
          {...register("jobType")}
          defaultValue=""
          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Select a job type
          </option>
          {renderSelectOptions(WorkType)}
        </select>
        {errors.jobType && (
          <p className="text-red-500 text-sm mt-1">{errors.jobType.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full bg-[#00C2FF] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#00a8e0] transition-colors"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default PostSignUpStepModalForm;
