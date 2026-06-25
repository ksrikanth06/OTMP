import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader } from '@/components/header/TopHeader';
import { SideNav } from '@/components/sidebar/SideNav';

/**
 * Full-screen application shell: fixed top header, left navigation, and a
 * scrollable content region filled by the matched child route. Collapses the
 * sidebar into a drawer below the lg breakpoint.
 */
export function DashboardLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-base bg-brand-sheen">
      <TopHeader navOpen={navOpen} onToggleNav={() => setNavOpen((open) => !open)} />
      <div className="flex flex-1 overflow-hidden">
        <SideNav open={navOpen} onNavigate={() => setNavOpen(false)} />
        <main className="scrollbar-slim flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
