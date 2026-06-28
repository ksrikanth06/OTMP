/**
 * Thin re-export shim — all data and logic now lives in src/services/dataService.ts.
 * Kept so existing import paths continue to resolve without changes.
 */
export type { HrStatus, OTRecord, OtBreakdown } from '@/services/dataService';
export { calcOtPay, fmtAed } from '@/services/dataService';