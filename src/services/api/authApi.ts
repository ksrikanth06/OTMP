import apiClient, { setToken, clearToken } from './apiClient';
import { roleLabels } from '@/config/constants';
import { userFromWire } from './roleMapping';
import type { WireUser } from './roleMapping';
import type { AuthenticatedUser, LoginCredentials } from '@/types';

export interface LoginResponse {
  token: string;
  user: WireUser;
}

export const authApi = {
  login: (credentials: LoginCredentials): Promise<AuthenticatedUser> =>
    apiClient
      .post<LoginResponse>('/auth/login', { ...credentials, role: roleLabels[credentials.role] })
      .then((r) => {
        setToken(r.data.token);
        return userFromWire(r.data.user);
      }),

  logout: (): Promise<void> =>
    apiClient.post('/auth/logout').then(() => { clearToken(); }),

  me: (): Promise<AuthenticatedUser> =>
    apiClient.get<WireUser>('/users/me').then((r) => userFromWire(r.data)),
};
