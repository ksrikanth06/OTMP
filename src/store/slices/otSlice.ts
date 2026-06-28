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
    managerApproveRecords(state, action: PayloadAction<{ keys: string[]; managerName: string }>) {
      const { keys, managerName } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.managerStatus = 'Approved';
        r.managerName   = managerName;
        delete r.managerRejectionComment;
        if (r.hrStatus === null) r.hrStatus = 'Pending';
      }
    },

    managerRejectRecords(state, action: PayloadAction<{ keys: string[]; comment: string }>) {
      const { keys, comment } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.managerStatus = 'Rejected';
        r.managerRejectionComment = comment;
        r.hrStatus = null;
        delete r.hrRejectionComment;
      }
    },

    managerApproveSingle(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
      managerName: string;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved, managerName } = action.payload;
      const rec = state.records.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      rec.regularDayOT = regularDayOT;
      rec.regularDayOTAfter9PM = regularDayOTAfter9PM;
      rec.publicHolidayOT = publicHolidayOT;
      rec.totalOTApproved = totalOTApproved;
      rec.managerStatus = 'Approved';
      rec.managerName   = managerName;
      delete rec.managerRejectionComment;
      if (rec.hrStatus === null) rec.hrStatus = 'Pending';
    },

    managerRejectSingle(state, action: PayloadAction<{
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
      rec.managerStatus = 'Rejected';
      rec.managerRejectionComment = comment;
      rec.hrStatus = null;
      delete rec.hrRejectionComment;
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

    hrApproveRecords(state, action: PayloadAction<{ keys: string[] }>) {
      const keySet = new Set(action.payload.keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.hrStatus = 'Approved';
        delete r.hrRejectionComment;
      }
    },

    hrRejectRecords(state, action: PayloadAction<{ keys: string[]; comment?: string }>) {
      const { keys, comment } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.records) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.hrStatus = 'Rejected';
        if (comment) r.hrRejectionComment = comment;
      }
    },
  },
});

export const {
  managerApproveRecords, managerRejectRecords,
  managerApproveSingle, managerRejectSingle, managerSaveOTHours,
  hrApproveRecords, hrRejectRecords,
} = otSlice.actions;

export default otSlice.reducer;
