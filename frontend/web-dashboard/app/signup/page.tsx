'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignupStep1 from '../components/SignupStep1';
import SignupStep2 from '../components/SignupStep2';
import SignupStep3 from '../components/SignupStep3';
import { SignupStep1Schema, SignupStep2Schema, SignupStep3Schema } from '../schemas/AuthSchema';

type Step1Data = SignupStep1Schema;
type Step2Data = SignupStep2Schema;
type Step3Data = SignupStep3Schema;

type FormData = SignupStep1Schema & SignupStep2Schema & SignupStep3Schema;

const SignupPage = () => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<FormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStep1Complete = (data: Step1Data) => {
        setFormData(prev => ({ ...prev, ...data }));
        setCurrentStep(2);
        window.scrollTo(0, 0); // Scroll to top when changing steps
    };

    const handleStep2Complete = (data: Step2Data) => {
        setFormData(prev => ({ ...prev, ...data }));
        setCurrentStep(3);
        window.scrollTo(0, 0); // Scroll to top when changing steps
    };

    const handleStep3Complete = async (data: Step3Data) => {
        setIsSubmitting(true);
        try {
            const completeData = { ...formData, ...data } as FormData;
            console.log('Complete form data:', completeData);

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Redirect after successful submission
            // router.push('/dashboard');
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                <div className="w-full max-w-md">
                    {currentStep === 1 && (
                        <SignupStep1
                            onNext={handleStep1Complete}
                        />
                    )}
                    {currentStep === 2 && (
                        <SignupStep2
                            onNext={handleStep2Complete}
                        />
                    )}
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