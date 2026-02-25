export type User = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
  location?: string;
};

export type UserSession = {
  user: User;
  token: string;
};
