"use client";

import React, { useState } from "react";
import SignUpModal from "../components/BaseSignUpModal";
import BaseAuthModal from "../components/BaseAuthModal";

const SignupPage = () => {
  const [showSignup, setShowSignup] = useState(true);
  const [showSignin, setShowSignin] = useState(false);

  const handleOpenSignin = () => setShowSignin(true);
  const handleCloseSignin = () => setShowSignin(false);
  const handleCloseSignup = () => setShowSignup(false);

  return (
    <>
      {showSignup && (
        <SignUpModal
          isOpen={showSignup}
          onClose={handleCloseSignup}
          openAuthModal={handleOpenSignin}
        />
      )}
      {showSignin && (
        <BaseAuthModal
          isOpen={showSignin}
          onClose={handleCloseSignin}
          openSignUpModal={() => setShowSignup(true)}
        />
      )}
    </>
  );
};

export default SignupPage;
