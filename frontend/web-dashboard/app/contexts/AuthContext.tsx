"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  showLoginModal: () => void;
  registerLoginModalTrigger: (trigger: () => void) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loginModalTrigger, setLoginModalTrigger] = useState<(() => void) | null>(null);

  const refreshUser = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/profile`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) return setUser(null);
      const data = await res.json();
      setUser(data.data);
    } catch {
      setUser(null);
    }
  };

  const logout = () => {
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const showLoginModal = useCallback(() => {
    if (loginModalTrigger) {
      loginModalTrigger();
    }
  }, [loginModalTrigger]);

  const registerLoginModalTrigger = useCallback((trigger: () => void) => {
    setLoginModalTrigger(() => trigger);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      refreshUser, 
      logout,
      showLoginModal,
      registerLoginModalTrigger 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
