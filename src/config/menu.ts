import { NavItem, UserRole } from '@/types';

/**
 * Navigation per role. The Home screen renders whatever list matches the
 * signed-in user's role, so adding a menu item is a data change, not a UI one.
 *
 * `icon` values map to keys in src/components/common/Icon.tsx.
 */

const employeeNav: NavItem[] = [
  { key: 'emp-dashboard', label: 'Dashboard', path: '/home', icon: 'grid' },
  { key: 'emp-submit', label: 'Submit overtime', path: '/home/submit', icon: 'plus' },
  { key: 'emp-requests', label: 'My requests', path: '/home/requests', icon: 'list' },
  { key: 'emp-timesheet', label: 'Timesheet', path: '/home/timesheet', icon: 'calendar' },
];

const managerNav: NavItem[] = [
  { key: 'mgr-dashboard', label: 'Dashboard', path: '/home', icon: 'grid' },
  { key: 'mgr-approvals', label: 'Overtime Approvals', path: '/home/approvals', icon: 'check' },
  { key: 'mgr-team', label: 'My Team', path: '/home/team', icon: 'users' },
];

const hrNav: NavItem[] = [
  { key: 'hr-dashboard', label: 'Dashboard', path: '/home', icon: 'grid' },
  { key: 'hr-policies', label: 'Overtime policies', path: '/home/policies', icon: 'shield' },
  { key: 'hr-payroll', label: 'Payroll export', path: '/home/payroll', icon: 'wallet' },
  { key: 'hr-reports', label: 'Organisation reports', path: '/home/reports', icon: 'chart' },
  { key: 'hr-employees', label: 'Employees', path: '/home/employees', icon: 'users' },
];

export const navByRole: Record<UserRole, NavItem[]> = {
  [UserRole.Employee]: employeeNav,
  [UserRole.Manager]: managerNav,
  [UserRole.Hr]: hrNav,
};

export const getNavForRole = (role: UserRole): NavItem[] => navByRole[role] ?? [];
