import apiClient, { setToken, clearToken } from './apiClient';
import { userFromWire } from './roleMapping';
import type { WireUser } from './roleMapping';
import { UserRole } from '@/types';
import type { AuthenticatedUser, LoginCredentials } from '@/types';

interface LoginProfile {
  employeeId: string;
  displayName: string;
  emailAddress: string;
  companyName: string;
  companyId: string;
  managerName: string | null;
  managerEmployeeId: string | null;
  title: string;
  /** e.g. ['EMPLOYEE'] or ['EMPLOYEE', 'MANAGER'] — order isn't meaningful, so don't index into it. */
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  authMode: string;
  profile: LoginProfile;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// A user can hold multiple roles (e.g. a manager is also an employee); pick the
// highest-privilege one for app purposes rather than trusting array order.
const roleFromApiRoles = (roles: string[]): UserRole => {
  if (roles.includes('MANAGER')) return UserRole.Manager;
  if (roles.includes('HR')) return UserRole.Hr;
  if (roles.includes('EMPLOYEE')) return UserRole.Employee;
  throw new Error(`Unknown roles received from API: ${roles.join(', ')}`);
};

const userFromLoginProfile = (profile: LoginProfile): AuthenticatedUser => ({
  id: profile.employeeId,
  displayName: profile.displayName,
  email: profile.emailAddress,
  role: roleFromApiRoles(profile.roles),
  jobTitle: profile.title,
  entity: profile.companyName,
  managerId: profile.managerEmployeeId ?? undefined,
});

export const authApi = {
  login: ({ username, password }: LoginCredentials): Promise<AuthenticatedUser> =>
    apiClient
      .post<ApiEnvelope<LoginResponse>>('/auth/login', { username, password })
      .then((r) => {
        setToken(r.data.data.accessToken);
        return userFromLoginProfile(r.data.data.profile);
      }),

  logout: (): Promise<void> =>
    apiClient.post('/auth/logout').then(() => { clearToken(); }),

  me: (): Promise<AuthenticatedUser> =>
    apiClient.get<WireUser>('/users/me').then((r) => userFromWire(r.data)),
};
