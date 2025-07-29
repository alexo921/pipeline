'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BaseAuthModal from './BaseAuthModal';

export default function GlobalAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { registerLoginModalTrigger } = useAuth();

  useEffect(() => {
    registerLoginModalTrigger(() => setIsOpen(true));
  }, [registerLoginModalTrigger]);

  return (
    <BaseAuthModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  );
} 