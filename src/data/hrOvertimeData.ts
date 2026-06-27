/**
 * Thin re-export shim — all data and logic now lives in src/services/dataService.ts.
 * Kept so existing import paths continue to resolve without changes.
 */
export type { HrStatus, HrOvertimeRecord, OtBreakdown } from '@/services/dataService';
export { calcOtPay, fmtAed } from '@/services/dataService';
export { HR_OT_RECORDS as DUMMY_HR_RECORDS } from '@/services/mockData';