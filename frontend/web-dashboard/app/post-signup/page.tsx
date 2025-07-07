"use client";

import React, { useState } from "react";
import BasePostSignUpStepModal from "../components/BasePostSignUpStepModal";

const SignUpPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true); // show modal initially

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleOpenAuthModal = () => {
    // logic to open login/auth modal instead (optional)
    console.log("Switch to login modal");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Optional: Button to open modal manually */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg"
      >
        Open Sign Up Modal
      </button>

      {/* Sign Up Step Modal */}
      <BasePostSignUpStepModal
        isOpen={isModalOpen}
        onClose={handleClose}
        openAuthModal={handleOpenAuthModal}
      />
    </div>
  );
};

export default SignUpPage;
