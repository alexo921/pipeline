import { Role } from 'src/common/enums/enums';

export type UserWithCandidate = {
  id: string;
  email: string;
  role: Role;
  candidate: {
    id: string;
  } | null;
};
