import { UserRole } from '@/types';

/**
 * Centralised copy + branding. No component should hardcode a user-facing
 * string; pull it from here so the app can be re-worded or localised in one
 * place.
 */

export const branding = {
  productName: 'Overtime Portal',
  productInitials: 'OT',
  tagline: 'Plan, submit and approve overtime in one place.',
  organisation: 'Workforce Operations',
};

export const appText = {
  common: {
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    logout: 'Log out',
    profile: 'Profile',
    role: 'Role',
    username: 'SSO / LDAP username',
    password: 'Password',
    rememberHint: 'Use your corporate single sign-on credentials.',
  },
  login: {
    heading: 'Sign in to continue',
    subheading: 'Select your role and enter your directory credentials.',
    roleSelectorLabel: 'I am signing in as',
    invalidCredentials:
      'Those credentials were not recognised for the selected role. Check your details and try again.',
    panelEyebrow: 'Overtime management',
    panelHeadline: 'Hours that add up, approvals that keep up.',
    panelBody:
      'Submit overtime, track approval status and reconcile payroll — tailored to whether you log hours, approve them or report on them.',
  },
  home: {
    welcomePrefix: 'Welcome back,',
    overviewLabel: 'Overview',
    placeholderTitle: 'Your workspace is ready',
    placeholderBody:
      'Select an item from the navigation to get started. The modules available to you depend on your role.',
  },
  header: {
    openMenu: 'Open navigation',
    closeMenu: 'Close navigation',
    profileMenu: 'Account menu',
  },
} as const;

/** Human-readable labels for each role. */
export const roleLabels: Record<UserRole, string> = {
  [UserRole.Employee]: 'Employee',
  [UserRole.Manager]: 'Manager',
  [UserRole.Hr]: 'HR',
};

/** Short descriptions shown next to each role on the login selector. */
export const roleDescriptions: Record<UserRole, string> = {
  [UserRole.Employee]: 'Submit and track your overtime',
  [UserRole.Manager]: 'Review and approve team requests',
  [UserRole.Hr]: 'Oversee policy, reporting and payroll',
};
