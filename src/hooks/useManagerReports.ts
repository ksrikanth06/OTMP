import { useEffect, useState } from 'react';
import { getManagerReports } from '@/services/dataService';
import type { ManagerReportNode } from '@/services/dataService';

export function useManagerReports(managerId?: string): ManagerReportNode[] {
  const [tree, setTree] = useState<ManagerReportNode[]>([]);

  useEffect(() => {
    if (!managerId) {
      setTree([]);
      return;
    }
    let cancelled = false;
    getManagerReports(managerId).then((result) => {
      if (!cancelled) setTree(result);
    });
    return () => { cancelled = true; };
  }, [managerId]);

  return tree;
}
