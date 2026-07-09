import { Link, useLocation, useParams } from 'react-router-dom';
import { AttendanceCalendarView } from '@/components/attendance/AttendanceCalendarView';
import { Icon } from '@/components/common/Icon';

interface LocationState {
  displayName?: string;
  title?: string;
}

export function AttendanceEmployeeAttendancePage() {
  const { empId } = useParams<{ empId: string }>();
  const { displayName, title } = (useLocation().state as LocationState) ?? {};

  if (!empId) return null;

  return (
    <div className="space-y-6 animate-fade-up">
      <section>
        <Link
          to="/attendance/team"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-secondary transition hover:text-content-primary"
        >
          <Icon name="chevron-down" size={14} className="rotate-90" />
          Back to My Team
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          {displayName ?? `Employee ${empId}`}
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          {title ? `${title} · ` : ''}Daily clock-in and clock-out records. Change month to explore other periods.
        </p>
      </section>

      <AttendanceCalendarView empId={empId} />
    </div>
  );
}
