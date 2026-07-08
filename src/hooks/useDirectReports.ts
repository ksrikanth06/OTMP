import { useEffect, useState } from 'react';
import { getDirectReports } from '@/services/dataService';
import type { AuthenticatedUser } from '@/types';

export function useDirectReports(managerId?: string): AuthenticatedUser[] {
  const [team, setTeam] = useState<AuthenticatedUser[]>([]);

  useEffect(() => {
    if (!managerId) {
      setTeam([]);
      return;
    }
    let cancelled = false;
    getDirectReports(managerId).then((result) => {
      if (!cancelled) setTeam(result);
    });
    return () => { cancelled = true; };
  }, [managerId]);

  return team;
}
