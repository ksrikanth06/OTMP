import apiClient from './apiClient';
import type { AttendanceRecord } from '@/services/dataService';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// One row per day, as returned by the biometric/device attendance feed.
// date is 'YYYYMMDD'; punch times are 'HHMMSS' without zero-padding.
interface RawAttendanceDay {
  date: string;
  firstPunchType: string;
  firstPunchTime: string;
  firstPunchDevice: string;
  lastPunchType: string;
  lastPunchTime: string;
  lastPunchDevice: string;
  punchCount: number;
}

export interface ManagerReportNode {
  employeeId: string;
  displayName: string;
  emailAddress: string;
  title: string;
  level: number;
  children: ManagerReportNode[];
}

const toHHMM = (rawTime: string): string => {
  const padded = rawTime.padStart(6, '0');
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
};

function calcHours(clockIn: string, clockOut: string): number {
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  return Math.round(((outH + outM / 60) - (inH + inM / 60)) * 100) / 100;
}

// Builds a full calendar for the month from the day-level punch feed. This endpoint only
// reports clock-in/out — it has no leave/holiday signal — so weekdays with no punches are
// left as 'Absent' rather than guessed as leave/holiday.
function toAttendanceRecords(days: RawAttendanceDay[], year: number, month: number): AttendanceRecord[] {
  const monthShort = MONTHS_SHORT[month - 1];
  const byDate = new Map(days.map((d) => [d.date, d]));
  const daysInMonth = new Date(year, month, 0).getDate();
  const results: AttendanceRecord[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dow = date.getDay();
    const dayName = DAY_NAMES[dow];
    const dateStr = `${String(day).padStart(2, '0')} ${monthShort} ${year}`;
    const rawDateKey = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    const isWeekend = dow === 0 || dow === 6;

    const raw = byDate.get(rawDateKey);
    const hasAttendance = !!raw && raw.punchCount > 0;

    // The feed's "first"/"last" punch fields aren't reliably in chronological order,
    // so sort the two punch times ourselves rather than trust field order.
    let clockIn: string | undefined;
    let clockOut: string | undefined;
    if (hasAttendance && raw) {
      [clockIn, clockOut] = [toHHMM(raw.firstPunchTime), toHHMM(raw.lastPunchTime)].sort();
    }

    if (isWeekend) {
      results.push({
        date: dateStr, day, dayOfWeek: dayName, status: 'Weekend',
        ...(hasAttendance ? { clockIn, clockOut, totalHours: calcHours(clockIn!, clockOut!), hasOT: true } : {}),
      });
      continue;
    }

    if (hasAttendance) {
      results.push({
        date: dateStr, day, dayOfWeek: dayName, status: 'Present',
        clockIn, clockOut, totalHours: calcHours(clockIn!, clockOut!),
      });
      continue;
    }

    results.push({ date: dateStr, day, dayOfWeek: dayName, status: 'Absent' });
  }

  return results;
}

export const attendanceApi = {
  getForEmployee: (empId: string, year: number, month: number): Promise<AttendanceRecord[]> =>
    apiClient
      .get<ApiEnvelope<RawAttendanceDay[]>>('/employee/attendance', { params: { empId, year, month } })
      .then((r) => toAttendanceRecords(r.data.data, year, month)),

  getManagerReports: (managerId: string): Promise<ManagerReportNode[]> =>
    apiClient
      .get<ApiEnvelope<ManagerReportNode[]>>('/manager/reports', { params: { managerId } })
      .then((r) => r.data.data),
};
