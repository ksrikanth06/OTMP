/**
 * mockData.ts — single source of truth for all static app data.
 *
 * To switch to live API calls:
 *   1. Set USE_MOCK = false in dataService.ts (or drive with import.meta.env.VITE_USE_MOCK).
 *   2. Replace each mock implementation in dataService.ts with a fetch() / axios call.
 *   3. Make the function async where needed; most Fetch-button handlers already
 *      support the async pattern.
 */

import { UserRole } from '@/types';
import type { AuthenticatedUser } from '@/types';

// ─── User directory ───────────────────────────────────────────────────────────

export interface DirectoryRecord extends AuthenticatedUser {
  password: string;
  managerId?: string;
}

export const DIRECTORY: DirectoryRecord[] = [
  {
    id: 'EMP-1001',
    username: 'employee.srikanth',
    password: '123',
    displayName: 'Srikanth Kadaru',
    email: 'srikanth.kadaru@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Integration Specialist',
    entity: 'Etihad Rail',
    department: 'IT & Systems',
    managerId: 'EMP-1002',
  },
  {
    id: 'EMP-1002',
    username: 'manager.rama',
    password: '123',
    displayName: 'Rama Krishna',
    email: 'rama.krishna@etihadrail.ae',
    role: UserRole.Manager,
    jobTitle: 'Integration Manager',
    entity: 'Etihad Rail',
    department: 'IT & Systems',
  },
  {
    id: 'EMP-1003',
    username: 'hr.srikanth',
    password: '123',
    displayName: 'Srikanth Kadaru',
    email: 'srikanth.kadaru@etihadrail.ae',
    role: UserRole.Hr,
    jobTitle: 'HR Business Partner',
    entity: 'Etihad Rail',
    department: 'Human Resources',
  },
  {
    id: 'EMP-1004',
    username: 'priya.nair',
    password: '123',
    displayName: 'Priya Nair',
    email: 'priya.nair@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Track Engineer',
    entity: 'Etihad Rail',
    department: 'Infrastructure',
    managerId: 'EMP-1002',
  },
  {
    id: 'EMP-1005',
    username: 'marcus.webb',
    password: '123',
    displayName: 'Marcus Webb',
    email: 'marcus.webb@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Operations Coordinator',
    entity: 'Etihad Rail',
    department: 'Operations',
    managerId: 'EMP-1002',
  },
  {
    id: 'EMP-1006',
    username: 'layla.hassan',
    password: '123',
    displayName: 'Layla Hassan',
    email: 'layla.hassan@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Safety Officer',
    entity: 'Etihad Rail',
    department: 'HSSE',
    managerId: 'EMP-1002',
  },
  {
    id: 'EMP-1007',
    username: 'tom.bancroft',
    password: '123',
    displayName: 'Tom Bancroft',
    email: 'tom.bancroft@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Logistics Planner',
    entity: 'Etihad Rail',
    department: 'Logistics',
    managerId: 'EMP-1002',
  },
  {
    id: 'EMP-1008',
    username: 'manager.ahmed',
    password: '123',
    displayName: 'Ahmed Al Mansoori',
    email: 'ahmed.almansoori@etihadrail.ae',
    role: UserRole.Manager,
    jobTitle: 'Asset Management Manager',
    entity: 'Etihad Rail',
    department: 'Asset Management',
  },
  {
    id: 'EMP-1009',
    username: 'zara.khalid',
    password: '123',
    displayName: 'Zara Khalid',
    email: 'zara.khalid@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Civil Engineer',
    entity: 'Etihad Rail',
    department: 'Engineering',
    managerId: 'EMP-1008',
  },
  {
    id: 'EMP-1010',
    username: 'faisal.rahman',
    password: '123',
    displayName: 'Faisal Rahman',
    email: 'faisal.rahman@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Procurement Specialist',
    entity: 'Etihad Rail',
    department: 'Procurement',
    managerId: 'EMP-1008',
  },
];

// ─── Unified overtime records ─────────────────────────────────────────────────

export type ManagerStatus = 'Pending' | 'Approved' | 'Rejected';
export type HrStatus      = 'Pending' | 'Approved' | 'Rejected';

export interface OTRecord {
  empId: string;
  managerId: string;
  name: string;
  grade: string;
  entity: string;
  department: string;
  date: string;
  clockIn: string;
  clockOut: string;
  regularDayOT: number;
  regularDayOTAfter9PM: number;
  publicHolidayOT: number;
  totalOTApproved: number;
  timeInLieu: number;
  preApproved: boolean;
  managerStatus: ManagerStatus;
  managerName?: string;
  managerRejectionComment?: string;
  hrStatus: HrStatus | null;
  hrRejectionComment?: string;
}

export const HR_ENTITIES = ['Etihad Rail'] as const;

export const HR_DEPARTMENTS = [
  'IT & Systems',
  'Infrastructure',
  'Operations',
  'HSSE',
  'Logistics',
  'Engineering',
  'Procurement',
] as const;

// June 2026: Mon 1 → Tue 30  (weekends: 6,7,13,14,20,21,27,28)
const OT_RECORDS_WORKDAY: OTRecord[] = [
  // ── Srikanth Kadaru EMP-1001  (G5, shift 06:00–14:00, mgr: Rama Krishna) ──
  { empId: 'EMP-1001', managerId: 'EMP-1002', name: 'Srikanth Kadaru', grade: 'G5', entity: 'Etihad Rail', department: 'IT & Systems',   date: '02 Jun 2026', clockIn: '06:02', clockOut: '19:00', regularDayOT: 5,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 0, preApproved: true,  managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Approved' },
  { empId: 'EMP-1001', managerId: 'EMP-1002', name: 'Srikanth Kadaru', grade: 'G5', entity: 'Etihad Rail', department: 'IT & Systems',   date: '05 Jun 2026', clockIn: '06:00', clockOut: '17:00', regularDayOT: 3,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 0, preApproved: true,  managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Approved' },
  { empId: 'EMP-1001', managerId: 'EMP-1002', name: 'Srikanth Kadaru', grade: 'G5', entity: 'Etihad Rail', department: 'IT & Systems',   date: '10 Jun 2026', clockIn: '05:55', clockOut: '17:30', regularDayOT: 3.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 1, preApproved: false, managerStatus: 'Pending',                                     hrStatus: null       },
  { empId: 'EMP-1001', managerId: 'EMP-1002', name: 'Srikanth Kadaru', grade: 'G5', entity: 'Etihad Rail', department: 'IT & Systems',   date: '15 Jun 2026', clockIn: '06:00', clockOut: '19:00', regularDayOT: 5,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 0, preApproved: true,  managerStatus: 'Pending',                                     hrStatus: null       },
  { empId: 'EMP-1001', managerId: 'EMP-1002', name: 'Srikanth Kadaru', grade: 'G5', entity: 'Etihad Rail', department: 'IT & Systems',   date: '19 Jun 2026', clockIn: '06:05', clockOut: '18:00', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 0, preApproved: false, managerStatus: 'Pending',                                     hrStatus: null       },

  // ── Priya Nair EMP-1004  (G7, shift 07:00–15:00, mgr: Rama Krishna) ───────
  { empId: 'EMP-1004', managerId: 'EMP-1002', name: 'Priya Nair',      grade: 'G7', entity: 'Etihad Rail', department: 'Infrastructure', date: '01 Jun 2026', clockIn: '07:02', clockOut: '22:00', regularDayOT: 7,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 7,   timeInLieu: 2, preApproved: false, managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Approved' },
  { empId: 'EMP-1004', managerId: 'EMP-1002', name: 'Priya Nair',      grade: 'G7', entity: 'Etihad Rail', department: 'Infrastructure', date: '08 Jun 2026', clockIn: '07:05', clockOut: '19:30', regularDayOT: 4.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4.5, timeInLieu: 0, preApproved: true,  managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Approved' },
  { empId: 'EMP-1004', managerId: 'EMP-1002', name: 'Priya Nair',      grade: 'G7', entity: 'Etihad Rail', department: 'Infrastructure', date: '11 Jun 2026', clockIn: '07:00', clockOut: '19:00', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 1, preApproved: true,  managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Pending'  },
  { empId: 'EMP-1004', managerId: 'EMP-1002', name: 'Priya Nair',      grade: 'G7', entity: 'Etihad Rail', department: 'Infrastructure', date: '17 Jun 2026', clockIn: '06:55', clockOut: '20:30', regularDayOT: 5.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 5.5, timeInLieu: 0, preApproved: false, managerStatus: 'Pending',                                     hrStatus: null       },
  { empId: 'EMP-1004', managerId: 'EMP-1002', name: 'Priya Nair',      grade: 'G7', entity: 'Etihad Rail', department: 'Infrastructure', date: '23 Jun 2026', clockIn: '07:00', clockOut: '21:00', regularDayOT: 6,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 6,   timeInLieu: 2, preApproved: true,  managerStatus: 'Pending',                                     hrStatus: null       },

  // ── Marcus Webb EMP-1005  (G4, shift 08:00–16:00, mgr: Rama Krishna) ──────
  { empId: 'EMP-1005', managerId: 'EMP-1002', name: 'Marcus Webb',     grade: 'G4', entity: 'Etihad Rail', department: 'Operations',     date: '03 Jun 2026', clockIn: '08:05', clockOut: '20:00', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 1, preApproved: true,  managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Approved' },
  { empId: 'EMP-1005', managerId: 'EMP-1002', name: 'Marcus Webb',     grade: 'G4', entity: 'Etihad Rail', department: 'Operations',     date: '08 Jun 2026', clockIn: '08:00', clockOut: '19:30', regularDayOT: 3.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 0, preApproved: false, managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Approved' },
  { empId: 'EMP-1005', managerId: 'EMP-1002', name: 'Marcus Webb',     grade: 'G4', entity: 'Etihad Rail', department: 'Operations',     date: '15 Jun 2026', clockIn: '08:10', clockOut: '20:00', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 0, preApproved: true,  managerStatus: 'Pending',                                     hrStatus: null       },
  { empId: 'EMP-1005', managerId: 'EMP-1002', name: 'Marcus Webb',     grade: 'G4', entity: 'Etihad Rail', department: 'Operations',     date: '22 Jun 2026', clockIn: '07:58', clockOut: '20:30', regularDayOT: 4.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4.5, timeInLieu: 1, preApproved: true,  managerStatus: 'Pending',                                     hrStatus: null       },

  // ── Layla Hassan EMP-1006  (G6, shift 09:00–17:00, mgr: Rama Krishna) ─────
  { empId: 'EMP-1006', managerId: 'EMP-1002', name: 'Layla Hassan',    grade: 'G6', entity: 'Etihad Rail', department: 'HSSE',           date: '04 Jun 2026', clockIn: '09:00', clockOut: '23:00', regularDayOT: 5,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 6,   timeInLieu: 0, preApproved: false, managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Approved' },
  { empId: 'EMP-1006', managerId: 'EMP-1002', name: 'Layla Hassan',    grade: 'G6', entity: 'Etihad Rail', department: 'HSSE',           date: '09 Jun 2026', clockIn: '08:58', clockOut: '21:30', regularDayOT: 4.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4.5, timeInLieu: 0, preApproved: true,  managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Approved' },
  { empId: 'EMP-1006', managerId: 'EMP-1002', name: 'Layla Hassan',    grade: 'G6', entity: 'Etihad Rail', department: 'HSSE',           date: '16 Jun 2026', clockIn: '09:02', clockOut: '22:00', regularDayOT: 5,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 2, preApproved: false, managerStatus: 'Pending',                                     hrStatus: null       },
  { empId: 'EMP-1006', managerId: 'EMP-1002', name: 'Layla Hassan',    grade: 'G6', entity: 'Etihad Rail', department: 'HSSE',           date: '22 Jun 2026', clockIn: '09:00', clockOut: '21:30', regularDayOT: 4.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4.5, timeInLieu: 1, preApproved: true,  managerStatus: 'Pending',                                     hrStatus: null       },

  // ── Tom Bancroft EMP-1007  (G3, shift 10:00–18:00, mgr: Rama Krishna) ─────
  { empId: 'EMP-1007', managerId: 'EMP-1002', name: 'Tom Bancroft',    grade: 'G3', entity: 'Etihad Rail', department: 'Logistics',      date: '05 Jun 2026', clockIn: '09:55', clockOut: '22:00', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 3, preApproved: true,  managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Approved' },
  { empId: 'EMP-1007', managerId: 'EMP-1002', name: 'Tom Bancroft',    grade: 'G3', entity: 'Etihad Rail', department: 'Logistics',      date: '12 Jun 2026', clockIn: '10:00', clockOut: '21:30', regularDayOT: 3.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 0, preApproved: false, managerStatus: 'Approved', managerName: 'Rama Krishna',       hrStatus: 'Pending'  },
  { empId: 'EMP-1007', managerId: 'EMP-1002', name: 'Tom Bancroft',    grade: 'G3', entity: 'Etihad Rail', department: 'Logistics',      date: '18 Jun 2026', clockIn: '09:58', clockOut: '22:30', regularDayOT: 4,   regularDayOTAfter9PM: 0.5, publicHolidayOT: 0, totalOTApproved: 4.5, timeInLieu: 1, preApproved: true,  managerStatus: 'Pending',                                     hrStatus: null       },
  { empId: 'EMP-1007', managerId: 'EMP-1002', name: 'Tom Bancroft',    grade: 'G3', entity: 'Etihad Rail', department: 'Logistics',      date: '24 Jun 2026', clockIn: '10:00', clockOut: '24:00', regularDayOT: 4,   regularDayOTAfter9PM: 2,   publicHolidayOT: 0, totalOTApproved: 6,   timeInLieu: 2, preApproved: false, managerStatus: 'Pending',                                     hrStatus: null       },

  // ── Zara Khalid EMP-1009  (G6, shift 07:30–15:30, mgr: Ahmed Al Mansoori) ─
  { empId: 'EMP-1009', managerId: 'EMP-1008', name: 'Zara Khalid',     grade: 'G6', entity: 'Etihad Rail', department: 'Engineering',    date: '02 Jun 2026', clockIn: '07:28', clockOut: '20:00', regularDayOT: 4.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4.5, timeInLieu: 0, preApproved: true,  managerStatus: 'Approved', managerName: 'Ahmed Al Mansoori', hrStatus: 'Approved' },
  { empId: 'EMP-1009', managerId: 'EMP-1008', name: 'Zara Khalid',     grade: 'G6', entity: 'Etihad Rail', department: 'Engineering',    date: '09 Jun 2026', clockIn: '07:30', clockOut: '21:30', regularDayOT: 6,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 6,   timeInLieu: 1, preApproved: false, managerStatus: 'Approved', managerName: 'Ahmed Al Mansoori', hrStatus: 'Pending'  },
  { empId: 'EMP-1009', managerId: 'EMP-1008', name: 'Zara Khalid',     grade: 'G6', entity: 'Etihad Rail', department: 'Engineering',    date: '16 Jun 2026', clockIn: '07:32', clockOut: '20:30', regularDayOT: 5,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 0, preApproved: true,  managerStatus: 'Pending',                                     hrStatus: null       },
  { empId: 'EMP-1009', managerId: 'EMP-1008', name: 'Zara Khalid',     grade: 'G6', entity: 'Etihad Rail', department: 'Engineering',    date: '23 Jun 2026', clockIn: '07:30', clockOut: '19:30', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 0, preApproved: false, managerStatus: 'Pending',                                     hrStatus: null       },

  // ── Faisal Rahman EMP-1010  (G5, shift 08:30–16:30, mgr: Ahmed Al Mansoori)
  { empId: 'EMP-1010', managerId: 'EMP-1008', name: 'Faisal Rahman',   grade: 'G5', entity: 'Etihad Rail', department: 'Procurement',    date: '03 Jun 2026', clockIn: '08:28', clockOut: '21:00', regularDayOT: 4.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4.5, timeInLieu: 0, preApproved: true,  managerStatus: 'Approved', managerName: 'Ahmed Al Mansoori', hrStatus: 'Approved' },
  { empId: 'EMP-1010', managerId: 'EMP-1008', name: 'Faisal Rahman',   grade: 'G5', entity: 'Etihad Rail', department: 'Procurement',    date: '10 Jun 2026', clockIn: '08:30', clockOut: '22:30', regularDayOT: 5.5, regularDayOTAfter9PM: 0.5, publicHolidayOT: 0, totalOTApproved: 6,   timeInLieu: 2, preApproved: false, managerStatus: 'Approved', managerName: 'Ahmed Al Mansoori', hrStatus: 'Pending'  },
  { empId: 'EMP-1010', managerId: 'EMP-1008', name: 'Faisal Rahman',   grade: 'G5', entity: 'Etihad Rail', department: 'Procurement',    date: '17 Jun 2026', clockIn: '08:32', clockOut: '20:30', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 1, preApproved: true,  managerStatus: 'Pending',                                     hrStatus: null       },
  { empId: 'EMP-1010', managerId: 'EMP-1008', name: 'Faisal Rahman',   grade: 'G5', entity: 'Etihad Rail', department: 'Procurement',    date: '24 Jun 2026', clockIn: '08:30', clockOut: '21:30', regularDayOT: 5,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 0, preApproved: false, managerStatus: 'Pending',                                     hrStatus: null       },
];

// ─── Grade → gross pay ────────────────────────────────────────────────────────

// G12 = 1 000 AED … G1 = 12 000 AED
export const GRADE_GROSS: Record<string, number> = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [`G${12 - i}`, (i + 1) * 1000]),
);

// ─── Shift configuration ──────────────────────────────────────────────────────

// Five shift start times — one per team member (index matches getDirectReports order)
// EMP-1001 → 06:00, EMP-1004 → 07:00, EMP-1005 → 08:00, EMP-1006 → 09:00, EMP-1007 → 10:00
export const SHIFT_STARTS = ['06:00', '07:00', '08:00', '09:00', '10:00'];

// ─── June 2026 explicit shift plan ───────────────────────────────────────────
//
// June 2026: Mon 1 → Tue 30
//   Workdays : 1-5, 8-12, 15-19, 22-26, 29-30  (22 days)
//   Weekends : 6,7, 13,14, 20,21, 27,28
//
// Per-employee fixed shifts (8-hour shifts, all workdays same shift):
//   EMP-1001  06:00–14:00   EMP-1004  07:00–15:00   EMP-1005  08:00–16:00
//   EMP-1006  09:00–17:00   EMP-1007  10:00–18:00

export interface June2026DayRecord {
  day: number;
  dayOfWeek: string;
  isWorkday: boolean;
  shiftStart?: string;
  shiftEnd?: string;
  otStart?: string;
  otEnd?: string;
  otHours?: number;
  otStatus?: string;
  clockIn?: string;
  clockOut?: string;
}

// Fixed shift start/end per employee id for June 2026 (8-hour shifts)
export const JUNE_2026_EMP_SHIFTS: Record<string, { start: string; end: string }> = {
  'EMP-1001': { start: '06:00', end: '14:00' },
  'EMP-1004': { start: '07:00', end: '15:00' },
  'EMP-1005': { start: '08:00', end: '16:00' },
  'EMP-1006': { start: '09:00', end: '17:00' },
  'EMP-1007': { start: '10:00', end: '18:00' },
  'EMP-1009': { start: '07:30', end: '15:30' },
  'EMP-1010': { start: '08:30', end: '16:30' },
};

// June 2026 day-of-week names indexed by day-1 (0=Jun1=Mon … 29=Jun30=Tue)
const J26_DOW = [
  'Mon','Tue','Wed','Thu','Fri','Sat','Sun',
  'Mon','Tue','Wed','Thu','Fri','Sat','Sun',
  'Mon','Tue','Wed','Thu','Fri','Sat','Sun',
  'Mon','Tue','Wed','Thu','Fri','Sat','Sun',
  'Mon','Tue',
];

const J26_WORKDAYS = new Set([1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]);

// OT schedule per employee — only on workdays, starts at or after shift end
const J26_OT: Record<string, Array<{
  day: number; otStart: string; otEnd: string; otHours: number;
  clockIn: string; clockOut: string;
}>> = {
  'EMP-1001': [
    // shift ends 14:00; OT starts immediately after (8h shift)
    { day:  2, otStart: '14:00', otEnd: '19:00', otHours: 5,   clockIn: '06:02', clockOut: '19:00' },
    { day:  5, otStart: '14:00', otEnd: '17:00', otHours: 3,   clockIn: '06:00', clockOut: '17:00' },
    { day: 10, otStart: '14:00', otEnd: '17:30', otHours: 3.5, clockIn: '05:55', clockOut: '17:30' },
    { day: 15, otStart: '14:00', otEnd: '19:00', otHours: 5,   clockIn: '06:00', clockOut: '19:00' },
    { day: 19, otStart: '14:00', otEnd: '18:00', otHours: 4,   clockIn: '06:05', clockOut: '18:00' },
  ],
  'EMP-1004': [
    { day:  1, otStart: '15:00', otEnd: '22:00', otHours: 7,   clockIn: '07:02', clockOut: '22:00' },
    { day:  8, otStart: '15:00', otEnd: '19:30', otHours: 4.5, clockIn: '07:05', clockOut: '19:30' },
    { day: 11, otStart: '15:00', otEnd: '19:00', otHours: 4,   clockIn: '07:00', clockOut: '19:00' },
    { day: 17, otStart: '15:00', otEnd: '20:30', otHours: 5.5, clockIn: '06:55', clockOut: '20:30' },
    { day: 23, otStart: '15:00', otEnd: '21:00', otHours: 6,   clockIn: '07:00', clockOut: '21:00' },
  ],
  'EMP-1005': [
    { day:  3, otStart: '16:00', otEnd: '20:00', otHours: 4,   clockIn: '08:05', clockOut: '20:00' },
    { day:  8, otStart: '16:00', otEnd: '19:30', otHours: 3.5, clockIn: '08:00', clockOut: '19:30' },
    { day: 15, otStart: '16:00', otEnd: '20:00', otHours: 4,   clockIn: '08:10', clockOut: '20:00' },
    { day: 22, otStart: '16:00', otEnd: '20:30', otHours: 4.5, clockIn: '07:58', clockOut: '20:30' },
  ],
  'EMP-1006': [
    { day:  4, otStart: '17:00', otEnd: '23:00', otHours: 6,   clockIn: '09:00', clockOut: '23:00' },
    { day:  9, otStart: '17:00', otEnd: '21:30', otHours: 4.5, clockIn: '08:58', clockOut: '21:30' },
    { day: 16, otStart: '17:00', otEnd: '22:00', otHours: 5,   clockIn: '09:02', clockOut: '22:00' },
    { day: 22, otStart: '17:00', otEnd: '21:30', otHours: 4.5, clockIn: '09:00', clockOut: '21:30' },
  ],
  'EMP-1007': [
    { day:  5, otStart: '18:00', otEnd: '22:00', otHours: 4,   clockIn: '09:55', clockOut: '22:00' },
    { day: 12, otStart: '18:00', otEnd: '21:30', otHours: 3.5, clockIn: '10:00', clockOut: '21:30' },
    { day: 18, otStart: '18:00', otEnd: '22:30', otHours: 4.5, clockIn: '09:58', clockOut: '22:30' },
    { day: 24, otStart: '18:00', otEnd: '24:00', otHours: 6,   clockIn: '10:00', clockOut: '24:00' },
  ],
  'EMP-1009': [
    { day:  2, otStart: '15:30', otEnd: '20:00', otHours: 4.5, clockIn: '07:28', clockOut: '20:00' },
    { day:  9, otStart: '15:30', otEnd: '21:30', otHours: 6,   clockIn: '07:30', clockOut: '21:30' },
    { day: 16, otStart: '15:30', otEnd: '20:30', otHours: 5,   clockIn: '07:32', clockOut: '20:30' },
    { day: 23, otStart: '15:30', otEnd: '19:30', otHours: 4,   clockIn: '07:30', clockOut: '19:30' },
  ],
  'EMP-1010': [
    { day:  3, otStart: '16:30', otEnd: '21:00', otHours: 4.5, clockIn: '08:28', clockOut: '21:00' },
    { day: 10, otStart: '16:30', otEnd: '22:30', otHours: 6,   clockIn: '08:30', clockOut: '22:30' },
    { day: 17, otStart: '16:30', otEnd: '20:30', otHours: 4,   clockIn: '08:32', clockOut: '20:30' },
    { day: 24, otStart: '16:30', otEnd: '21:30', otHours: 5,   clockIn: '08:30', clockOut: '21:30' },
  ],
};

// Clock-in/out for employees who came in on off days (weekends / rest days)
const J26_OFF_DAY: Record<string, Array<{ day: number; clockIn: string; clockOut: string }>> = {
  'EMP-1001': [
    { day:  6, clockIn: '07:05', clockOut: '13:00' },  // Sat 06 Jun
    { day:  7, clockIn: '08:00', clockOut: '12:30' },  // Sun 07 Jun
    { day: 13, clockIn: '07:02', clockOut: '14:15' },  // Sat 13 Jun
    { day: 20, clockIn: '07:30', clockOut: '11:45' },  // Sat 20 Jun
  ],
};

// ─── Off-day → Holiday OT record derivation ──────────────────────────────────

function calcOffDayHours(clockIn: string, clockOut: string): number {
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  return Math.round(((outH + outM / 60) - (inH + inM / 60)) * 100) / 100;
}

// Grade per employee — sourced from workday OT records so grades stay in sync
const EMP_GRADE: Record<string, string> = {};
for (const r of OT_RECORDS_WORKDAY) {
  if (!EMP_GRADE[r.empId]) EMP_GRADE[r.empId] = r.grade;
}

function buildOffDayOtRecords(): OTRecord[] {
  const records: OTRecord[] = [];
  for (const [empId, offDays] of Object.entries(J26_OFF_DAY)) {
    const dir = DIRECTORY.find((d) => d.id === empId);
    if (!dir || !dir.managerId) continue;
    const grade = EMP_GRADE[empId] ?? 'G5';
    for (const od of offDays) {
      const totalHours = calcOffDayHours(od.clockIn, od.clockOut);
      records.push({
        empId,
        managerId: dir.managerId,
        name: dir.displayName,
        grade,
        entity: dir.entity,
        department: dir.department,
        date: `${String(od.day).padStart(2, '0')} Jun 2026`,
        clockIn: od.clockIn,
        clockOut: od.clockOut,
        regularDayOT: 0,
        regularDayOTAfter9PM: 0,
        publicHolidayOT: totalHours,
        totalOTApproved: totalHours,
        timeInLieu: 0,
        preApproved: false,
        managerStatus: 'Pending',
        hrStatus: null,
      });
    }
  }
  return records;
}

// Single source of truth: workday OT + auto-generated off-day (Holiday) OT
export const OT_RECORDS: OTRecord[] = [
  ...OT_RECORDS_WORKDAY,
  ...buildOffDayOtRecords(),
];

// Build OT status lookup from OT_RECORDS for June 2026
function buildOtStatusMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of OT_RECORDS) {
    if (!r.date.includes('Jun 2026')) continue;
    const day = parseInt(r.date.split(' ')[0], 10);
    map.set(`${r.empId}-${day}`, r.managerStatus);
  }
  return map;
}

// Build the full 30-day June 2026 shift plan indexed by empId
function buildJune2026ShiftPlan(): Record<string, June2026DayRecord[]> {
  const otStatusMap = buildOtStatusMap();
  const plan: Record<string, June2026DayRecord[]> = {};

  for (const [empId, shift] of Object.entries(JUNE_2026_EMP_SHIFTS)) {
    const otMap = new Map((J26_OT[empId] ?? []).map((o) => [o.day, o]));

    plan[empId] = Array.from({ length: 30 }, (_, i) => {
      const day       = i + 1;
      const dayOfWeek = J26_DOW[i];
      const isWorkday = J26_WORKDAYS.has(day);

      if (!isWorkday) {
        const offDay = (J26_OFF_DAY[empId] ?? []).find((o) => o.day === day);
        if (offDay) {
          const hrs = calcOffDayHours(offDay.clockIn, offDay.clockOut);
          return {
            day, dayOfWeek, isWorkday,
            clockIn: offDay.clockIn, clockOut: offDay.clockOut,
            otStart: offDay.clockIn, otEnd: offDay.clockOut,
            otHours: hrs,
            otStatus: otStatusMap.get(`${empId}-${day}`) ?? 'Pending',
          };
        }
        return { day, dayOfWeek, isWorkday };
      }

      const ot = otMap.get(day);
      return {
        day, dayOfWeek, isWorkday,
        shiftStart: shift.start,
        shiftEnd:   shift.end,
        otStart:    ot?.otStart,
        otEnd:      ot?.otEnd,
        otHours:    ot?.otHours,
        otStatus:   ot ? (otStatusMap.get(`${empId}-${day}`) ?? 'Pending') : undefined,
        clockIn:    ot?.clockIn  ?? shift.start,
        clockOut:   ot?.clockOut ?? shift.end,
      };
    });
  }

  return plan;
}

export const JUNE_2026_SHIFT_PLAN = buildJune2026ShiftPlan();
