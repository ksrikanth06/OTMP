import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getInitialOTRecords } from '@/services/dataService';
import type { OTRecord } from '@/services/dataService';

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
        r.l1Status = 'Approved';
        r.l1ManagerName = l1ManagerName;
        delete r.l1RejectionComment;
        if (r.l2Status === null) r.l2Status = 'Pending';
      }
    },

    l1RejectRecords(state, action: PayloadAction<{ keys: string[]; comment: string }>) {
      const { keys, comment } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.l1Status = 'Rejected';
        r.l1RejectionComment = comment;
        r.l2Status = null;
        delete r.l2RejectionComment;
      }
    },

    l1ApproveSingle(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
      l1ManagerName: string;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved, l1ManagerName } = action.payload;
      const rec = state.records.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      rec.regularDayOT = regularDayOT;
      rec.regularDayOTAfter9PM = regularDayOTAfter9PM;
      rec.publicHolidayOT = publicHolidayOT;
      rec.totalOTApproved = totalOTApproved;
      rec.l1Status = 'Approved';
      rec.l1ManagerName = l1ManagerName;
      delete rec.l1RejectionComment;
      if (rec.l2Status === null) rec.l2Status = 'Pending';
    },

    l1RejectSingle(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
      comment: string;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved, comment } = action.payload;
      const rec = state.records.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      rec.regularDayOT = regularDayOT;
      rec.regularDayOTAfter9PM = regularDayOTAfter9PM;
      rec.publicHolidayOT = publicHolidayOT;
      rec.totalOTApproved = totalOTApproved;
      rec.l1Status = 'Rejected';
      rec.l1RejectionComment = comment;
      rec.l2Status = null;
      delete rec.l2RejectionComment;
    },

    managerSaveOTHours(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved } = action.payload;
      const rec = state.records.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      rec.regularDayOT = regularDayOT;
      rec.regularDayOTAfter9PM = regularDayOTAfter9PM;
      rec.publicHolidayOT = publicHolidayOT;
      rec.totalOTApproved = totalOTApproved;
    },

    // ── L2 Head of Department actions ────────────────────────────────────────

    l2ApproveRecords(state, action: PayloadAction<{ keys: string[]; l2ManagerName: string }>) {
      const { keys, l2ManagerName } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.l2Status = 'Approved';
        r.l2ManagerName = l2ManagerName;
        delete r.l2RejectionComment;
      }
    },

    l2RejectRecords(state, action: PayloadAction<{ keys: string[]; comment?: string }>) {
      const { keys, comment } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.l2Status = 'Rejected';
        if (comment) r.l2RejectionComment = comment;
      }
    },
  },
});

export const {
  l1ApproveRecords, l1RejectRecords,
  l1ApproveSingle, l1RejectSingle, managerSaveOTHours,
  l2ApproveRecords, l2RejectRecords,
} = otSlice.actions;

export default otSlice.reducer;
