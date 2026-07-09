/** Application-wide domain types. */

export enum UserRole {
  Employee = 'EMPLOYEE',
  Manager = 'MANAGER',
  Hr = 'HR',
}

export interface AuthenticatedUser {
  id: string;
  /** Only present for mock-mode accounts; the real API does not return this. */
  username?: string;
  displayName: string;
  email: string;
  role: UserRole;
  /** Distinguishes L1 (Line Manager) from L2 (Head of Department). Only set for Manager role. */
  managerLevel?: 'L1' | 'L2';
  jobTitle: string;
  entity: string;
  /** Not returned by the login endpoint; only set where the source data has it. */
  department?: string;
  managerId?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  role: UserRole;
}

export type LoginStatus = 'idle' | 'submitting' | 'authenticated' | 'error';

export interface NavItem {
  /** Stable key used for React lists. */
  key: string;
  label: string;
  /** Route path relative to the app root. */
  path: string;
  /** Icon name resolved by the Icon component. */
  icon: string;
  /** Optional nested items rendered below this entry. */
  children?: Omit<NavItem, 'children'>[];
}
