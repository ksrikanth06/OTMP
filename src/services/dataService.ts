/**
 * dataService.ts — all data access goes through here.
 *
 * SWITCHING TO A LIVE API
 * -----------------------
 * 1. Set USE_MOCK = false (or: const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false').
 * 2. Fill in the `// TODO: API` branches with fetch() / axios calls.
 * 3. Mark the function async where the caller can await it.
 *    Fetch-button handlers in OvertimeApprovalsPage and HrApprovalsPage
 *    already follow this pattern.
 * 4. For synchronous callers (auth slice, ShiftPlanPage) wrap with useEffect
 *    or convert to Redux Thunks.
 */

import type { AuthenticatedUser, LoginCredentials } from '@/types';
import {
  DIRECTORY,
  OT_RECORDS,
  GRADE_GROSS,
  SHIFT_STARTS,
  JUNE_2026_SHIFT_PLAN,
  JUNE_2026_EMP_SHIFTS,
} from './mockData';

export type { HrStatus, ManagerStatus, OTRecord } from './mockData';
export { HR_ENTITIES, HR_DEPARTMENTS } from './mockData';

export interface AttendanceRecord {
  date: string;
  day: number;
  dayOfWeek: string;
  status: 'Present' | 'Weekend' | 'Leave' | 'Holiday';
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  hasOT?: boolean;
  otStatus?: string;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HALF_HOUR_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

export const REGULAR_OT_END_MINS = 22 * 60; // 22:00 — end of regular-hour OT window

const USE_MOCK = true;

// ─── Initial state seeds for Redux slices ────────────────────────────────────
// When USE_MOCK = false, slices start empty and populate via async thunks.

export function getInitialOTRecords() {
  if (USE_MOCK) return OT_RECORDS.map((r) => ({ ...r }));
  // TODO: API — fetch and seed via Redux thunk instead
  return [];
}

export function getInitialShiftPlan() {
  if (USE_MOCK) return JUNE_2026_SHIFT_PLAN;
  // TODO: API — fetch via Redux thunk instead
  return {} as typeof JUNE_2026_SHIFT_PLAN;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OtBreakdown {
  grossPay: number;
  grossPayPerHour: number;
  basicPayMonth: number;
  basicPayHour: number;
  regularOTPay: number;
  after9PMOTPay: number;
  holidayOTPay: number;
  totalOTPay: number;
}

export interface ShiftInfo {
  startTime: string;
  endTime: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const stripSensitive = ({ password: _p, managerId: _m, ...user }: (typeof DIRECTORY)[number]): AuthenticatedUser =>
  user;

export function authenticate(credentials: LoginCredentials): AuthenticatedUser | null {
  if (USE_MOCK) {
    const { username, password, role } = credentials;
    const normalised = username.trim().toLowerCase();
    const match = DIRECTORY.find(
      (r) => r.username.toLowerCase() === normalised && r.password === password && r.role === role,
    );
    return match ? stripSensitive(match) : null;
  }
  // TODO: API — return await post('/auth/login', credentials);
  return null;
}

export function getDirectReports(managerId: string): AuthenticatedUser[] {
  if (USE_MOCK) {
    return DIRECTORY.filter((r) => r.managerId === managerId).map(stripSensitive);
  }
  // TODO: API — return await get(`/users/${managerId}/direct-reports`);
  return [];
}

export const demoAccounts = DIRECTORY.filter((r) => !r.managerId).map(({ username, role }) => ({
  username,
  role,
}));

// ─── Manager overtime records ─────────────────────────────────────────────────

export function getManagerOvertimeRecords(managerId: string, _year: number, _month: number) {
  if (USE_MOCK) return OT_RECORDS.filter((r) => r.managerId === managerId);
  // TODO: API — return await get(`/overtime/manager/${managerId}?year=${_year}&month=${_month}`);
  return [];
}

// ─── HR overtime records ──────────────────────────────────────────────────────

export function getHrOvertimeRecords(_year: number, _month: number) {
  if (USE_MOCK) return OT_RECORDS.filter((r) => r.managerStatus === 'Approved');
  // TODO: API — return await get(`/overtime/hr?year=${_year}&month=${_month}`);
  return [];
}

// ─── Pay calculation (pure — no mock/API switch needed) ───────────────────────

export function calcOtPay(
  grade: string,
  regularOT: number,
  after9PM: number,
  holidayOT: number,
): OtBreakdown {
  const grossPay      = GRADE_GROSS[grade] ?? 0;
  const grossPayPerHour = (grossPay * 12) / 365 / 8; // annual gross to hourly
  const basicPayMonth = grossPay * 0.88;
  const basicPayHour  = (basicPayMonth * 12) / 365 / 8;
  const regularOTPay  = regularOT * basicPayHour * 1.25;
  const after9PMOTPay = after9PM  * basicPayHour * 1.5;
  const holidayOTPay  = (holidayOT * grossPayPerHour)+(holidayOT * basicPayHour * 0.5); // 1.5x for public holiday
  const totalOTPay    = regularOTPay + after9PMOTPay + holidayOTPay;
  return { grossPay, grossPayPerHour, basicPayMonth, basicPayHour, regularOTPay, after9PMOTPay, holidayOTPay, totalOTPay };
}

export const fmtAed = (n: number) =>
  n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Shift helpers ────────────────────────────────────────────────────────────

export function getEmployeeShift(empIndex: number): ShiftInfo {
  if (USE_MOCK) {
    const start = SHIFT_STARTS[empIndex % SHIFT_STARTS.length];
    const [h, m] = start.split(':').map(Number);
    const endH = h + 8;
    return {
      startTime: start,
      endTime: `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    };
  }
  // TODO: API — return await get(`/shifts/employee/${empIndex}`);
  return { startTime: '08:00', endTime: '16:00' };
}

export function isEmployeeOnLeave(empIndex: number, day: number): boolean {
  if (USE_MOCK) return (empIndex * 5 + day) % 9 === 3;
  // TODO: API — return await get(`/leave/employee/${empIndex}/day/${day}`);
  return false;
}

// ─── Employee attendance ──────────────────────────────────────────────────────

function calcHours(clockIn: string, clockOut: string): number {
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  return Math.round(((outH + outM / 60) - (inH + inM / 60)) * 100) / 100;
}

function offsetTime(base: string, offsetMins: number): string {
  const [h, m] = base.split(':').map(Number);
  const total = h * 60 + m + offsetMins;
  const hh = Math.floor(total / 60);
  const mm = ((total % 60) + 60) % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function getEmployeeAttendance(userId: string, year: number, month: number): AttendanceRecord[] {
  if (!USE_MOCK) return [];

  const empId      = userId;
  const monthShort = MONTHS_SHORT[month - 1];

  // ── June 2026: use explicit shift plan ──────────────────────────────────────
  if (year === 2026 && month === 6) {
    const plan = JUNE_2026_SHIFT_PLAN[empId] ?? [];
    return plan.map((rec) => {
      const dateStr = `${String(rec.day).padStart(2, '0')} Jun 2026`;
      if (!rec.isWorkday) {
        if (rec.clockIn && rec.clockOut) {
          // Worked on an off day — keep Weekend status so the cell renders as Public Holiday
          return {
            date: dateStr, day: rec.day, dayOfWeek: rec.dayOfWeek, status: 'Weekend' as const,
            clockIn: rec.clockIn, clockOut: rec.clockOut,
            totalHours: calcHours(rec.clockIn, rec.clockOut),
            hasOT: true,
            otStatus: rec.otStatus,
          };
        }
        return { date: dateStr, day: rec.day, dayOfWeek: rec.dayOfWeek, status: 'Weekend' as const };
      }
      return {
        date: dateStr, day: rec.day, dayOfWeek: rec.dayOfWeek, status: 'Present' as const,
        clockIn:    rec.clockIn,
        clockOut:   rec.clockOut,
        totalHours: calcHours(rec.clockIn!, rec.clockOut!),
        hasOT:      !!rec.otStart,
        otStatus:   rec.otStatus,
      };
    });
  }

  // ── Generic months: algorithmic generation ───────────────────────────────────
  const empNum = parseInt(userId.replace('EMP-', ''), 10);
  const empShift = JUNE_2026_EMP_SHIFTS[empId] ?? { start: '08:00', end: '17:00' };

  const otForMonth = OT_RECORDS.filter((r) => {
    if (r.empId !== empId) return false;
    const [, mon, yr] = r.date.split(' ');
    return mon === monthShort && Number(yr) === year;
  });

  const otByDay = new Map<number, (typeof OT_RECORDS)[0]>();
  otForMonth.forEach((r) => otByDay.set(parseInt(r.date.split(' ')[0], 10), r));

  const leaveDays  = new Set([(empNum % 20) + 1, ((empNum * 3) % 25) + 1]);
  const daysInMonth = new Date(year, month, 0).getDate();
  const results: AttendanceRecord[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date    = new Date(year, month - 1, day);
    const dow     = date.getDay();
    const dayName = DAY_NAMES[dow];
    const dateStr = `${String(day).padStart(2, '0')} ${monthShort} ${year}`;
    const isWeekend = dow === 0 || dow === 6;

    if (isWeekend) { results.push({ date: dateStr, day, dayOfWeek: dayName, status: 'Weekend' }); continue; }
    if (leaveDays.has(day)) { results.push({ date: dateStr, day, dayOfWeek: dayName, status: 'Leave' }); continue; }

    // Realistic clock-in: ±0–8 min early/late relative to shift start
    const inOffset  = ((day * 7 + empNum * 3) % 9) - 2;   // -2 to +6 min
    const outOffset = ((day * 5 + empNum * 11) % 10) - 2;  // -2 to +7 min
    const clockIn   = offsetTime(empShift.start, inOffset);

    const ot = otByDay.get(day);
    if (ot) {
      // OT record already has real clock-in/out derived from actual attendance
      results.push({ date: dateStr, day, dayOfWeek: dayName, status: 'Present', clockIn: ot.clockIn, clockOut: ot.clockOut, totalHours: calcHours(ot.clockIn, ot.clockOut), hasOT: true, otStatus: ot.managerStatus });
      continue;
    }
    const clockOut = offsetTime(empShift.end, outOffset);
    results.push({ date: dateStr, day, dayOfWeek: dayName, status: 'Present', clockIn, clockOut, totalHours: calcHours(clockIn, clockOut) });
  }

  return results;
}

export function getEmployeeOvertimeRequests(userId: string, year: number, month: number) {
  if (!USE_MOCK) return [];
  const monthShort = MONTHS_SHORT[month - 1];
  return OT_RECORDS.filter((r) => {
    if (r.empId !== userId) return false;
    const [, mon, yr] = r.date.split(' ');
    return mon === monthShort && Number(yr) === year;
  });
}

// ─── Employee shift details ───────────────────────────────────────────────────

export interface ShiftRecord {
  date: string;
  day: number;
  dayOfWeek: string;
  isWorkday: boolean;
  shiftStart?: string;
  shiftEnd?: string;
  shiftDurationHrs?: number;
  otHours?: number;
  otStatus?: string;
  otStartTime?: string;
  otEndTime?: string;
  totalExpectedHours?: number;
}

function addHrsToTime(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m + Math.round(hours * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function getShiftDetails(userId: string, year: number, month: number): ShiftRecord[] {
  if (!USE_MOCK) return [];

  const empId = userId;

  // ── June 2026: use explicit shift plan ──────────────────────────────────────
  if (year === 2026 && month === 6) {
    const plan = JUNE_2026_SHIFT_PLAN[empId] ?? [];
    return plan.map((rec) => {
      const dateStr = `${String(rec.day).padStart(2, '0')} Jun 2026`;
      if (!rec.isWorkday) return { date: dateStr, day: rec.day, dayOfWeek: rec.dayOfWeek, isWorkday: false };
      return {
        date: dateStr, day: rec.day, dayOfWeek: rec.dayOfWeek, isWorkday: true,
        shiftStart:        rec.shiftStart,
        shiftEnd:          rec.shiftEnd,
        shiftDurationHrs:  8,
        otHours:           rec.otHours,
        otStatus:          rec.otStatus,
        otStartTime:       rec.otStart,
        otEndTime:         rec.otEnd,
        totalExpectedHours: 8 + (rec.otHours ?? 0),
      };
    });
  }

  // ── Generic months: algorithmic generation ───────────────────────────────────
  const monthShort = MONTHS_SHORT[month - 1];
  const empNum     = parseInt(userId.replace('EMP-', ''), 10);

  const SHIFT_POOL = Array.from({ length: 10 }, (_, i) => `${String(4 + i).padStart(2, '0')}:00`);

  const otForMonth = OT_RECORDS.filter((r) => {
    if (r.empId !== empId) return false;
    const [, mon, yr] = r.date.split(' ');
    return mon === monthShort && Number(yr) === year;
  });
  const otByDay = new Map<number, (typeof OT_RECORDS)[0]>();
  otForMonth.forEach((r) => otByDay.set(parseInt(r.date.split(' ')[0], 10), r));

  const daysInMonth = new Date(year, month, 0).getDate();
  const results: ShiftRecord[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date    = new Date(year, month - 1, day);
    const dow     = date.getDay();
    const dayName = DAY_NAMES[dow];
    const dateStr = `${String(day).padStart(2, '0')} ${monthShort} ${year}`;

    if (dow === 0 || dow === 6) { results.push({ date: dateStr, day, dayOfWeek: dayName, isWorkday: false }); continue; }

    const shiftStart      = SHIFT_POOL[(empNum * 7 + day * 3) % SHIFT_POOL.length];
    const shiftEnd        = addHrsToTime(shiftStart, 8);
    const ot              = otByDay.get(day);
    const otHours         = ot?.totalOTApproved;
    const GAP_OPTIONS     = [0, 0, 30, 60];
    const gapMins         = ot ? GAP_OPTIONS[(day * 7 + empNum * 3) % GAP_OPTIONS.length] : 0;
    const otStartTime     = otHours !== undefined ? addHrsToTime(shiftEnd, gapMins / 60) : undefined;
    const otEndTime       = otHours !== undefined && otStartTime ? addHrsToTime(otStartTime, otHours) : undefined;

    results.push({
      date: dateStr, day, dayOfWeek: dayName, isWorkday: true,
      shiftStart, shiftEnd, shiftDurationHrs: 8,
      otHours, otStatus: ot?.managerStatus, otStartTime, otEndTime,
      totalExpectedHours: 8 + (otHours ?? 0),
    });
  }

  return results;
}

// Return the fixed shift for an employee by their empId for a given month/year.
// Falls back to index-based SHIFT_STARTS for months without explicit data.
export function getEmployeeShiftById(empId: string, year: number, month: number): ShiftInfo {
  if (USE_MOCK && year === 2026 && month === 6) {
    const s = JUNE_2026_EMP_SHIFTS[empId];
    if (s) return { startTime: s.start, endTime: s.end };
  }
  return { startTime: '08:00', endTime: '16:00' };
}

// Returns pre-populated OT keyed by `${userId}-${day}` — matches ShiftPlanPage's rowKey.
// Used to seed otStore so the manager sees existing OT data from the shift plan.
export function getTeamMonthOTStore(
  managerId: string,
  year: number,
  month: number,
): Record<string, { otStart: string; otEnd: string; comments: string }> {
  if (!USE_MOCK || !(year === 2026 && month === 6)) return {};

  const team  = getDirectReports(managerId);
  const store: Record<string, { otStart: string; otEnd: string; comments: string }> = {};

  for (const emp of team) {
    const plan = JUNE_2026_SHIFT_PLAN[emp.id] ?? [];
    for (const rec of plan) {
      if (rec.isWorkday && rec.otStart && rec.otEnd) {
        store[`${emp.id}-${rec.day}`] = { otStart: rec.otStart, otEnd: rec.otEnd, comments: '' };
      }
    }
  }

  return store;
}