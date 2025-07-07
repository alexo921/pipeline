import React from "react";
import { X } from "lucide-react";
import Image from "next/image";
import PostSignUpStepModalForm from "./PostSignUpStepModalForm"; // ✅ Correct import

interface BasePostSignUpStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  openAuthModal: () => void;
}

const BasePostSignUpStepModal: React.FC<BasePostSignUpStepModalProps> = ({
  isOpen,
  onClose,
  openAuthModal,
}) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black bg-gray-200 p-1 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="py-8 lg:pb-14 lg:pt-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-center font-bold text-blue-600 mb-5 sm:mb-7 lg:mb-10">
            Congratulations! Just a few more questions
          </h2>
          <div className="flex items-center justify-between px-8 lg:px-10">
            {/* Left Illustration */}
            <div className="w-1/2 relative hidden md:flex items-center justify-center mr-8 lg:mr-10">
              {/* Gradient Circle */}
              <Image
                src="/circle.svg"
                alt="Circle background"
                width={300}
                height={300}
                className="absolute object-contain"
              />
              {/* Tick Image - Adjusted position */}
              <Image
                src="/images/Tick.svg"
                alt="Checkmark"
                width={250}
                height={250}
                className="relative object-contain z-10 -top-6 -right-6"
              />
            </div>

            {/* Right Form */}
            <div className="w-full md:w-1/2">
              <PostSignUpStepModalForm
                onClose={onClose}
                openAuthModal={openAuthModal}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasePostSignUpStepModal;
