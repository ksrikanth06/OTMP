import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { MANAGER_OT_RECORDS, HR_OT_RECORDS } from '@/services/mockData';
import type { OvertimeRecord, HrOvertimeRecord } from '@/services/mockData';

export const mkOTKey = (empId: string, date: string) => `${empId}|${date}`;

interface OTState {
  managerRecords: OvertimeRecord[];
  hrRecords: HrOvertimeRecord[];
}

const initialState: OTState = {
  managerRecords: MANAGER_OT_RECORDS.map((r) => ({ ...r })),
  hrRecords: HR_OT_RECORDS.map((r) => ({ ...r })),
};

function pushHRRecord(
  state: OTState,
  rec: OvertimeRecord,
  managerName: string,
  overrideHours?: { regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number },
) {
  const existing = state.hrRecords.find((r) => r.empId === rec.empId && r.date === rec.date);
  const hours = overrideHours ?? {
    regularDayOT: rec.regularDayOT,
    regularDayOTAfter9PM: rec.regularDayOTAfter9PM,
    publicHolidayOT: rec.publicHolidayOT,
    totalOTApproved: rec.totalOTApproved,
  };
  if (existing) {
    Object.assign(existing, hours);
  } else {
    state.hrRecords.push({
      empId: rec.empId, name: rec.name, grade: rec.grade, date: rec.date,
      clockIn: rec.clockIn, clockOut: rec.clockOut,
      ...hours,
      approvedByManager: managerName,
      hrStatus: 'Pending',
    });
  }
}

const otSlice = createSlice({
  name: 'ot',
  initialState,
  reducers: {
    managerApproveRecords(state, action: PayloadAction<{ keys: string[]; managerName: string }>) {
      const { keys, managerName } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.managerRecords) {
        if (!keySet.has(mkOTKey(r.empId, r.date))) continue;
        r.status = 'Approved';
        delete r.rejectionComment;
        pushHRRecord(state, r, managerName);
      }
    },

    managerRejectRecords(state, action: PayloadAction<{ keys: string[]; comment: string }>) {
      const { keys, comment } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.managerRecords) {
        if (keySet.has(mkOTKey(r.empId, r.date))) {
          r.status = 'Rejected';
          r.rejectionComment = comment;
        }
      }
    },

    managerApproveSingle(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
      managerName: string;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved, managerName } = action.payload;
      const rec = state.managerRecords.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      rec.regularDayOT = regularDayOT;
      rec.regularDayOTAfter9PM = regularDayOTAfter9PM;
      rec.publicHolidayOT = publicHolidayOT;
      rec.totalOTApproved = totalOTApproved;
      rec.status = 'Approved';
      delete rec.rejectionComment;
      pushHRRecord(state, rec, managerName, { regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved });
    },

    managerRejectSingle(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
      comment: string;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved, comment } = action.payload;
      const rec = state.managerRecords.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      rec.regularDayOT = regularDayOT;
      rec.regularDayOTAfter9PM = regularDayOTAfter9PM;
      rec.publicHolidayOT = publicHolidayOT;
      rec.totalOTApproved = totalOTApproved;
      rec.status = 'Rejected';
      rec.rejectionComment = comment;
    },

    managerSaveOTHours(state, action: PayloadAction<{
      empId: string; date: string;
      regularDayOT: number; regularDayOTAfter9PM: number; publicHolidayOT: number; totalOTApproved: number;
    }>) {
      const { empId, date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved } = action.payload;
      const rec = state.managerRecords.find((r) => r.empId === empId && r.date === date);
      if (!rec) return;
      rec.regularDayOT = regularDayOT;
      rec.regularDayOTAfter9PM = regularDayOTAfter9PM;
      rec.publicHolidayOT = publicHolidayOT;
      rec.totalOTApproved = totalOTApproved;
    },

    hrApproveRecords(state, action: PayloadAction<{ keys: string[] }>) {
      const keySet = new Set(action.payload.keys);
      for (const r of state.hrRecords) {
        if (keySet.has(mkOTKey(r.empId, r.date))) {
          r.hrStatus = 'Approved';
          delete r.rejectionComment;
        }
      }
    },

    hrRejectRecords(state, action: PayloadAction<{ keys: string[]; comment?: string }>) {
      const { keys, comment } = action.payload;
      const keySet = new Set(keys);
      for (const r of state.hrRecords) {
        if (keySet.has(mkOTKey(r.empId, r.date))) {
          r.hrStatus = 'Rejected';
          if (comment) r.rejectionComment = comment;
        }
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
