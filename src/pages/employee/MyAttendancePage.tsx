import { useState } from 'react';
import { getEmployeeAttendance, MONTHS, DAY_NAMES } from '@/services/dataService';
import type { AttendanceRecord } from '@/services/dataService';
import { useAppSelector } from '@/store/hooks';
import { Modal } from '@/components/common/Modal';

// ─── Day Cell ────────────────────────────────────────────────────────────────

function DayCell({
  record,
  isToday,
  onClick,
}: {
  record: AttendanceRecord;
  isToday: boolean;
  onClick: () => void;
}) {
  const isPresent = record.status === 'Present';
  const isLeave   = record.status === 'Leave';
  const isWeekend = record.status === 'Weekend';
  const isHoliday = record.status === 'Holiday';
  const hasAttendance = !!(record.clockIn && record.clockOut);
  const isOTEligible = isPresent && (record.totalHours ?? 0) > 8.75;

  const cellBg =
    isWeekend ? 'bg-violet-500/10' :
    isLeave   ? 'bg-brand/5' :
    isHoliday ? 'bg-warning/5' :
    '';

  return (
    <div
      onClick={isPresent || (isWeekend && hasAttendance) ? onClick : undefined}
      className={[
        'relative flex min-h-[76px] flex-col border-b border-r border-line p-1.5 transition',
        cellBg,
        isPresent || (isWeekend && hasAttendance) ? 'cursor-pointer hover:bg-violet-500/20' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <span
          className={[
            'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
            isToday
              ? 'bg-brand text-content-on-brand'
              : isWeekend || isLeave || isHoliday
              ? 'text-content-muted'
              : 'text-content-primary',
          ].join(' ')}
        >
          {record.day}
        </span>

        {isWeekend && <span className="rounded bg-violet-500/15 px-1 py-px text-[8px] font-semibold text-violet-600">Public Holiday</span>}
        {isLeave   && <span className="rounded bg-brand-soft px-1 py-px text-[8px] font-semibold text-brand">Leave</span>}
        {isHoliday && <span className="rounded bg-warning/15 px-1 py-px text-[8px] font-semibold text-warning">Holiday</span>}
      </div>

      {(isPresent || (isWeekend && hasAttendance)) && (
        <div className="mt-1 flex-1 space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="w-4 text-[8px] font-semibold uppercase text-content-muted">In</span>
            <span className="font-mono text-[10px] font-bold text-success">{record.clockIn}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 text-[8px] font-semibold uppercase text-content-muted">Out</span>
            <span className="font-mono text-[10px] font-bold text-content-primary">{record.clockOut}</span>
          </div>
          {isOTEligible && (
            <span className="mt-0.5 inline-block rounded bg-warning/15 px-1 py-px text-[8px] font-bold text-warning leading-tight">
              OT Achieved
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function MyAttendancePage() {
  const user = useAppSelector((s) => s.auth.user);
  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay   = today.getDate();

  const [year, setYear]       = useState(todayYear);
  const [month, setMonth]     = useState(todayMonth);
  const [records, setRecords] = useState<AttendanceRecord[] | null>(() =>
    getEmployeeAttendance(user?.id ?? '', todayYear, todayMonth)
  );
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);

  if (!user) return null;

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const handleYearChange = (y: number) => {
    const clampedMonth = Math.min(month, y === todayYear ? todayMonth : 12);
    setYear(y);
    setMonth(clampedMonth);
    setRecords(getEmployeeAttendance(user.id, y, clampedMonth));
    setSelected(null);
  };

  const handleMonthChange = (m: number) => {
    setMonth(m);
    setRecords(getEmployeeAttendance(user.id, year, m));
    setSelected(null);
  };

  const summary = records
    ? {
        present: records.filter((r) => r.status === 'Present').length,
        leave:   records.filter((r) => r.status === 'Leave').length,
        weekend: records.filter((r) => r.status === 'Weekend' || r.status === 'Holiday').length,
        otDays:  records.filter((r) => r.hasOT).length,
      }
    : null;

  const startDow = records ? new Date(year, month - 1, 1).getDay() : 0;
  const leadingBlanks = Array.from({ length: startDow });

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-surface-raised p-6 shadow-panel">
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
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className={selectClass}
          >
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <p className="ml-auto text-xs text-content-muted">
          {MONTHS[month - 1]} {year}
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Days Present',  value: summary.present, color: 'text-success',       accent: 'bg-success' },
            { label: 'Days on Leave', value: summary.leave,   color: 'text-brand',         accent: 'bg-brand'   },
            { label: 'Public Holiday', value: summary.weekend, color: 'text-violet-600',    accent: 'bg-violet-500' },
            { label: 'OT Days',       value: summary.otDays,  color: 'text-warning',       accent: 'bg-warning' },
          ].map(({ label, value, color, accent }) => (
            <div key={label} className="rounded-card border border-line bg-surface-raised p-5 shadow-panel">
              <div className={`h-1 w-8 rounded-full ${accent} mb-3 opacity-60`} />
              <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
              <p className="mt-1 text-xs text-content-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      {records && (
        <div className="rounded-card border border-line bg-surface-raised shadow-panel overflow-hidden">
          {/* Legend */}
          <div className="flex items-center gap-5 border-b border-line px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-content-muted mr-2">Legend</p>
            {[
              { dot: 'bg-success',  label: 'Present' },
              { dot: 'bg-warning',  label: 'Overtime' },
              { dot: 'bg-brand',    label: 'Leave' },
              { dot: 'bg-violet-500', label: 'Public Holiday' },
            ].map(({ dot, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-xs text-content-secondary">{label}</span>
              </div>
            ))}
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-line bg-surface-overlay">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className={[
                  'border-r border-line py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.1em]',
                  d === 'Sun' || d === 'Sat' ? 'text-content-muted' : 'text-content-secondary',
                ].join(' ')}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 border-l border-t border-line">
            {leadingBlanks.map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[76px] border-b border-r border-line bg-surface-sunken/20" />
            ))}
            {records.map((r) => (
              <DayCell
                key={r.date}
                record={r}
                isToday={year === todayYear && month === todayMonth && r.day === todayDay}
                onClick={() => setSelected(r)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Day detail popup */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-card border border-line bg-surface-raised shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-content-primary">{selected.date}</h3>
                <p className="mt-0.5 text-xs text-content-muted">{selected.dayOfWeek}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-content-muted transition hover:bg-surface-overlay hover:text-content-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="divide-y divide-line px-5 py-1">
              {([
                ['Status',       <span key="s" className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">Present</span>],
                ['Clock In',     <span key="ci" className="font-mono font-bold text-success">{selected.clockIn}</span>],
                ['Clock Out',    <span key="co" className="font-mono font-bold text-content-primary">{selected.clockOut}</span>],
                ['Hours Worked', <span key="hw" className={`font-semibold ${(selected.totalHours ?? 0) > 8.75 ? 'text-warning' : 'text-content-primary'}`}>{selected.totalHours} hrs</span>],
              ] as [string, React.ReactNode][]).map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between py-3">
                  <span className="text-xs text-content-muted">{label}</span>
                  <span className="text-xs">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-line px-4 py-1.5 text-xs font-semibold text-content-secondary transition hover:bg-surface-overlay"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
