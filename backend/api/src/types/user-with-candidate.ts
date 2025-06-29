export type UserWithCandidate = {
  id: string;
  email: string;
  role: string;
  candidate: {
    id: string;
  } | null;
};
