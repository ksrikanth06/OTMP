import { useMemo, useState } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { getDirectReports, getEmployeeShiftById, isEmployeeOnLeave, MONTHS, DAY_NAMES, HALF_HOUR_OPTIONS } from '@/services/dataService';
import { useAppSelector } from '@/store/hooks';
import { useAppDispatch } from '@/store/hooks';
import { setOTAssignment, removeOTAssignment } from '@/store/slices/shiftSlice';
import { AuthenticatedUser } from '@/types';

interface OTEntry { otStart: string; otEnd: string; comments: string; empStatus?: string; changeReason?: string }
interface PopupState {
  employee: AuthenticatedUser;
  shiftStart: string;
  shiftEnd:   string;
  day: number;
  otStart:  string;
  otEnd:    string;
  comments: string;
}

const toDecimal = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
};

export function ShiftPlanPage() {
  const user = useAppSelector((state) => state.auth.user);
  const team = user ? getDirectReports(user.id) : [];

  const today        = new Date();
  const todayYear    = today.getFullYear();
  const todayMonth   = today.getMonth() + 1;
  const todayDate    = today.getDate();

  const dispatch       = useAppDispatch();
  const allAssignments = useAppSelector((s) => s.shift.otAssignments);

  const [year, setYear]     = useState(todayYear);
  const [month, setMonth]   = useState(todayMonth);
  const [selectedDay, setSelectedDay] = useState<number>(todayDate);
  const [popup, setPopup]             = useState<PopupState | null>(null);
  const [otError, setOtError]         = useState('');

  const otStore = useMemo(() => {
    const result: Record<string, OTEntry> = {};
    for (const a of allAssignments) {
      if (a.year === year && a.month === month) {
        result[`${a.empId}-${a.day}`] = { otStart: a.otStart, otEnd: a.otEnd, comments: a.comments, empStatus: a.empStatus, changeReason: a.changeReason };
      }
    }
    return result;
  }, [allAssignments, year, month]);

  const years = Array.from({ length: 3 }, (_, i) => todayYear - 1 + i);

  const daysInMonth    = new Date(year, month, 0).getDate();
  const firstWeekDay   = new Date(year, month - 1, 1).getDay();
  const isCurrentMonth = year === todayYear && month === todayMonth;

  const selectedDow = new Date(year, month - 1, selectedDay).getDay();
  const isOffDay    = selectedDow === 0 || selectedDow === 6;

  const rowKey = (empId: string, day: number) => `${empId}-${day}`;

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const openPopup = (employee: AuthenticatedUser, day: number) => {
    const { startTime, endTime } = getEmployeeShiftById(employee.id, year, month);
    const key   = rowKey(employee.id, day);
    const saved = otStore[key];
    setOtError('');
    setPopup({
      employee, day,
      shiftStart: startTime,
      shiftEnd:   endTime,
      otStart:    saved?.otStart  ?? '',
      otEnd:      saved?.otEnd    ?? '',
      comments:   saved?.comments ?? '',
    });
  };

  const savePopup = () => {
    if (!popup) return;
    if (popup.otStart || popup.otEnd) {
      if (!popup.otStart || !popup.otEnd) {
        setOtError('Please select both start and end time for overtime.');
        return;
      }
      const duration = toDecimal(popup.otEnd) - toDecimal(popup.otStart);
      if (duration < 1) {
        setOtError('Overtime must be at least 1 hour.');
        return;
      }
      const overlaps =
        toDecimal(popup.otStart) < toDecimal(popup.shiftEnd) &&
        toDecimal(popup.otEnd)   > toDecimal(popup.shiftStart);
      if (overlaps) {
        setOtError(`OT hours cannot overlap with the shift (${popup.shiftStart}–${popup.shiftEnd}).`);
        return;
      }
    }
    if (popup.otStart && popup.otEnd) {
      dispatch(setOTAssignment({
        empId: popup.employee.id, year, month, day: popup.day,
        otStart: popup.otStart, otEnd: popup.otEnd, comments: popup.comments,
      }));
    } else {
      dispatch(removeOTAssignment({ empId: popup.employee.id, year, month, day: popup.day }));
    }
    setPopup(null);
  };

  // Bar geometry
  const toBarPct = (hhmm: string) => (toDecimal(hhmm) / 24) * 100;

  const shiftLeft  = popup ? toBarPct(popup.shiftStart) : 0;
  const shiftWidth = popup ? toBarPct(popup.shiftEnd) - shiftLeft : 0;
  const otLeft     = popup?.otStart ? toBarPct(popup.otStart) : null;
  const otWidth    = popup?.otStart && popup?.otEnd
    ? Math.max(0, toBarPct(popup.otEnd) - toBarPct(popup.otStart))
    : null;
  const otDuration = popup?.otStart && popup?.otEnd
    ? toDecimal(popup.otEnd) - toDecimal(popup.otStart)
    : 0;

  const otOverlapsShift = popup?.otStart && popup?.otEnd && popup.shiftStart && popup.shiftEnd
    ? toDecimal(popup.otStart) < toDecimal(popup.shiftEnd) &&
      toDecimal(popup.otEnd)   > toDecimal(popup.shiftStart)
    : false;

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

  return (
    <div className="space-y-6 animate-fade-up">
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          Shift Plan
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Each employee has a 9-hour shift within 04:00–22:00. Click an employee to allot overtime.
        </p>
      </section>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-surface-raised p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Year</span>
          <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setSelectedDay(1); }} className={selectClass}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Month</span>
          <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setSelectedDay(1); }} className={selectClass}>
            {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-xs text-content-secondary">
            <span className="h-2.5 w-2.5 rounded-full bg-brand/60" /> 9-hr shift (04:00–22:00 window)
          </span>
          <span className="flex items-center gap-1.5 text-xs text-content-secondary">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> OT allotted
          </span>
        </div>
      </div>

      {/* Calendar + detail */}
      <div className="flex gap-5 items-start">

        {/* Compact Calendar */}
        <div className="w-64 shrink-0 overflow-hidden rounded-card border border-line bg-surface-raised shadow-panel">
          <div className="grid grid-cols-7 border-b border-line">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-content-muted">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-line">
            {cells.map((day, idx) => {
              if (!day) return <div key={`blank-${idx}`} className="h-10 bg-surface-overlay/30" />;

              const dow        = idx % 7;
              const isDayOff   = dow === 0 || dow === 6;
              const isToday    = isCurrentMonth && day === todayDate;
              const isSelected = day === selectedDay;
              const hasOT      = !isDayOff && team.some((emp) => !!otStore[rowKey(emp.id, day)]);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDayOff}
                  onClick={() => !isDayOff && setSelectedDay(day)}
                  className={[
                    'relative flex h-10 w-full flex-col items-center justify-center gap-0.5 transition',
                    isDayOff
                      ? 'cursor-default bg-surface-sunken/60'
                      : isSelected
                      ? 'bg-brand-soft ring-1 ring-inset ring-brand'
                      : 'hover:bg-surface-overlay',
                  ].join(' ')}
                >
                  <span className={[
                    'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                    isDayOff
                      ? 'text-content-muted'
                      : isToday
                      ? 'bg-brand text-content-on-brand'
                      : isSelected
                      ? 'text-brand'
                      : 'text-content-primary',
                  ].join(' ')}>
                    {day}
                  </span>
                  {hasOT && (
                    <span className="h-1 w-1 rounded-full bg-orange-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shift detail panel */}
        <div className="flex-1 overflow-hidden rounded-card border border-line bg-surface-raised shadow-panel">
          <div className="border-b border-line bg-surface-overlay px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Shift Plan</p>
            <p className="mt-0.5 text-base font-semibold text-content-primary">
              {selectedDay} {MONTHS[month - 1]} {year}
            </p>
          </div>

          <div className="divide-y divide-line">
            {isOffDay ? (
              <div className="grid place-items-center px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-overlay text-2xl">
                  🗓
                </div>
                <p className="mt-3 text-sm font-semibold text-content-primary">Off Day</p>
                <p className="mt-1 text-xs text-content-muted">
                  No shift plan for {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][selectedDow]}s.
                </p>
              </div>
            ) : team.map((emp, idx) => {
              const { startTime, endTime } = getEmployeeShiftById(emp.id, year, month);
              const onLeave = isEmployeeOnLeave(idx, selectedDay);
              const ot      = otStore[rowKey(emp.id, selectedDay)];

              const sLeft  = toBarPct(startTime);
              const sWidth = toBarPct(endTime) - sLeft;
              const oLeft  = ot ? toBarPct(ot.otStart) : null;
              const oWidth = ot ? Math.max(0, toBarPct(ot.otEnd) - toBarPct(ot.otStart)) : null;

              return (
                <button
                  key={emp.id}
                  type="button"
                  disabled={onLeave}
                  onClick={() => !onLeave && openPopup(emp, selectedDay)}
                  className={[
                    'flex w-full items-center gap-4 px-5 py-3 text-left transition',
                    onLeave ? 'cursor-default' : 'hover:bg-surface-overlay',
                  ].join(' ')}
                >
                  <Avatar name={emp.displayName} size={32} />
                  <div className="w-32 shrink-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-content-primary">{emp.displayName}</p>
                    </div>
                    <p className="text-[11px] text-content-muted">{startTime}–{endTime}</p>
                    {ot && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        <span className="inline-flex rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-600 border border-orange-200">
                          OT {ot.otStart}–{ot.otEnd}
                        </span>
                        {ot.empStatus === 'Accepted' && (
                          <span className="inline-flex rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-success">
                            Accepted
                          </span>
                        )}
                        {ot.empStatus === 'ChangeRequested' && (
                          <span className="inline-flex rounded-full bg-danger/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-danger">
                            Change Req.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Shift bar */}
                  <div className="flex-1">
                    <div className="relative h-9 overflow-hidden rounded-lg border border-line bg-surface-sunken">
                      <div className="absolute top-0 h-full bg-brand/20" style={{ left: `${sLeft}%`, width: `${sWidth}%` }} />
                      <div className="absolute top-0 h-full w-0.5 bg-brand" style={{ left: `${sLeft}%` }} />
                      <div className="absolute top-0 h-full w-0.5 bg-brand" style={{ left: `${sLeft + sWidth}%` }} />
                      <div
                        className="absolute inset-y-0 flex items-center justify-between px-1.5 text-[10px] font-semibold text-brand leading-none"
                        style={{ left: `${sLeft}%`, width: `${sWidth}%` }}
                      >
                        <span>{startTime}</span>
                        <span>{endTime}</span>
                      </div>
                      {oLeft !== null && oWidth !== null && oWidth > 0 && (
                        <>
                          <div className="absolute top-0 h-full bg-orange-300/50" style={{ left: `${oLeft}%`, width: `${oWidth}%` }} />
                          <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: `${oLeft}%` }} />
                          <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: `${oLeft + oWidth}%` }} />
                          <div
                            className="absolute inset-y-0 flex items-center justify-center text-[10px] font-bold text-orange-600 leading-none"
                            style={{ left: `${oLeft}%`, width: `${oWidth}%` }}
                          >
                            OT
                          </div>
                        </>
                      )}
                      {[0, 6, 12, 18, 24].map((h) => (
                        <div key={h} className="absolute top-0 h-full border-l border-line/50" style={{ left: `${(h / 24) * 100}%` }} />
                      ))}
                    </div>
                    <div className="mt-0.5 flex justify-between text-[9px] text-content-muted">
                      {[0, 6, 12, 18, 24].map((h) => (
                        <span key={h}>{String(h).padStart(2, '0')}:00</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popup */}
      {popup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm"
          onClick={() => setPopup(null)}
        >
          <div className="flex min-h-full items-center justify-center p-6">
          <div
            className="w-full max-w-[440px] rounded-card border border-line bg-surface-raised p-6 shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Avatar name={popup.employee.displayName} size={40} />
              <div>
                <p className="text-sm font-semibold text-content-primary">{popup.employee.displayName}</p>
                <p className="text-xs text-content-muted">{popup.employee.jobTitle}</p>
              </div>
            </div>
            <p className="mt-0.5 text-xs text-content-muted">
              {popup.day} {MONTHS[month - 1]} {year}
            </p>

            {/* Shift bar — read-only */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Shift Hours</p>
            <div className="mt-2">
              <div className="relative h-9 overflow-hidden rounded-lg border border-line bg-surface-sunken">
                {/* Shift segment */}
                <div className="absolute top-0 h-full bg-brand/20" style={{ left: `${shiftLeft}%`, width: `${shiftWidth}%` }} />
                <div className="absolute top-0 h-full w-0.5 bg-brand" style={{ left: `${shiftLeft}%` }} />
                <div className="absolute top-0 h-full w-0.5 bg-brand" style={{ left: `${shiftLeft + shiftWidth}%` }} />

                {/* OT overlay */}
                {otLeft !== null && otWidth !== null && otWidth > 0 && (
                  <>
                    <div className="absolute top-0 h-full bg-orange-300/50" style={{ left: `${otLeft}%`, width: `${otWidth}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: `${otLeft}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: `${otLeft + otWidth}%` }} />
                  </>
                )}

                {/* Hour ticks */}
                {[0, 6, 12, 18, 24].map((h) => (
                  <div key={h} className="absolute top-0 h-full border-l border-line/50" style={{ left: `${(h / 24) * 100}%` }} />
                ))}

                {/* Shift label */}
                {shiftWidth > 8 && (
                  <div
                    className="absolute inset-y-0 flex items-center justify-between px-1.5 text-[10px] font-semibold text-brand"
                    style={{ left: `${shiftLeft}%`, width: `${shiftWidth}%` }}
                  >
                    <span>{popup.shiftStart}</span>
                    <span>{popup.shiftEnd}</span>
                  </div>
                )}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-content-muted">
                {[0, 6, 12, 18, 24].map((h) => <span key={h}>{String(h).padStart(2, '0')}:00</span>)}
              </div>
            </div>

            {/* Overtime allocation */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Allot Overtime</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs text-content-muted">Start time</p>
                <select
                  value={popup.otStart}
                  onChange={(e) => { setOtError(''); setPopup({ ...popup, otStart: e.target.value }); }}
                  className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  {HALF_HOUR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs text-content-muted">End time</p>
                <select
                  value={popup.otEnd}
                  onChange={(e) => { setOtError(''); setPopup({ ...popup, otEnd: e.target.value }); }}
                  className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  {HALF_HOUR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {popup.otStart && popup.otEnd && (
              <>
                <p className={`mt-1.5 text-xs font-semibold ${otDuration >= 1 && !otOverlapsShift ? 'text-green-600' : 'text-brand'}`}>
                  {otDuration > 0
                    ? `Duration: ${otDuration % 1 === 0 ? otDuration : otDuration.toFixed(1)} hr${otDuration !== 1 ? 's' : ''}`
                    : 'End time must be after start time'}
                </p>
                {otOverlapsShift && (
                  <p className="mt-1 text-xs font-semibold text-brand">
                    OT hours cannot overlap with the shift ({popup.shiftStart}–{popup.shiftEnd}).
                  </p>
                )}
              </>
            )}
            {otError && !otOverlapsShift && <p className="mt-1.5 text-xs font-semibold text-brand">{otError}</p>}
            {(popup.otStart || popup.otEnd) && (
              <button
                type="button"
                onClick={() => { setOtError(''); setPopup({ ...popup, otStart: '', otEnd: '' }); }}
                className="mt-2 text-xs text-content-muted underline hover:text-content-primary"
              >
                Clear overtime
              </button>
            )}

            {/* Employee Response */}
            {(() => {
              const a = allAssignments.find(
                (x) => x.empId === popup.employee.id && x.year === year && x.month === month && x.day === popup.day,
              );
              if (!a?.empStatus || a.empStatus === 'Assigned') return null;
              return (
                <div className={`mt-4 rounded-lg border px-3 py-2.5 ${a.empStatus === 'Accepted' ? 'border-success/30 bg-success/10' : 'border-danger/30 bg-danger/10'}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted mb-1">Employee Response</p>
                  <span className={`text-xs font-bold ${a.empStatus === 'Accepted' ? 'text-success' : 'text-danger'}`}>
                    {a.empStatus === 'Accepted' ? 'Accepted' : 'Change Requested'}
                  </span>
                  {a.changeReason && (
                    <p className="mt-1 text-xs text-content-secondary">{a.changeReason}</p>
                  )}
                </div>
              );
            })()}

            {/* Comments */}
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Comments</p>
            <textarea
              rows={3}
              value={popup.comments}
              maxLength={400}
              onChange={(e) => setPopup({ ...popup, comments: e.target.value })}
              placeholder="Reason for overtime allocation…"
              className="mt-2 w-full resize-none rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
            />

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={savePopup}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong">
                Save
              </button>
              <button type="button" onClick={() => setPopup(null)}
                className="flex-1 rounded-lg border border-line py-2 text-sm font-semibold text-content-secondary transition hover:border-line-strong hover:text-content-primary">
                Cancel
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}