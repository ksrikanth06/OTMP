import apiClient from './apiClient';
import type { OTRecord } from '@/services/mockData';

export interface SubmitOTPayload {
  date: string;
  clockIn: string;
  clockOut: string;
  preApproved: boolean;
  reason: string;
  isPublicHoliday: boolean;
}

export interface L1ActionPayload {
  regularDayOT: number;
  regularDayOTAfter9PM: number;
  publicHolidayOT: number;
  totalOTApproved: number;
  l1_comments: string;
}

export interface BulkApproveResponse {
  approved: number;
  records: OTRecord[];
}

export interface BulkRejectResponse {
  rejected: number;
  records: OTRecord[];
}

function encodeDate(date: string): string {
  // "02 Jun 2026" → "02-Jun-2026"
  return date.replace(/ /g, '-');
}

export const overtimeApi = {
  // ── Employee ──────────────────────────────────────────────────────────────

  submit: (payload: SubmitOTPayload): Promise<OTRecord> =>
    apiClient.post<OTRecord>('/overtime', payload).then((r) => r.data),

  getForEmployee: (empId: string, year: number, month: number): Promise<OTRecord[]> =>
    apiClient
      .get<OTRecord[]>(`/overtime/employee/${empId}`, { params: { year, month } })
      .then((r) => r.data),

  getOne: (empId: string, date: string): Promise<OTRecord> =>
    apiClient
      .get<OTRecord>(`/overtime/${empId}/${encodeDate(date)}`)
      .then((r) => r.data),

  // ── L1 Line Manager ───────────────────────────────────────────────────────

  getForManager: (managerId: string, year: number, month: number): Promise<OTRecord[]> =>
    apiClient
      .get<OTRecord[]>(`/overtime/manager/${managerId}`, { params: { year, month } })
      .then((r) => r.data),

  saveL1Hours: (
    empId: string,
    date: string,
    hours: { regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number },
  ): Promise<OTRecord> =>
    apiClient
      .put<OTRecord>(`/overtime/${empId}/${encodeDate(date)}/l1/hours`, hours)
      .then((r) => r.data),

  l1ApproveSingle: (empId: string, date: string, payload: L1ActionPayload): Promise<OTRecord> =>
    apiClient
      .patch<OTRecord>(`/overtime/${empId}/${encodeDate(date)}/l1/approve`, payload)
      .then((r) => r.data),

  l1RejectSingle: (empId: string, date: string, payload: L1ActionPayload): Promise<OTRecord> =>
    apiClient
      .patch<OTRecord>(`/overtime/${empId}/${encodeDate(date)}/l1/reject`, payload)
      .then((r) => r.data),

  l1BulkApprove: (keys: string[]): Promise<BulkApproveResponse> =>
    apiClient
      .post<BulkApproveResponse>('/overtime/l1/approve-bulk', { keys })
      .then((r) => r.data),

  l1BulkReject: (keys: string[], comment: string): Promise<BulkRejectResponse> =>
    apiClient
      .post<BulkRejectResponse>('/overtime/l1/reject-bulk', { keys, comment })
      .then((r) => r.data),

  // ── L2 Head of Department ─────────────────────────────────────────────────

  getForHod: (hodId: string, year: number, month: number, l2Status?: string): Promise<OTRecord[]> =>
    apiClient
      .get<OTRecord[]>(`/overtime/hod/${hodId}`, { params: { year, month, l2Status } })
      .then((r) => r.data),

  l2ApproveSingle: (empId: string, date: string, l2_comments?: string): Promise<OTRecord> =>
    apiClient
      .patch<OTRecord>(`/overtime/${empId}/${encodeDate(date)}/l2/approve`, { l2_comments })
      .then((r) => r.data),

  l2RejectSingle: (empId: string, date: string, l2_comments: string): Promise<OTRecord> =>
    apiClient
      .patch<OTRecord>(`/overtime/${empId}/${encodeDate(date)}/l2/reject`, { l2_comments })
      .then((r) => r.data),

  l2BulkApprove: (keys: string[]): Promise<{ approved: number; skipped: number }> =>
    apiClient
      .post<{ approved: number; skipped: number }>('/overtime/l2/approve-bulk', { keys })
      .then((r) => r.data),

  l2BulkReject: (keys: string[], comment?: string): Promise<{ rejected: number }> =>
    apiClient
      .post<{ rejected: number }>('/overtime/l2/reject-bulk', { keys, comment })
      .then((r) => r.data),

  // ── HR ────────────────────────────────────────────────────────────────────

  getForHr: (
    year: number,
    month: number,
    filters?: { entity?: string; department?: string; managerId?: string; name?: string },
  ): Promise<OTRecord[]> =>
    apiClient
      .get<OTRecord[]>('/overtime/hr', { params: { year, month, ...filters } })
      .then((r) => r.data),

  exportCsv: (year: number, month: number, filters?: { entity?: string; department?: string }): Promise<Blob> =>
    apiClient
      .get<Blob>('/overtime/hr/export', { params: { year, month, ...filters }, responseType: 'blob' })
      .then((r) => r.data),
};
