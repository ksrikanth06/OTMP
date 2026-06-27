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
    jobTitle: 'Integration Speacialist',
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
  },
  {
    id: 'EMP-1003',
    username: 'hr.srikanth',
    password: '123',
    displayName: 'Srikanth Kadaru',
    email: 'srikanth.kadaru@etihadrail.ae',
    role: UserRole.Hr,
    jobTitle: 'HR Business Partner',
  },
  {
    id: 'EMP-1004',
    username: 'priya.nair',
    password: '123',
    displayName: 'Priya Nair',
    email: 'priya.nair@etihadrail.ae',
    role: UserRole.Employee,
    jobTitle: 'Track Engineer',
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
    managerId: 'EMP-1002',
  },
];

// ─── Manager overtime records ─────────────────────────────────────────────────

export interface OvertimeRecord {
  empId: string;
  name: string;
  date: string;
  grade: string;
  regularDayOT: number;
  regularDayOTAfter9PM: number;
  publicHolidayOT: number;
  totalOTApproved: number;
  timeInLieu: number;
  preApproved: boolean;
  status: string;
  clockIn: string;
  clockOut: string;
  rejectionComment?: string;
}

// June 2026 calendar:  Mon 1 → Tue 30  (weekends: 6,7,13,14,20,21,27,28)
// IDs match DIRECTORY.id — EMP-1001 06:00–15:00 | EMP-1004 07:00–16:00 | EMP-1005 08:00–17:00
//                           EMP-1006 09:00–18:00 | EMP-1007 10:00–19:00
export const MANAGER_OT_RECORDS: OvertimeRecord[] = [
  // ── Srikanth Kadaru EMP-1001  (G5, shift 06:00–15:00) ─────────────────────
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', date: '02 Jun 2026', grade: 'G5', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 0, preApproved: true,  status: 'Approved', clockIn: '06:02', clockOut: '19:00' },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', date: '05 Jun 2026', grade: 'G5', regularDayOT: 2,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2,   timeInLieu: 0, preApproved: true,  status: 'Approved', clockIn: '06:00', clockOut: '17:00' },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', date: '10 Jun 2026', grade: 'G5', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2.5, timeInLieu: 1, preApproved: false, status: 'Pending',  clockIn: '05:55', clockOut: '17:30' },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', date: '15 Jun 2026', grade: 'G5', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 0, preApproved: true,  status: 'Pending',  clockIn: '06:00', clockOut: '19:00' },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', date: '19 Jun 2026', grade: 'G5', regularDayOT: 3,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 0, preApproved: false, status: 'Pending',  clockIn: '06:05', clockOut: '18:00' },

  // ── Priya Nair  EMP-1004  (G7, shift 07:00–16:00) ─────────────────────────
  { empId: 'EMP-1004', name: 'Priya Nair',      date: '01 Jun 2026', grade: 'G7', regularDayOT: 5,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 6,   timeInLieu: 2, preApproved: false, status: 'Approved', clockIn: '07:02', clockOut: '22:00' },
  { empId: 'EMP-1004', name: 'Priya Nair',      date: '08 Jun 2026', grade: 'G7', regularDayOT: 3.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 0, preApproved: true,  status: 'Approved', clockIn: '07:05', clockOut: '19:30' },
  { empId: 'EMP-1004', name: 'Priya Nair',      date: '11 Jun 2026', grade: 'G7', regularDayOT: 3,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 1, preApproved: true,  status: 'Approved', clockIn: '07:00', clockOut: '19:00' },
  { empId: 'EMP-1004', name: 'Priya Nair',      date: '17 Jun 2026', grade: 'G7', regularDayOT: 4.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4.5, timeInLieu: 0, preApproved: false, status: 'Pending',  clockIn: '06:55', clockOut: '20:30' },
  { empId: 'EMP-1004', name: 'Priya Nair',      date: '23 Jun 2026', grade: 'G7', regularDayOT: 5,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 2, preApproved: true,  status: 'Pending',  clockIn: '07:00', clockOut: '21:00' },

  // ── Marcus Webb  EMP-1005  (G4, shift 08:00–17:00) ────────────────────────
  { empId: 'EMP-1005', name: 'Marcus Webb',     date: '03 Jun 2026', grade: 'G4', regularDayOT: 3,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 1, preApproved: true,  status: 'Approved', clockIn: '08:05', clockOut: '20:00' },
  { empId: 'EMP-1005', name: 'Marcus Webb',     date: '08 Jun 2026', grade: 'G4', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2.5, timeInLieu: 0, preApproved: false, status: 'Approved', clockIn: '08:00', clockOut: '19:30' },
  { empId: 'EMP-1005', name: 'Marcus Webb',     date: '15 Jun 2026', grade: 'G4', regularDayOT: 3,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 0, preApproved: true,  status: 'Pending',  clockIn: '08:10', clockOut: '20:00' },
  { empId: 'EMP-1005', name: 'Marcus Webb',     date: '22 Jun 2026', grade: 'G4', regularDayOT: 3.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 1, preApproved: true,  status: 'Pending',  clockIn: '07:58', clockOut: '20:30' },

  // ── Layla Hassan  EMP-1006  (G6, shift 09:00–18:00) ───────────────────────
  { empId: 'EMP-1006', name: 'Layla Hassan',    date: '04 Jun 2026', grade: 'G6', regularDayOT: 3,   regularDayOTAfter9PM: 2,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 0, preApproved: false, status: 'Approved', clockIn: '09:00', clockOut: '23:00' },
  { empId: 'EMP-1006', name: 'Layla Hassan',    date: '09 Jun 2026', grade: 'G6', regularDayOT: 3,   regularDayOTAfter9PM: 0.5, publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 0, preApproved: true,  status: 'Approved', clockIn: '08:58', clockOut: '21:30' },
  { empId: 'EMP-1006', name: 'Layla Hassan',    date: '16 Jun 2026', grade: 'G6', regularDayOT: 3,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 2, preApproved: false, status: 'Pending',  clockIn: '09:02', clockOut: '22:00' },
  { empId: 'EMP-1006', name: 'Layla Hassan',    date: '22 Jun 2026', grade: 'G6', regularDayOT: 3,   regularDayOTAfter9PM: 0.5, publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 1, preApproved: true,  status: 'Pending',  clockIn: '09:00', clockOut: '21:30' },

  // ── Tom Bancroft  EMP-1007  (G3, shift 10:00–19:00) ───────────────────────
  { empId: 'EMP-1007', name: 'Tom Bancroft',    date: '05 Jun 2026', grade: 'G3', regularDayOT: 2,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 3, preApproved: true,  status: 'Approved', clockIn: '09:55', clockOut: '22:00' },
  { empId: 'EMP-1007', name: 'Tom Bancroft',    date: '12 Jun 2026', grade: 'G3', regularDayOT: 2,   regularDayOTAfter9PM: 0.5, publicHolidayOT: 0, totalOTApproved: 2.5, timeInLieu: 0, preApproved: false, status: 'Approved', clockIn: '10:00', clockOut: '21:30' },
  { empId: 'EMP-1007', name: 'Tom Bancroft',    date: '18 Jun 2026', grade: 'G3', regularDayOT: 2,   regularDayOTAfter9PM: 1.5, publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 1, preApproved: true,  status: 'Pending',  clockIn: '09:58', clockOut: '22:30' },
  { empId: 'EMP-1007', name: 'Tom Bancroft',    date: '24 Jun 2026', grade: 'G3', regularDayOT: 2,   regularDayOTAfter9PM: 3,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 2, preApproved: false, status: 'Pending',  clockIn: '10:00', clockOut: '24:00' },
];

// ─── HR overtime records ──────────────────────────────────────────────────────

export type HrStatus = 'Pending' | 'Approved' | 'Rejected';

export interface HrOvertimeRecord {
  empId: string;
  name: string;
  grade: string;
  date: string;
  clockIn: string;
  clockOut: string;
  regularDayOT: number;
  regularDayOTAfter9PM: number;
  publicHolidayOT: number;
  totalOTApproved: number;
  approvedByManager: string;
  hrStatus: HrStatus;
  rejectionComment?: string;
}

export const HR_OT_RECORDS: HrOvertimeRecord[] = [
  // EMP-1001
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', grade: 'G5', date: '02 Jun 2026', clockIn: '06:02', clockOut: '19:00', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   approvedByManager: 'Rama Krishna', hrStatus: 'Approved' },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', grade: 'G5', date: '05 Jun 2026', clockIn: '06:00', clockOut: '17:00', regularDayOT: 2,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2,   approvedByManager: 'Rama Krishna', hrStatus: 'Approved' },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', grade: 'G5', date: '10 Jun 2026', clockIn: '05:55', clockOut: '17:30', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2.5, approvedByManager: 'Rama Krishna', hrStatus: 'Pending'  },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', grade: 'G5', date: '15 Jun 2026', clockIn: '06:00', clockOut: '19:00', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   approvedByManager: 'Rama Krishna', hrStatus: 'Pending'  },

  // EMP-1004
  { empId: 'EMP-1004', name: 'Priya Nair',      grade: 'G7', date: '01 Jun 2026', clockIn: '07:02', clockOut: '22:00', regularDayOT: 5,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 6,   approvedByManager: 'Rama Krishna', hrStatus: 'Approved' },
  { empId: 'EMP-1004', name: 'Priya Nair',      grade: 'G7', date: '08 Jun 2026', clockIn: '07:05', clockOut: '19:30', regularDayOT: 3.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3.5, approvedByManager: 'Rama Krishna', hrStatus: 'Approved' },
  { empId: 'EMP-1004', name: 'Priya Nair',      grade: 'G7', date: '11 Jun 2026', clockIn: '07:00', clockOut: '19:00', regularDayOT: 3,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3,   approvedByManager: 'Rama Krishna', hrStatus: 'Pending'  },
  { empId: 'EMP-1004', name: 'Priya Nair',      grade: 'G7', date: '17 Jun 2026', clockIn: '06:55', clockOut: '20:30', regularDayOT: 4.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4.5, approvedByManager: 'Rama Krishna', hrStatus: 'Pending'  },

  // EMP-1005
  { empId: 'EMP-1005', name: 'Marcus Webb',     grade: 'G4', date: '03 Jun 2026', clockIn: '08:05', clockOut: '20:00', regularDayOT: 3,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3,   approvedByManager: 'Rama Krishna', hrStatus: 'Approved' },
  { empId: 'EMP-1005', name: 'Marcus Webb',     grade: 'G4', date: '08 Jun 2026', clockIn: '08:00', clockOut: '19:30', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2.5, approvedByManager: 'Rama Krishna', hrStatus: 'Approved' },
  { empId: 'EMP-1005', name: 'Marcus Webb',     grade: 'G4', date: '15 Jun 2026', clockIn: '08:10', clockOut: '20:00', regularDayOT: 3,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3,   approvedByManager: 'Rama Krishna', hrStatus: 'Pending'  },

  // EMP-1006
  { empId: 'EMP-1006', name: 'Layla Hassan',    grade: 'G6', date: '04 Jun 2026', clockIn: '09:00', clockOut: '23:00', regularDayOT: 3,   regularDayOTAfter9PM: 2,   publicHolidayOT: 0, totalOTApproved: 5,   approvedByManager: 'Rama Krishna', hrStatus: 'Approved' },
  { empId: 'EMP-1006', name: 'Layla Hassan',    grade: 'G6', date: '09 Jun 2026', clockIn: '08:58', clockOut: '21:30', regularDayOT: 3,   regularDayOTAfter9PM: 0.5, publicHolidayOT: 0, totalOTApproved: 3.5, approvedByManager: 'Rama Krishna', hrStatus: 'Approved' },
  { empId: 'EMP-1006', name: 'Layla Hassan',    grade: 'G6', date: '16 Jun 2026', clockIn: '09:02', clockOut: '22:00', regularDayOT: 3,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 4,   approvedByManager: 'Rama Krishna', hrStatus: 'Pending'  },

  // EMP-1007
  { empId: 'EMP-1007', name: 'Tom Bancroft',    grade: 'G3', date: '05 Jun 2026', clockIn: '09:55', clockOut: '22:00', regularDayOT: 2,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 3,   approvedByManager: 'Rama Krishna', hrStatus: 'Approved' },
  { empId: 'EMP-1007', name: 'Tom Bancroft',    grade: 'G3', date: '12 Jun 2026', clockIn: '10:00', clockOut: '21:30', regularDayOT: 2,   regularDayOTAfter9PM: 0.5, publicHolidayOT: 0, totalOTApproved: 2.5, approvedByManager: 'Rama Krishna', hrStatus: 'Pending'  },
  { empId: 'EMP-1007', name: 'Tom Bancroft',    grade: 'G3', date: '18 Jun 2026', clockIn: '09:58', clockOut: '22:30', regularDayOT: 2,   regularDayOTAfter9PM: 1.5, publicHolidayOT: 0, totalOTApproved: 3.5, approvedByManager: 'Rama Krishna', hrStatus: 'Pending'  },
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
// Per-employee fixed shifts (all workdays same shift):
//   EMP-1001  06:00–15:00   EMP-1004  07:00–16:00   EMP-1005  08:00–17:00
//   EMP-1006  09:00–18:00   EMP-1007  10:00–19:00

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

// Fixed shift start/end per employee id for June 2026
export const JUNE_2026_EMP_SHIFTS: Record<string, { start: string; end: string }> = {
  'EMP-1001': { start: '06:00', end: '15:00' },
  'EMP-1004': { start: '07:00', end: '16:00' },
  'EMP-1005': { start: '08:00', end: '17:00' },
  'EMP-1006': { start: '09:00', end: '18:00' },
  'EMP-1007': { start: '10:00', end: '19:00' },
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
    // shift ends 15:00; OT starts immediately after
    { day:  2, otStart: '15:00', otEnd: '19:00', otHours: 4,   clockIn: '06:02', clockOut: '19:00' },
    { day:  5, otStart: '15:00', otEnd: '17:00', otHours: 2,   clockIn: '06:00', clockOut: '17:00' },
    { day: 10, otStart: '15:00', otEnd: '17:30', otHours: 2.5, clockIn: '05:55', clockOut: '17:30' },
    { day: 15, otStart: '15:00', otEnd: '19:00', otHours: 4,   clockIn: '06:00', clockOut: '19:00' },
    { day: 19, otStart: '15:00', otEnd: '18:00', otHours: 3,   clockIn: '06:05', clockOut: '18:00' },
  ],
  'EMP-1004': [
    { day:  1, otStart: '16:00', otEnd: '22:00', otHours: 6,   clockIn: '07:02', clockOut: '22:00' },
    { day:  8, otStart: '16:00', otEnd: '19:30', otHours: 3.5, clockIn: '07:05', clockOut: '19:30' },
    { day: 11, otStart: '16:00', otEnd: '19:00', otHours: 3,   clockIn: '07:00', clockOut: '19:00' },
    { day: 17, otStart: '16:00', otEnd: '20:30', otHours: 4.5, clockIn: '06:55', clockOut: '20:30' },
    { day: 23, otStart: '16:00', otEnd: '21:00', otHours: 5,   clockIn: '07:00', clockOut: '21:00' },
  ],
  'EMP-1005': [
    { day:  3, otStart: '17:00', otEnd: '20:00', otHours: 3,   clockIn: '08:05', clockOut: '20:00' },
    { day:  8, otStart: '17:00', otEnd: '19:30', otHours: 2.5, clockIn: '08:00', clockOut: '19:30' },
    { day: 15, otStart: '17:00', otEnd: '20:00', otHours: 3,   clockIn: '08:10', clockOut: '20:00' },
    { day: 22, otStart: '17:00', otEnd: '20:30', otHours: 3.5, clockIn: '07:58', clockOut: '20:30' },
  ],
  'EMP-1006': [
    { day:  4, otStart: '18:00', otEnd: '23:00', otHours: 5,   clockIn: '09:00', clockOut: '23:00' },
    { day:  9, otStart: '18:00', otEnd: '21:30', otHours: 3.5, clockIn: '08:58', clockOut: '21:30' },
    { day: 16, otStart: '18:00', otEnd: '22:00', otHours: 4,   clockIn: '09:02', clockOut: '22:00' },
    { day: 22, otStart: '18:00', otEnd: '21:30', otHours: 3.5, clockIn: '09:00', clockOut: '21:30' },
  ],
  'EMP-1007': [
    { day:  5, otStart: '19:00', otEnd: '22:00', otHours: 3,   clockIn: '09:55', clockOut: '22:00' },
    { day: 12, otStart: '19:00', otEnd: '21:30', otHours: 2.5, clockIn: '10:00', clockOut: '21:30' },
    { day: 18, otStart: '19:00', otEnd: '22:30', otHours: 3.5, clockIn: '09:58', clockOut: '22:30' },
    { day: 24, otStart: '19:00', otEnd: '24:00', otHours: 5,   clockIn: '10:00', clockOut: '24:00' },
  ],
};

// Build OT status lookup from MANAGER_OT_RECORDS for June 2026
function buildOtStatusMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of MANAGER_OT_RECORDS) {
    if (!r.date.includes('Jun 2026')) continue;
    const day = parseInt(r.date.split(' ')[0], 10);
    map.set(`${r.empId}-${day}`, r.status);
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

      if (!isWorkday) return { day, dayOfWeek, isWorkday };

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
