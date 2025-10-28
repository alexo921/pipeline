import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type PendingChat = {
  id: string;
  preview: string;
  from: 'PIP' | 'user';
  unread: boolean;
};

type AuthContextValue = {
  user: User | null;
  pendingChats: PendingChat[];
  markChatsAsRead: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const defaultUser: User = {
  id: 'user-001',
  name: 'Marvin',
  email: 'marvin@example.com',
  avatarUrl: null,
};

const defaultChats: PendingChat[] = [
  {
    id: 'chat-001',
    preview: 'PIP: How are you feeling after your shift?',
    from: 'PIP',
    unread: true,
  },
  {
    id: 'chat-002',
    preview: 'PIP: Remember to finish your weekly pulse survey.',
    from: 'PIP',
    unread: true,
  },
];

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user] = useState<User | null>(defaultUser);
  const [pendingChats, setPendingChats] = useState<PendingChat[]>(defaultChats);

  const markChatsAsRead = useCallback(() => {
    setPendingChats((chats) => chats.map((chat) => ({ ...chat, unread: false })));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      pendingChats,
      markChatsAsRead,
    }),
    [user, pendingChats, markChatsAsRead]
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

