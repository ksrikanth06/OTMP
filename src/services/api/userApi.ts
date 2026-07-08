import apiClient from './apiClient';
import { userFromWire } from './roleMapping';
import type { WireUser } from './roleMapping';
import type { AuthenticatedUser } from '@/types';

export const userApi = {
  getDirectReports: (managerId: string): Promise<AuthenticatedUser[]> =>
    apiClient
      .get<WireUser[]>(`/users/${managerId}/direct-reports`)
      .then((r) => r.data.map(userFromWire)),

  listAll: (filters?: { entity?: string; department?: string; role?: string }): Promise<AuthenticatedUser[]> =>
    apiClient
      .get<WireUser[]>('/users', { params: filters })
      .then((r) => r.data.map(userFromWire)),
};
