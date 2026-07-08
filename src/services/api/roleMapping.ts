import { roleLabels } from '@/config/constants';
import { UserRole } from '@/types';
import type { AuthenticatedUser } from '@/types';

/** Shape of a user object as the API actually returns it — role is a plain
 * label ("Employee" / "Manager" / "HR"), not the internal UserRole enum. */
export type WireUser = Omit<AuthenticatedUser, 'role'> & { role: string };

export const roleFromWire = (wireRole: string): UserRole => {
  const entry = (Object.entries(roleLabels) as [UserRole, string][])
    .find(([, label]) => label === wireRole);
  if (!entry) throw new Error(`Unknown role received from API: ${wireRole}`);
  return entry[0];
};

export const userFromWire = (user: WireUser): AuthenticatedUser => ({
  ...user,
  role: roleFromWire(user.role),
});
