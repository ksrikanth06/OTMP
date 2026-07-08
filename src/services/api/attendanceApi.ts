import apiClient from './apiClient';
import type { AttendanceRecord } from '@/services/dataService';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Raw punch event as returned by the biometric/device attendance feed.
// attType: 'P10' = clock in, 'P20' = clock out (other codes are ignored).
interface RawAttendancePunch {
  intUniqueId: number;
  empNo: string;
  device: string | null;
  mobNo: string | null;
  attType: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM:SS'
  status: string;
  eventRefno: string | null;
  timestamp: string;
}

const toHHMM = (time: string) => time.slice(0, 5);

function calcHours(clockIn: string, clockOut: string): number {
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  return Math.round(((outH + outM / 60) - (inH + inM / 60)) * 100) / 100;
}

// Groups raw punches by date, keeping the earliest clock-in and latest clock-out per day
// (handles multiple punches from breaks, device retries, etc).
function groupPunchesByDate(punches: RawAttendancePunch[]): Map<string, { clockIn?: string; clockOut?: string }> {
  const byDate = new Map<string, { clockIn?: string; clockOut?: string }>();

  for (const punch of punches) {
    const entry = byDate.get(punch.date) ?? {};
    const time = toHHMM(punch.time);

    if (punch.attType === 'P10' && (!entry.clockIn || time < entry.clockIn)) {
      entry.clockIn = time;
    } else if (punch.attType === 'P20' && (!entry.clockOut || time > entry.clockOut)) {
      entry.clockOut = time;
    }

    byDate.set(punch.date, entry);
  }

  return byDate;
}

// Builds a full calendar for the month from raw punch events. This endpoint only reports
// clock-in/out — it has no leave/holiday signal — so weekdays with no punches are left as
// 'Absent' (rendered as a blank, non-interactive cell) rather than guessed as leave/holiday.
function toAttendanceRecords(punches: RawAttendancePunch[], year: number, month: number): AttendanceRecord[] {
  const monthShort = MONTHS_SHORT[month - 1];
  const punchesByDate = groupPunchesByDate(punches);
  const daysInMonth = new Date(year, month, 0).getDate();
  const results: AttendanceRecord[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dow = date.getDay();
    const dayName = DAY_NAMES[dow];
    const dateStr = `${String(day).padStart(2, '0')} ${monthShort} ${year}`;
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isWeekend = dow === 0 || dow === 6;

    const { clockIn, clockOut } = punchesByDate.get(isoDate) ?? {};
    const hasAttendance = !!(clockIn && clockOut);

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
      .get<RawAttendancePunch[]>(`/attendance/${empId}`, { params: { year, month } })
      .then((r) => toAttendanceRecords(r.data, year, month)),
};
