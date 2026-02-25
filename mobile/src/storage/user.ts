import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types/user';

const USER_KEY = 'pipeline:user';

export type StoredSession = {
  user: User;
  token: string;
};

export const getStoredUser = async (): Promise<StoredSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user && parsed.token) {
      return parsed as StoredSession;
    }
    // Legacy: plain user object without token
    if (parsed && parsed.id) {
      return { user: parsed as User, token: '' };
    }
    return null;
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('Failed to read stored user', error);
    }
    return null;
  }
};

export const persistUser = async (session: StoredSession): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(session));
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist user', error);
    }
  }
};

export const clearStoredUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('Failed to clear stored user', error);
    }
  }
};
