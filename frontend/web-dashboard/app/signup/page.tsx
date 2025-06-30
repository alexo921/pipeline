"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SignupStep1 from "../components/SignupStep1";
import SignupStep2 from "../components/SignupStep2";
import SignupStep3 from "../components/SignupStep3";
import { useEffect } from "react";

import {
  SignupStep1Schema,
  SignupStep2Schema,
  SignupStep3Schema,
} from "../schemas/AuthSchema";

type Step1Data = SignupStep1Schema;
type Step2Data = SignupStep2Schema;
type Step3Data = SignupStep3Schema;

type FormData = SignupStep1Schema & SignupStep2Schema & SignupStep3Schema;

const SignupPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedStep = localStorage.getItem("signup_step");
    const savedId = localStorage.getItem("signup_id");
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
    if (savedId) {
      setFormData((prev) => ({ ...prev, id: savedId })); 
    }
  }, []);

  const handleStep1Complete = async (data: Step1Data) => {
    const payload = {
      ...data,
      step: "INITIAL_DETAILS",
    };
    try {
      const response = await fetch("/api/user-onboarding/step-1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
 
      const result = await response.json();
    

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit step 1");
      }

      const candidateData = result.data;

      setFormData((prev) => ({ ...prev, ...data, id: candidateData.id }));

      setCurrentStep(2);
      localStorage.setItem("signup_id", candidateData.id);
      localStorage.setItem("signup_step", "2");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Step 1 submission failed:", error);
      // You can show a toast or error message here
    }
  };

  const handleStep2Complete = async (data: Step2Data) => {

    const payload = {
      ...formData,
      ...data,
      step: "LOCATION_DETAILS",
    };

    try {
      const response = await fetch("/api/user-onboarding/step-2", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();


      if (!response.ok) {
        throw new Error(result.message || "Failed to submit step 2");
      }

      setFormData((prev) => ({ ...prev, ...data }));
      setCurrentStep(3);
      localStorage.setItem("signup_step", "3");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Step 2 submission failed:", error);
    }
  };

  const handleStep3Complete = async (data: Step3Data) => {


    const payload = {
      ...formData,
      ...data,
      step: "AVAILABILITY_DETAILS",
    };

    try {
      const response = await fetch("/api/user-onboarding/step-3", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit step 3");
      }

      setFormData((prev) => ({ ...prev, ...data }));
      //   setCurrentStep(3);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Step 2 submission failed:", error);
    }

  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-md">
          {currentStep === 1 && <SignupStep1 onNext={handleStep1Complete} />}
          {currentStep === 2 && <SignupStep2 onNext={handleStep2Complete} />}
          {currentStep === 3 && (
            <SignupStep3
              onNext={handleStep3Complete}
              isLoading={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
