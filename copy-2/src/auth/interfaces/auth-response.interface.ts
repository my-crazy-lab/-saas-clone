import { UserPlan } from '../../users/entities/user.entity';

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    plan: UserPlan;
    avatar?: string;
  };
}
