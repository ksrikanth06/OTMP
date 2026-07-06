import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getInitialOTRecords } from '@/services/dataService';
import type { OTHours, OTRecord } from '@/services/dataService';

export const mkOTKey = (empId: string, date: string) => `${empId}|${date}`;

interface OTState {
  records: OTRecord[];
}

const initialState: OTState = {
  records: getInitialOTRecords(),
};

const otSlice = createSlice({
  name: 'ot',
  initialState,
  reducers: {
    // ── L1 Line Manager actions ──────────────────────────────────────────────

    l1ApproveRecords(state, action: PayloadAction<{ keys: string[]; l1ManagerName: string }>) {
      const { keys, l1ManagerName } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.l1_approval_status = 'Approved';
        r.l1ManagerName = l1ManagerName;
        r.l1_approved_hours = { ...r.employee_submitted_hours };
        r.l1_comments = '';
        if (r.l2_approval_status === null) r.l2_approval_status = 'Pending';
      }
    },

    l1RejectRecords(state, action: PayloadAction<{ keys: string[]; comment: string }>) {
      const { keys, comment } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.l1_approval_status = 'Rejected';
        r.l1_comments = comment;
        r.l1_approved_hours = null;
        r.l2_approval_status = null;
        r.l2_comments = '';
      }
    },

    l1ApproveSingle(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
      l1ManagerName: string; l1_comments: string;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved, l1ManagerName, l1_comments } = action.payload;
      const rec = state.records.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      const approved: OTHours = { regularDayOT, regularDayOTAfter9PM, publicHolidayOT, total: totalOTApproved };
      rec.l1_approval_status = 'Approved';
      rec.l1ManagerName = l1ManagerName;
      rec.l1_approved_hours = approved;
      rec.l1_comments = l1_comments;
      if (rec.l2_approval_status === null) rec.l2_approval_status = 'Pending';
    },

    l1RejectSingle(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
      l1_comments: string;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved, l1_comments } = action.payload;
      const rec = state.records.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      rec.l1_approval_status = 'Rejected';
      rec.l1_comments = l1_comments;
      rec.l1_approved_hours = { regularDayOT, regularDayOTAfter9PM, publicHolidayOT, total: totalOTApproved };
      rec.l2_approval_status = null;
      rec.l2_comments = '';
    },

    managerSaveOTHours(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved } = action.payload;
      const rec = state.records.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      rec.l1_approved_hours = { regularDayOT, regularDayOTAfter9PM, publicHolidayOT, total: totalOTApproved };
    },

    // ── L2 Head of Department actions ────────────────────────────────────────

    l2ApproveRecords(state, action: PayloadAction<{ keys: string[]; l2ManagerName: string }>) {
      const { keys, l2ManagerName } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.l2_approval_status = 'Approved';
        r.l2ManagerName = l2ManagerName;
        r.l2_comments = '';
      }
    },

    l2RejectRecords(state, action: PayloadAction<{ keys: string[]; comment?: string }>) {
      const { keys, comment } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.l2_approval_status = 'Rejected';
        if (comment) r.l2_comments = comment;
      }
    },

    // ── Employee actions ─────────────────────────────────────────────────────

    employeeSubmitOT(state, action: PayloadAction<OTRecord>) {
      const { empId, date } = action.payload;
      const exists = state.records.some((r) => r.empId === empId && r.date === date);
      if (!exists) state.records.push(action.payload);
    },
  },
});

export const {
  l1ApproveRecords, l1RejectRecords,
  l1ApproveSingle, l1RejectSingle, managerSaveOTHours,
  l2ApproveRecords, l2RejectRecords,
  employeeSubmitOT,
} = otSlice.actions;

export default otSlice.reducer;
