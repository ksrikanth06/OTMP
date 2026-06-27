import { useState } from 'react';
import { getShiftDetails, MONTHS } from '@/services/dataService';
import type { ShiftRecord } from '@/services/dataService';
import { useAppSelector } from '@/store/hooks';
import { useAppDispatch } from '@/store/hooks';
import { respondToOTAssignment } from '@/store/slices/shiftSlice';

// ─── 24-hour timeline bar ─────────────────────────────────────────────────────

const HOUR_MARKERS = [0, 6, 12, 18, 24];
const HOUR_LABELS: Record<number, string> = { 0: '12AM', 6: '6AM', 12: '12PM', 18: '6PM', 24: '12AM' };

function toDecHours(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

function pct(hours: number): string {
  return `${(hours / 24) * 100}%`;
}

function HoursBar({ r }: { r: ShiftRecord }) {
  if (!r.isWorkday || !r.shiftStart || !r.shiftEnd) {
    return <span className="text-content-muted text-sm">—</span>;
  }

  const shiftStartH = toDecHours(r.shiftStart);
  const shiftEndH   = toDecHours(r.shiftEnd);
  const otStartH    = r.otStartTime ? toDecHours(r.otStartTime) : null;
  const otEndH      = r.otEndTime   ? toDecHours(r.otEndTime)   : null;

  const shiftColor = 'rgb(52 168 110 / 0.8)';   // light green  (--color-success)
  const otColor    = 'rgb(214 158 46)';           // amber        (--color-warning)
  const otTextColor = '#c49628';

  return (
    <div className="min-w-[300px] select-none">
      {/* 24-hour bar — diagonal stripes on background mark "no work" time */}
      <div
        className="relative h-6 overflow-hidden rounded-md border border-line"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent, transparent 5px, rgb(var(--color-line) / 0.3) 5px, rgb(var(--color-line) / 0.3) 6px)',
        }}
      >
        {/* Grid lines at 6, 12, 18 h */}
        {[6, 12, 18].map((h) => (
          <div
            key={h}
            className="absolute top-0 h-full w-px bg-line-strong"
            style={{ left: pct(h), opacity: 0.6 }}
          />
        ))}

        {/* Regular shift — light green */}
        <div
          className="absolute top-0 h-full"
          style={{ left: pct(shiftStartH), width: pct(shiftEndH - shiftStartH), backgroundColor: shiftColor }}
          title={`Shift: ${r.shiftStart} – ${r.shiftEnd} (9 hrs)`}
        />

        {/* OT block — amber; can be before, after, or continuous with regular shift */}
        {otStartH !== null && otEndH !== null && (
          <div
            className="absolute top-0 h-full"
            style={{ left: pct(otStartH), width: pct(otEndH - otStartH), backgroundColor: otColor }}
            title={`OT: ${r.otStartTime} – ${r.otEndTime} (${r.otHours} hrs)`}
          />
        )}
      </div>

      {/* Hour labels */}
      <div className="relative mt-1 h-3.5">
        {HOUR_MARKERS.map((h) => (
          <span
            key={h}
            className="absolute text-[9px] font-medium text-content-muted"
            style={{
              left: pct(h),
              transform: h === 0 ? 'none' : h === 24 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            {HOUR_LABELS[h]}
          </span>
        ))}
      </div>

      {/* Callout row */}
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: shiftColor }} />
          <span className="font-mono text-content-secondary">{r.shiftStart} – {r.shiftEnd}</span>
          <span className="text-content-muted">(9 hrs)</span>
        </span>

        {otStartH !== null && r.otStartTime && r.otEndTime && (
          <span className="flex items-center gap-1.5" style={{ color: otTextColor }}>
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: otColor }} />
            <span className="font-mono font-semibold">{r.otStartTime} – {r.otEndTime}</span>
            <span className="opacity-70">({r.otHours} hrs OT)</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MyShiftDetailsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const shiftOT = useAppSelector((s) => s.shift.otAssignments);

  const [year, setYear]   = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [changeModal, setChangeModal] = useState<{ day: number; date: string } | null>(null);
  const [changeReason, setChangeReason] = useState('');

  if (!user) return null;

  const records: ShiftRecord[] = getShiftDetails(user.id, year, month).map((r) => {
    if (!r.isWorkday) return r;
    const a = shiftOT.find(
      (x) => x.empId === user.id && x.year === year && x.month === month && x.day === r.day,
    );
    if (!a) {
      return { ...r, otHours: undefined, otStatus: undefined, otStartTime: undefined, otEndTime: undefined, totalExpectedHours: r.shiftDurationHrs };
    }
    const otH = Number((toDecHours(a.otEnd) - toDecHours(a.otStart)).toFixed(2));
    return { ...r, otHours: otH, otStatus: a.empStatus ?? 'Assigned', otStartTime: a.otStart, otEndTime: a.otEnd, totalExpectedHours: 9 + otH };
  });

  const handleAccept = (day: number) => {
    if (!user) return;
    dispatch(respondToOTAssignment({ empId: user.id, year, month, day, empStatus: 'Accepted' }));
  };

  const handleOpenChangeModal = (day: number, date: string) => {
    setChangeReason('');
    setChangeModal({ day, date });
  };

  const handleSubmitChangeRequest = () => {
    if (!user || !changeModal) return;
    dispatch(respondToOTAssignment({
      empId: user.id, year, month, day: changeModal.day,
      empStatus: 'ChangeRequested', changeReason,
    }));
    setChangeModal(null);
  };

  const workdays = records.filter((r) => r.isWorkday);
  const summary = {
    workingDays:      workdays.length,
    standardHrs:      workdays.length * 9,
    otHrsAssigned:    workdays.reduce((s, r) => s + (r.otHours ?? 0), 0),
    totalExpectedHrs: workdays.reduce((s, r) => s + (r.totalExpectedHours ?? 0), 0),
  };

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const handleYearChange = (y: number) => {
    setYear(y);
    setMonth((m) => Math.min(m, y === todayYear ? todayMonth : 12));
  };

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

  const otStatusChip = (status?: string) => {
    const cls =
      status === 'Approved'        ? 'bg-success/15 text-success'  :
      status === 'Rejected'        ? 'bg-danger/15 text-danger'    :
      status === 'Accepted'        ? 'bg-brand/15 text-brand'      :
      status === 'ChangeRequested' ? 'bg-danger/15 text-danger'    :
      'bg-warning/15 text-warning';
    const label =
      status === 'ChangeRequested' ? 'Change Requested' : status;
    return (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
        {label}
      </span>
    );
  };

  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-content-muted whitespace-nowrap border-b border-r border-line';
  const td = 'px-4 py-3.5 text-sm text-content-primary border-r border-line align-top';

  return (
    <div className="space-y-6 animate-fade-up">
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          My Shift Details
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Your assigned shift schedule and overtime assignments for the selected month.
        </p>
      </section>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-surface-raised p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Year</span>
          <select value={year} onChange={(e) => handleYearChange(Number(e.target.value))} className={selectClass}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Month</span>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectClass}>
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-content-secondary">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgb(52 168 110 / 0.8)' }} />
            Regular Shift
          </span>
          <span className="flex items-center gap-1.5 text-xs text-content-secondary">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgb(214 158 46)' }} />
            Overtime
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Working Days',       value: summary.workingDays,                             suffix: 'days', color: 'text-brand',           accent: 'bg-brand'   },
          { label: 'Standard Hours',     value: summary.standardHrs,                             suffix: 'hrs',  color: 'text-content-primary', accent: 'bg-line'    },
          { label: 'OT Hrs Assigned',    value: summary.otHrsAssigned,                           suffix: 'hrs',  color: 'text-warning',         accent: 'bg-warning' },
          { label: 'Total Expected Hrs', value: Math.round(summary.totalExpectedHrs * 10) / 10, suffix: 'hrs',  color: 'text-success',         accent: 'bg-success' },
        ].map(({ label, value, suffix, color, accent }) => (
          <div key={label} className="rounded-card border border-line bg-surface-raised p-5 shadow-panel">
            <div className={`h-1 w-8 rounded-full ${accent} mb-3 opacity-60`} />
            <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
            <p className="mt-0.5 text-[11px] text-content-muted">{suffix}</p>
            <p className="mt-1 text-xs text-content-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Shift table */}
      <div className="overflow-x-auto rounded-card border border-line bg-surface-raised shadow-panel">
        <table className="min-w-full">
          <thead className="bg-surface-overlay">
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Day</th>
              <th className={th}>Shift Timing</th>
              <th className={th}>Overtime Assignment</th>
              <th className={`${th} border-r-0`}>Hours Breakdown (24h)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {records.map((r) => {
              const isOff = !r.isWorkday;
              return (
                <tr key={r.date} className={isOff ? 'bg-surface-sunken/40' : ''}>

                  {/* Date */}
                  <td className={`${td} font-medium whitespace-nowrap ${isOff ? 'text-content-muted' : ''}`}>
                    {r.date}
                  </td>

                  {/* Day */}
                  <td className={`${td} whitespace-nowrap ${isOff ? 'text-content-muted' : 'text-content-secondary'}`}>
                    {r.dayOfWeek}
                  </td>

                  {/* Shift Timing */}
                  <td className={`${td} whitespace-nowrap`}>
                    {r.isWorkday ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-content-primary">{r.shiftStart}</span>
                        <span className="text-content-muted">–</span>
                        <span className="font-mono text-sm font-semibold text-content-primary">{r.shiftEnd}</span>
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                          9 hrs
                        </span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-overlay px-2.5 py-0.5 text-xs font-semibold text-content-muted">
                        Day Off
                      </span>
                    )}
                  </td>

                  {/* Overtime Assignment */}
                  <td className={`${td}`}>
                    {r.otHours !== undefined ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-content-primary">{r.otHours} hrs</span>
                          {otStatusChip(r.otStatus)}
                        </div>
                        <div className="font-mono text-xs text-content-secondary whitespace-nowrap">
                          {r.otStartTime}
                          <span className="mx-1 text-content-muted">–</span>
                          {r.otEndTime}
                        </div>
                        {r.otStatus === 'Assigned' && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              onClick={() => handleAccept(r.day)}
                              className="rounded-md bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success hover:bg-success/20 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleOpenChangeModal(r.day, r.date)}
                              className="rounded-md bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning hover:bg-warning/20 transition-colors"
                            >
                              Request Change
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-content-muted">—</span>
                    )}
                  </td>

                  {/* Hours Breakdown bar */}
                  <td className={`${td} border-r-0`}>
                    <HoursBar r={r} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Change Request Modal */}
      {changeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border border-line bg-surface-raised p-6 shadow-panel">
            <h2 className="font-display text-lg font-semibold text-content-primary">Request Schedule Change</h2>
            <p className="mt-1 text-sm text-content-secondary">
              {changeModal.date} — Overtime assignment
            </p>
            <textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Describe the reason for requesting a change…"
              rows={4}
              className="mt-4 w-full rounded-lg border border-line bg-surface-sunken px-3 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none resize-none"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setChangeModal(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-content-secondary hover:bg-surface-overlay transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitChangeRequest}
                disabled={!changeReason.trim()}
                className="rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-white hover:bg-warning/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
