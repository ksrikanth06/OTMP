import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getInitialShiftPlan } from '@/services/dataService';

export interface OTAssignment {
  empId: string;
  year: number;
  month: number;
  day: number;
  otStart: string;
  otEnd: string;
  comments: string;
  empStatus?: 'Assigned' | 'Accepted' | 'ChangeRequested';
  changeReason?: string;
}

interface ShiftState {
  otAssignments: OTAssignment[];
}

const initialAssignments: OTAssignment[] = [];
for (const [empId, days] of Object.entries(getInitialShiftPlan())) {
  for (const rec of days) {
    if (rec.isWorkday && rec.otStart && rec.otEnd) {
      initialAssignments.push({
        empId, year: 2026, month: 6, day: rec.day,
        otStart: rec.otStart, otEnd: rec.otEnd, comments: '',
      });
    }
  }
}

const shiftSlice = createSlice({
  name: 'shift',
  initialState: { otAssignments: initialAssignments } as ShiftState,
  reducers: {
    setOTAssignment(state, action: PayloadAction<OTAssignment>) {
      const { empId, year, month, day } = action.payload;
      const idx = state.otAssignments.findIndex(
        (a) => a.empId === empId && a.year === year && a.month === month && a.day === day,
      );
      if (idx >= 0) {
        state.otAssignments[idx] = action.payload;
      } else {
        state.otAssignments.push(action.payload);
      }
    },
    removeOTAssignment(state, action: PayloadAction<{ empId: string; year: number; month: number; day: number }>) {
      const { empId, year, month, day } = action.payload;
      state.otAssignments = state.otAssignments.filter(
        (a) => !(a.empId === empId && a.year === year && a.month === month && a.day === day),
      );
    },
    respondToOTAssignment(state, action: PayloadAction<{
      empId: string; year: number; month: number; day: number;
      empStatus: 'Accepted' | 'ChangeRequested';
      changeReason?: string;
    }>) {
      const { empId, year, month, day, empStatus, changeReason } = action.payload;
      const a = state.otAssignments.find(
        (x) => x.empId === empId && x.year === year && x.month === month && x.day === day,
      );
      if (a) {
        a.empStatus = empStatus;
        a.changeReason = changeReason;
      }
    },
  },
});

export const { setOTAssignment, removeOTAssignment, respondToOTAssignment } = shiftSlice.actions;
export default shiftSlice.reducer;
