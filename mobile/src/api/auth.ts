import type { User } from '../types/user';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.pipelineworkforce.com/api').replace(/\/$/, '');

type AuthResponse = {
  token?: string;
  user?: User;
  access_token?: string;
  jwt?: string;
};

async function jsonFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    const message = text?.trim() || `Request failed (${response.status})`;
    const error = new Error(message);
    // @ts-expect-error attach status for callers to inspect
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const raw = await jsonFetch<any>(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const envelope = raw?.data ? raw.data : raw;
  const token = envelope?.token || envelope?.access_token || envelope?.jwt || raw?.token || raw?.access_token || raw?.jwt || '';
  const user = envelope?.user || raw?.user;
  if (!user?.id) {
    throw new Error('Login response missing user');
  }
  return { token, user };
}

export async function signupIfNeeded(email: string, password: string): Promise<AuthResponse> {
  // Try login first; if it fails, attempt signup with default name.
  try {
    return await login(email, password);
  } catch {
    const firstName = email.split('@')[0] || 'Pip';
    const lastName = 'User';
    return jsonFetch<AuthResponse>(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
  }
}
