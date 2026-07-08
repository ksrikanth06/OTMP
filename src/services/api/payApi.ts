import apiClient from './apiClient';
import type { OtBreakdown } from '@/services/dataService';

export const payApi = {
  calculate: (
    grade: string,
    regularOT: number,
    after9PM: number,
    holidayOT: number,
  ): Promise<OtBreakdown & { grade: string }> =>
    apiClient
      .get<OtBreakdown & { grade: string }>('/pay/calculate', {
        params: { grade, regularOT, after9PM, holidayOT },
      })
      .then((r) => r.data),
};
