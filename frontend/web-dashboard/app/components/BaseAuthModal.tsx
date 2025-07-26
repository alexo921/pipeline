import React, { useState } from 'react';
import { X } from 'lucide-react';
import AuthModalForm from './AuthModalForm';
import SignupModalForm from './SignupModalForm';
import Image from 'next/image';

interface BaseAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BaseAuthModal: React.FC<BaseAuthModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [isSignupMode, setIsSignupMode] = useState(false);
    const [isIntakeStep, setIsIntakeStep] = useState(false);
    
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleClose = () => {
        setIsSignupMode(false); // Reset to login mode when closing
        onClose();
    };

    const switchToSignup = () => {
        setIsSignupMode(true);
        setIsIntakeStep(false);
    };

    const switchToLogin = () => {
        setIsSignupMode(false);
        setIsIntakeStep(false);
    };

    const handleStep2 = () => {
        setIsIntakeStep(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden relative">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-black bg-gray-200 p-1 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>
                <div className="py-8 lg:pb-14 lg:pt-12">
                    {isSignupMode && isIntakeStep ? (
                        <div className="text-left mb-5 sm:mb-7 lg:mb-10 pl-10">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 font-baloo leading-none">
                                Congratulations!
                            </h2>
                            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 font-baloo leading-none">
                                Just a few more questions
                            </h3>
                        </div>
                    ) : (
                        <h2 className="text-3xl md:text-4xl lg:text-5xl text-center font-bold text-blue-600 mb-5 sm:mb-7 lg:mb-10 font-baloo">
                            {isSignupMode ? 'Join Pipeline!' : 'Welcome Back!'}
                        </h2>
                    )}
                    <div className="flex items-center justify-between px-8 lg:px-10">
                        {/* Left Section (Image + Illustration) */}
                        <div className="w-1/2 relative hidden md:flex items-center justify-center mr-8 lg:mr-10">
                            {/* Illustration */}
                            <Image
                                src={isSignupMode && isIntakeStep ? "/Ellipse 3.png" : "/nurse.svg"}
                                alt={isSignupMode && isIntakeStep ? "Ellipse illustration" : "Nurse illustration"}
                                width={250}
                                height={250} 
                                className="relative object-contain z-10"
                            />
                        </div>

                        {/* Right Section (Form) */}
                        <div className="w-full md:w-1/2">
                            {isSignupMode ? (
                                <SignupModalForm 
                                    onClose={handleClose}
                                    onSwitchToLogin={switchToLogin}
                                    onStep2={handleStep2}
                                />
                            ) : (
                                <AuthModalForm 
                                    onClose={handleClose}
                                    onSwitchToSignup={switchToSignup}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BaseAuthModal;