/**
 * Thin re-export shim — all data and logic now lives in src/services/dataService.ts.
 * Kept so existing import paths continue to resolve without changes.
 */
export { authenticate, getDirectReports, demoAccounts } from '@/services/dataService';