"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import PostSignUpStepModalForm from "./PostSignUpStepModalForm";

interface BasePostSignUpStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  openAuthModal: () => void;
  onComplete: () => void;
  email: string;
}

const BasePostSignUpStepModal: React.FC<BasePostSignUpStepModalProps> = ({
  isOpen,
  onClose,
  openAuthModal,
  onComplete,
  email,
}) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-16">
          {/* Title */}
          <h2 className="text-left text-[36px] sm:text-[50px] lg:text-[60px] leading-tight font-bold text-blue-600 mb-6 font-baloo">
            Congratulations!
            {/* <br className="hidden sm:block" /> */}
            Just a few more questions
          </h2>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14">
            {/* Left Illustration */}
            <div className="w-full md:w-1/2 relative hidden md:flex items-center justify-center">
              <Image
                src="/circle.svg"
                alt="Circle background"
                width={300}
                height={300}
                className="absolute object-contain"
              />
              <Image
                src="/images/Tick.svg"
                alt="Checkmark"
                width={200}
                height={200}
                className="relative object-contain z-10 -top-4 -right-4"
              />
            </div>

            {/* Right Form */}
            <div className="w-full lg:w-1/2 max-w-md">
              <PostSignUpStepModalForm
                onClose={onClose}
                openAuthModal={openAuthModal}
                onComplete={onComplete}
                email={email}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasePostSignUpStepModal;
