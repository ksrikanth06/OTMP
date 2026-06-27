import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import otReducer from './slices/otSlice';
import shiftReducer from './slices/shiftSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ot: otReducer,
    shift: shiftReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
