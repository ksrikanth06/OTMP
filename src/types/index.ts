/** Application-wide domain types. */

export enum UserRole {
  Employee = 'EMPLOYEE',
  Manager = 'MANAGER',
  Hr = 'HR',
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  jobTitle: string;
  entity: string;
  department: string;
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
