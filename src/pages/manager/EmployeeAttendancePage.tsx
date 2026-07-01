import { useState } from 'react';
import { getDirectReports } from '@/config/credentials';
import { getEmployeeAttendance, MONTHS } from '@/services/dataService';
import type { AttendanceRecord } from '@/services/dataService';
import { useAppSelector } from '@/store/hooks';
import type { AuthenticatedUser } from '@/types';

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AttendanceRecord['status'] }) {
  const map: Record<AttendanceRecord['status'], { label: string; cls: string }> = {
    Present: { label: 'Present',        cls: 'bg-success/15 text-success' },
    Weekend: { label: 'Week Off',       cls: 'bg-violet-500/15 text-violet-600' },
    Leave:   { label: 'Leave',          cls: 'bg-brand/10 text-brand' },
    Holiday: { label: 'Public Holiday', cls: 'bg-amber-500/15 text-amber-600' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ─── OT badge ────────────────────────────────────────────────────────────────

function OtBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-content-muted">—</span>;
  const cls =
    status === 'Approved' ? 'bg-success/15 text-success' :
    status === 'Rejected' ? 'bg-red-500/15 text-red-600' :
    'bg-warning/15 text-warning';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function EmployeeAttendancePage() {
  const user = useAppSelector((s) => s.auth.user);
  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const team: AuthenticatedUser[] = user ? getDirectReports(user.id) : [];

  const [selectedEmpId, setSelectedEmpId] = useState<string>(team[0]?.id ?? '');
  const [year,  setYear]  = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const records: AttendanceRecord[] = selectedEmpId
    ? getEmployeeAttendance(selectedEmpId, year, month)
    : [];

  const summary = {
    present:  records.filter((r) => r.status === 'Present').length,
    leave:    records.filter((r) => r.status === 'Leave').length,
    weekOff:  records.filter((r) => r.status === 'Weekend').length,
    holidays: records.filter((r) => r.status === 'Holiday').length,
    otDays:   records.filter((r) => r.hasOT).length,
  };

  const handleYearChange = (y: number) => {
    const clampedMonth = Math.min(month, y === todayYear ? todayMonth : 12);
    setYear(y);
    setMonth(clampedMonth);
  };

  const selectedEmp = team.find((m) => m.id === selectedEmpId);

  if (!user) return null;

  if (team.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
        <section>
          <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
            Employee Attendance
          </h1>
        </section>
        <div className="rounded-card border border-dashed border-line bg-surface-raised/50 py-16 text-center">
          <p className="text-sm text-content-muted">No direct reports found.</p>
        </div>
      </div>
    );
  }

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

  return (
    <div className="space-y-6 animate-fade-up">
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          Employee Attendance
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          View monthly attendance records for your direct reports.
        </p>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-surface-raised p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Employee</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className={selectClass}
          >
            {team.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.displayName}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Year</span>
          <select value={year} onChange={(e) => handleYearChange(Number(e.target.value))} className={selectClass}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Month</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={selectClass}
          >
            {availableMonths.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>

        {selectedEmp && (
          <p className="ml-auto text-xs text-content-muted">
            {selectedEmp.jobTitle} · {MONTHS[month - 1]} {year}
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Days Present',    value: summary.present,  color: 'text-success',    accent: 'bg-success'    },
          { label: 'Days on Leave',   value: summary.leave,    color: 'text-brand',      accent: 'bg-brand'      },
          { label: 'Week Off',        value: summary.weekOff,  color: 'text-violet-600', accent: 'bg-violet-500' },
          { label: 'Public Holiday',  value: summary.holidays, color: 'text-amber-600',  accent: 'bg-amber-500'  },
          { label: 'OT Days',         value: summary.otDays,   color: 'text-warning',    accent: 'bg-warning'    },
        ].map(({ label, value, color, accent }) => (
          <div key={label} className="rounded-card border border-line bg-surface-raised p-5 shadow-panel">
            <div className={`h-1 w-8 rounded-full ${accent} mb-3 opacity-60`} />
            <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-content-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Attendance table */}
      <div className="rounded-card border border-line bg-surface-raised shadow-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-overlay">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-content-muted">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-content-muted">Day</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-content-muted">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-content-muted">Clock In</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-content-muted">Clock Out</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-content-muted">Hours</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-content-muted">OT Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {records.map((r) => {
                const isWeekendOrLeave = r.status === 'Weekend' || r.status === 'Leave';
                return (
                  <tr
                    key={r.date}
                    className={[
                      'transition',
                      r.status === 'Weekend' ? 'bg-violet-500/5' :
                      r.status === 'Leave'   ? 'bg-brand/5' :
                      r.status === 'Holiday' ? 'bg-amber-500/5' :
                      'hover:bg-surface-overlay',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-content-primary">{r.date}</td>
                    <td className="px-4 py-3 text-xs text-content-secondary">{r.dayOfWeek}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-success">
                      {r.clockIn ?? (isWeekendOrLeave ? '—' : '—')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-content-primary">
                      {r.clockOut ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-content-primary">
                      {r.totalHours != null ? (
                        <span className={r.totalHours > 8.75 ? 'font-bold text-warning' : ''}>
                          {r.totalHours} h
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.hasOT ? <OtBadge status={r.otStatus} /> : <span className="text-xs text-content-muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
