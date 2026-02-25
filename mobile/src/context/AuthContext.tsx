import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { getStoredUser, persistUser, clearStoredUser } from '../storage/user';
import type { User, UserSession } from '../types/user';

type PendingChat = {
  id: string;
  preview: string;
  from: 'Pip' | 'user';
  unread: boolean;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  pendingChats: PendingChat[];
  markChatsAsRead: () => void;
  setUser: (user: User | null, token?: string | null) => Promise<void>;
  hydrated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const defaultChats: PendingChat[] = [
  {
    id: 'chat-001',
    preview: 'Pip: How are you feeling after your shift?',
    from: 'Pip',
    unread: true,
  },
  {
    id: 'chat-002',
    preview: 'Pip: Remember to finish your weekly pulse survey.',
    from: 'Pip',
    unread: true,
  },
];

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingChats, setPendingChats] = useState<PendingChat[]>(defaultChats);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await getStoredUser();
      if (mounted && stored) {
        setUserState(stored.user);
        setToken(stored.token || null);
      }
      if (mounted) setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const markChatsAsRead = useCallback(() => {
    setPendingChats((chats) => chats.map((chat) => ({ ...chat, unread: false })));
  }, []);

  const setUser = useCallback(async (nextUser: User | null, nextToken?: string | null) => {
    setUserState(nextUser);
    setToken(nextToken ?? null);
    if (nextUser) {
      await persistUser({ user: nextUser, token: nextToken ?? '' });
    } else {
      await clearStoredUser();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      pendingChats,
      markChatsAsRead,
      setUser,
      hydrated,
    }),
    [user, token, pendingChats, markChatsAsRead, setUser, hydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
