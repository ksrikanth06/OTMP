import apiClient from './apiClient';
import type { ShiftRecord } from '@/services/dataService';

export interface TeamShiftEntry {
  empId: string;
  day: number;
  otStart: string;
  otEnd: string;
  comments: string;
}

export interface TeamShiftPlanRecord {
  day: number;
  dayOfWeek: string;
  isWorkday: boolean;
  isPublicHoliday: boolean;
  shiftStart?: string;
  shiftEnd?: string;
  otStart?: string;
  otEnd?: string;
  otHours?: number;
  otStatus?: string;
}

export const shiftApi = {
  getForEmployee: (empId: string, year: number, month: number): Promise<ShiftRecord[]> =>
    apiClient
      .get<ShiftRecord[]>(`/shifts/${empId}`, { params: { year, month } })
      .then((r) => r.data),

  getTeamPlan: (managerId: string, year: number, month: number): Promise<Record<string, TeamShiftPlanRecord[]>> =>
    apiClient
      .get<Record<string, TeamShiftPlanRecord[]>>(`/shifts/team/${managerId}`, { params: { year, month } })
      .then((r) => r.data),

  saveTeamOTTimes: (managerId: string, year: number, month: number, entries: TeamShiftEntry[]): Promise<void> =>
    apiClient
      .put(`/shifts/team/${managerId}`, { year, month, entries })
      .then(() => undefined),
};
