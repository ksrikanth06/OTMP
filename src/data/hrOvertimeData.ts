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
}

export const DUMMY_HR_RECORDS: HrOvertimeRecord[] = [
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', grade: 'G5', date: '02 Jun 2026', clockIn: '08:02', clockOut: '20:15', regularDayOT: 3,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 4,   approvedByManager: 'Rama Krishna',     hrStatus: 'Approved' },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', grade: 'G5', date: '05 Jun 2026', clockIn: '08:00', clockOut: '18:30', regularDayOT: 2,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2,   approvedByManager: 'Rama Krishna',     hrStatus: 'Approved' },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', grade: 'G5', date: '12 Jun 2026', clockIn: '07:45', clockOut: '21:20', regularDayOT: 0,   regularDayOTAfter9PM: 2.5, publicHolidayOT: 0, totalOTApproved: 2.5, approvedByManager: 'Rama Krishna',     hrStatus: 'Pending'  },
  { empId: 'EMP-1001', name: 'Srikanth Kadaru', grade: 'G5', date: '18 Jun 2026', clockIn: '08:00', clockOut: '20:05', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   approvedByManager: 'Rama Krishna',     hrStatus: 'Pending'  },

  { empId: 'EMP-1004', name: 'Priya Nair',      grade: 'G7', date: '01 Jun 2026', clockIn: '07:55', clockOut: '18:30', regularDayOT: 2,   regularDayOTAfter9PM: 0,   publicHolidayOT: 4, totalOTApproved: 6,   approvedByManager: 'Rama Krishna',     hrStatus: 'Approved' },
  { empId: 'EMP-1004', name: 'Priya Nair',      grade: 'G7', date: '06 Jun 2026', clockIn: '08:10', clockOut: '19:55', regularDayOT: 3.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3.5, approvedByManager: 'Rama Krishna',     hrStatus: 'Approved' },
  { empId: 'EMP-1004', name: 'Priya Nair',      grade: 'G7', date: '11 Jun 2026', clockIn: '09:00', clockOut: '21:30', regularDayOT: 0,   regularDayOTAfter9PM: 3,   publicHolidayOT: 0, totalOTApproved: 3,   approvedByManager: 'Rama Krishna',     hrStatus: 'Pending'  },
  { empId: 'EMP-1004', name: 'Priya Nair',      grade: 'G7', date: '20 Jun 2026', clockIn: '07:30', clockOut: '19:45', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 2, totalOTApproved: 4.5, approvedByManager: 'Rama Krishna',     hrStatus: 'Pending'  },

  { empId: 'EMP-1005', name: 'Marcus Webb',     grade: 'G4', date: '03 Jun 2026', clockIn: '09:10', clockOut: '21:45', regularDayOT: 0,   regularDayOTAfter9PM: 3,   publicHolidayOT: 0, totalOTApproved: 3,   approvedByManager: 'Rama Krishna',     hrStatus: 'Approved' },
  { empId: 'EMP-1005', name: 'Marcus Webb',     grade: 'G4', date: '08 Jun 2026', clockIn: '08:00', clockOut: '18:45', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2.5, approvedByManager: 'Rama Krishna',     hrStatus: 'Pending'  },
  { empId: 'EMP-1005', name: 'Marcus Webb',     grade: 'G4', date: '15 Jun 2026', clockIn: '08:15', clockOut: '20:50', regularDayOT: 1,   regularDayOTAfter9PM: 2,   publicHolidayOT: 0, totalOTApproved: 3,   approvedByManager: 'Rama Krishna',     hrStatus: 'Pending'  },

  { empId: 'EMP-1006', name: 'Layla Hassan',    grade: 'G6', date: '04 Jun 2026', clockIn: '07:30', clockOut: '19:00', regularDayOT: 5,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 5,   approvedByManager: 'Nadia Al Hashimi', hrStatus: 'Approved' },
  { empId: 'EMP-1006', name: 'Layla Hassan',    grade: 'G6', date: '09 Jun 2026', clockIn: '08:00', clockOut: '21:00', regularDayOT: 2,   regularDayOTAfter9PM: 1.5, publicHolidayOT: 0, totalOTApproved: 3.5, approvedByManager: 'Nadia Al Hashimi', hrStatus: 'Approved' },
  { empId: 'EMP-1006', name: 'Layla Hassan',    grade: 'G6', date: '17 Jun 2026', clockIn: '07:45', clockOut: '18:15', regularDayOT: 0,   regularDayOTAfter9PM: 0,   publicHolidayOT: 4, totalOTApproved: 4,   approvedByManager: 'Nadia Al Hashimi', hrStatus: 'Pending'  },

  { empId: 'EMP-1007', name: 'Tom Bancroft',    grade: 'G3', date: '05 Jun 2026', clockIn: '08:45', clockOut: '22:10', regularDayOT: 1,   regularDayOTAfter9PM: 2,   publicHolidayOT: 3, totalOTApproved: 6,   approvedByManager: 'Nadia Al Hashimi', hrStatus: 'Approved' },
  { empId: 'EMP-1007', name: 'Tom Bancroft',    grade: 'G3', date: '12 Jun 2026', clockIn: '08:00', clockOut: '18:45', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2.5, approvedByManager: 'Nadia Al Hashimi', hrStatus: 'Pending'  },
  { empId: 'EMP-1007', name: 'Tom Bancroft',    grade: 'G3', date: '19 Jun 2026', clockIn: '09:00', clockOut: '22:00', regularDayOT: 0,   regularDayOTAfter9PM: 3.5, publicHolidayOT: 0, totalOTApproved: 3.5, approvedByManager: 'Nadia Al Hashimi', hrStatus: 'Pending'  },
];

// G12 = 1000, G11 = 2000, ... G1 = 12000
export const GRADE_GROSS: Record<string, number> = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [`G${12 - i}`, (i + 1) * 1000]),
);

export interface OtBreakdown {
  grossPay: number;
  basicPayMonth: number;
  basicPayHour: number;
  regularOTPay: number;
  after9PMOTPay: number;
  holidayOTPay: number;
  totalOTPay: number;
}

export function calcOtPay(grade: string, regularOT: number, after9PM: number, holidayOT: number): OtBreakdown {
  const grossPay      = GRADE_GROSS[grade] ?? 0;
  const basicPayMonth = grossPay * 0.88;
  const basicPayHour  = (basicPayMonth * 12) / 365 / 8;
  const regularOTPay  = regularOT * basicPayHour * 1.25;
  const after9PMOTPay = after9PM  * basicPayHour * 1.25;
  const holidayOTPay  = holidayOT * basicPayHour * 1.75;
  const totalOTPay    = regularOTPay + after9PMOTPay + holidayOTPay;
  return { grossPay, basicPayMonth, basicPayHour, regularOTPay, after9PMOTPay, holidayOTPay, totalOTPay };
}

export const fmtAed = (n: number) =>
  n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
