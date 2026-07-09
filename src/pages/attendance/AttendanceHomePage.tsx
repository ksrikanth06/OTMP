import { AttendanceCalendarView } from '@/components/attendance/AttendanceCalendarView';
import { useAppSelector } from '@/store/hooks';

export function AttendanceHomePage() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-up">
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          My Attendance
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Viewing your daily clock-in and clock-out records. Change month to explore other periods.
        </p>
      </section>

      <AttendanceCalendarView empId={user.id} />
    </div>
  );
}
