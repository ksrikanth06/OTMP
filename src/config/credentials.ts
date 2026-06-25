import { AuthenticatedUser, LoginCredentials, UserRole } from '@/types';

/**
 * Static credential store standing in for a real SSO/LDAP directory.
 * Swap `authenticate` for an API call when wiring up the backend — the rest of
 * the app only depends on its return shape.
 *
 * Demo logins (username / password):
 *   employee.jordan / Passw0rd!   → Employee
 *   manager.rivera  / Passw0rd!   → Manager
 *   hr.okafor       / Passw0rd!   → HR
 */

interface DirectoryRecord extends AuthenticatedUser {
  password: string;
  /** ID of the direct manager; absent for top-level accounts. */
  managerId?: string;
}

const directory: DirectoryRecord[] = [
  // ── Loginable demo accounts ────────────────────────────────────────────
  {
    id: 'u-1001',
    username: 'employee.jordan',
    password: 'Passw0rd!',
    displayName: 'Jordan Avery',
    email: 'jordan.avery@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Field Technician',
    managerId: 'u-1002',
  },
  {
    id: 'u-1002',
    username: 'manager.rivera',
    password: 'Passw0rd!',
    displayName: 'Sam Rivera',
    email: 'sam.rivera@etihadrail.ae',
    role: UserRole.Manager,
    jobTitle: 'Operations Manager',
  },
  {
    id: 'u-1003',
    username: 'hr.okafor',
    password: 'Passw0rd!',
    displayName: 'Ada Okafor',
    email: 'ada.okafor@etihadrail.ae',
    role: UserRole.Hr,
    jobTitle: 'HR Business Partner',
  },

  // ── Sam Rivera's direct reports ────────────────────────────────────────
  {
    id: 'u-1004',
    username: 'priya.nair',
    password: 'Passw0rd!',
    displayName: 'Priya Nair',
    email: 'priya.nair@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Track Engineer',
    managerId: 'u-1002',
  },
  {
    id: 'u-1005',
    username: 'marcus.webb',
    password: 'Passw0rd!',
    displayName: 'Marcus Webb',
    email: 'marcus.webb@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Operations Coordinator',
    managerId: 'u-1002',
  },
  {
    id: 'u-1006',
    username: 'layla.hassan',
    password: 'Passw0rd!',
    displayName: 'Layla Hassan',
    email: 'layla.hassan@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Safety Officer',
    managerId: 'u-1002',
  },
  {
    id: 'u-1007',
    username: 'tom.bancroft',
    password: 'Passw0rd!',
    displayName: 'Tom Bancroft',
    email: 'tom.bancroft@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Logistics Planner',
    managerId: 'u-1002',
  },
];

const stripPassword = ({ password: _p, managerId: _m, ...user }: DirectoryRecord): AuthenticatedUser =>
  user;

/**
 * Validates credentials against the static directory. The selected role must
 * match the directory record, mirroring how an LDAP group check would behave.
 * Returns the user (without password) on success, or null on failure.
 */
export const authenticate = ({
  username,
  password,
  role,
}: LoginCredentials): AuthenticatedUser | null => {
  const normalised = username.trim().toLowerCase();
  const match = directory.find(
    (record) =>
      record.username.toLowerCase() === normalised &&
      record.password === password &&
      record.role === role,
  );
  return match ? stripPassword(match) : null;
};

/** Returns all employees who report directly to the given manager. */
export const getDirectReports = (managerId: string): AuthenticatedUser[] =>
  directory.filter((r) => r.managerId === managerId).map(stripPassword);

/** Convenience list for surfacing demo accounts on the login screen (top-level only). */
export const demoAccounts = directory
  .filter((r) => !r.managerId)
  .map(({ username, role }) => ({ username, role }));
