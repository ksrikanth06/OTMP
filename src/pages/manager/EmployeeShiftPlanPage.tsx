import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getDirectReports,
  getShiftDetails,
  MONTHS,
  HALF_HOUR_OPTIONS,
} from '@/services/dataService';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setOTAssignment, removeOTAssignment } from '@/store/slices/shiftSlice';
import { Avatar } from '@/components/common/Avatar';

// ─── Constants ────────────────────────────────────────────────────────────────


// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDecimal = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
};
const toBarPct = (hhmm: string) => (toDecimal(hhmm) / 24) * 100;

// ─── Types ────────────────────────────────────────────────────────────────────

interface OTEntry { otStart: string; otEnd: string; comments: string }

interface PopupState {
  day: number;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  otStart: string;
  otEnd: string;
  comments: string;
}

// ─── Shift bar (pure display) ─────────────────────────────────────────────────

function ShiftBar({
  shiftStart, shiftEnd, otStart, otEnd, onClick,
}: {
  shiftStart: string; shiftEnd: string;
  otStart?: string; otEnd?: string;
  onClick?: () => void;
}) {
  const sLeft  = toBarPct(shiftStart);
  const sWidth = toBarPct(shiftEnd) - sLeft;
  const oLeft  = otStart ? toBarPct(otStart) : null;
  const oWidth = otStart && otEnd ? Math.max(0, toBarPct(otEnd) - toBarPct(otStart)) : null;

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={onClick}
        className="relative h-9 w-full overflow-hidden rounded-lg border border-line bg-surface-sunken transition hover:border-brand/50 hover:ring-1 hover:ring-brand/30"
        title="Click to add / edit overtime"
      >
        {/* Shift */}
        <div className="absolute top-0 h-full bg-brand/20" style={{ left: `${sLeft}%`, width: `${sWidth}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-brand" style={{ left: `${sLeft}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-brand" style={{ left: `${sLeft + sWidth}%` }} />
        <div
          className="absolute inset-y-0 flex items-center justify-between px-1.5 text-[10px] font-semibold leading-none text-brand"
          style={{ left: `${sLeft}%`, width: `${sWidth}%` }}
        >
          <span>{shiftStart}</span>
          <span>{shiftEnd}</span>
        </div>
        {/* OT */}
        {oLeft !== null && oWidth !== null && oWidth > 0 && (
          <>
            <div className="absolute top-0 h-full bg-orange-300/50" style={{ left: `${oLeft}%`, width: `${oWidth}%` }} />
            <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: `${oLeft}%` }} />
            <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: `${oLeft + oWidth}%` }} />
            <div
              className="absolute inset-y-0 flex items-center justify-center text-[10px] font-bold leading-none text-orange-600"
              style={{ left: `${oLeft}%`, width: `${oWidth}%` }}
            >
              OT
            </div>
          </>
        )}
        {/* Hour ticks */}
        {[0, 6, 12, 18, 24].map((h) => (
          <div key={h} className="absolute top-0 h-full border-l border-line/50" style={{ left: `${(h / 24) * 100}%` }} />
        ))}
      </button>
      <div className="mt-0.5 flex justify-between text-[9px] text-content-muted">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{String(h).padStart(2, '0')}:00</span>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function EmployeeShiftPlanPage() {
  const navigate   = useNavigate();
  const { empId }  = useParams<{ empId: string }>();
  const user       = useAppSelector((state) => state.auth.user);
  const team       = user ? getDirectReports(user.id) : [];
  const employee   = team.find((m) => m.id === empId) ?? null;

  const today      = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const dispatch       = useAppDispatch();
  const allAssignments = useAppSelector((s) => s.shift.otAssignments);

  const [year, setYear]   = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [popup, setPopup]   = useState<PopupState | null>(null);
  const [otError, setOtError] = useState('');

  const otStore = useMemo(() => {
    const result: Record<string, OTEntry> = {};
    for (const a of allAssignments) {
      if (a.empId === empId && a.year === year && a.month === month) {
        result[`${a.empId}-${a.year}-${a.month}-${a.day}`] = { otStart: a.otStart, otEnd: a.otEnd, comments: a.comments };
      }
    }
    return result;
  }, [allAssignments, empId, year, month]);

  const years    = Array.from({ length: 3 }, (_, i) => todayYear - 1 + i);
  const workdays = employee ? getShiftDetails(employee.id, year, month).filter((r) => r.isWorkday) : [];

  const rowKey = (day: number) => `${empId}-${year}-${month}-${day}`;

  const openPopup = (rec: typeof workdays[0]) => {
    const key   = rowKey(rec.day);
    const saved = otStore[key];
    setOtError('');
    setPopup({
      day:        rec.day,
      date:       rec.date,
      shiftStart: rec.shiftStart!,
      shiftEnd:   rec.shiftEnd!,
      otStart:    saved?.otStart  ?? rec.otStartTime ?? '',
      otEnd:      saved?.otEnd    ?? rec.otEndTime   ?? '',
      comments:   saved?.comments ?? '',
    });
  };

  const savePopup = () => {
    if (!popup) return;
    if (popup.otStart || popup.otEnd) {
      if (!popup.otStart || !popup.otEnd) {
        setOtError('Please select both start and end time.');
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
        setOtError(`OT cannot overlap the shift (${popup.shiftStart}–${popup.shiftEnd}).`);
        return;
      }
    }
    if (popup.otStart && popup.otEnd) {
      dispatch(setOTAssignment({
        empId: empId!, year, month, day: popup.day,
        otStart: popup.otStart, otEnd: popup.otEnd, comments: popup.comments,
      }));
    } else {
      dispatch(removeOTAssignment({ empId: empId!, year, month, day: popup.day }));
    }
    setPopup(null);
  };

  // Popup bar geometry
  const pShiftLeft  = popup ? toBarPct(popup.shiftStart) : 0;
  const pShiftWidth = popup ? toBarPct(popup.shiftEnd) - pShiftLeft : 0;
  const pOtLeft     = popup?.otStart ? toBarPct(popup.otStart) : null;
  const pOtWidth    = popup?.otStart && popup?.otEnd
    ? Math.max(0, toBarPct(popup.otEnd) - toBarPct(popup.otStart)) : null;
  const pOtDuration = popup?.otStart && popup?.otEnd
    ? toDecimal(popup.otEnd) - toDecimal(popup.otStart) : 0;
  const pOtOverlaps = popup?.otStart && popup?.otEnd
    ? toDecimal(popup.otStart) < toDecimal(popup.shiftEnd) &&
      toDecimal(popup.otEnd)   > toDecimal(popup.shiftStart)
    : false;

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-content-muted">
        <p className="text-sm">Employee not found.</p>
        <button type="button" onClick={() => navigate('/home/team')} className="mt-4 text-sm text-brand underline">
          Back to team
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/home/team')}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-content-secondary transition hover:border-line-strong hover:text-content-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          My Team
        </button>
        <div className="flex items-center gap-3">
          <Avatar name={employee.displayName} size={40} />
          <div>
            <h1 className="font-display text-xl font-semibold text-content-primary">{employee.displayName}</h1>
            <p className="text-xs text-content-muted">{employee.jobTitle}</p>
          </div>
        </div>
      </div>

      {/* Controls + legend */}
      <div className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-surface-raised p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Month</span>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectClass}>
            {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Year</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-xs text-content-secondary">
            <span className="h-2.5 w-2.5 rounded-full bg-brand/60" /> Shift
          </span>
          <span className="flex items-center gap-1.5 text-xs text-content-secondary">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Overtime
          </span>
          <span className="text-xs text-content-muted">Click a bar to add / edit OT</span>
        </div>
      </div>

      {/* Shift plan table */}
      <div className="overflow-hidden rounded-card border border-line bg-surface-raised shadow-panel">
        <div className="border-b border-line bg-surface-overlay px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">
            Shift Plan — {MONTHS[month - 1]} {year}
          </p>
        </div>

        <div className="divide-y divide-line">
          {workdays.map((rec) => {
            const saved = otStore[rowKey(rec.day)];
            const otStart = saved?.otStart ?? rec.otStartTime;
            const otEnd   = saved?.otEnd   ?? rec.otEndTime;
            const hasOT   = !!(saved?.otStart ?? rec.otStartTime);

            return (
              <div key={rec.day} className="flex items-center gap-5 px-6 py-3">
                {/* Date */}
                <div className="w-14 shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content-muted">{rec.dayOfWeek}</p>
                  <p className="text-sm font-bold text-content-primary">{rec.day}</p>
                </div>

                {/* Bar */}
                <ShiftBar
                  shiftStart={rec.shiftStart!}
                  shiftEnd={rec.shiftEnd!}
                  otStart={otStart}
                  otEnd={otEnd}
                  onClick={() => openPopup(rec)}
                />

                {/* Summary */}
                <div className="w-20 shrink-0 text-right">
                  {hasOT ? (
                    <span className="inline-flex rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-600">
                      OT
                    </span>
                  ) : (
                    <span className="text-[11px] text-content-muted">{rec.shiftDurationHrs}h</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OT Popup */}
      {popup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm"
          onClick={() => setPopup(null)}
        >
          <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="w-full max-w-[460px] rounded-card border border-line bg-surface-raised p-6 shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Avatar name={employee.displayName} size={40} />
              <div>
                <p className="text-sm font-semibold text-content-primary">{employee.displayName}</p>
                <p className="text-xs text-content-muted">{popup.date}</p>
              </div>
            </div>

            {/* Shift bar preview */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Shift Hours</p>
            <div className="mt-2">
              <div className="relative h-9 overflow-hidden rounded-lg border border-line bg-surface-sunken">
                <div className="absolute top-0 h-full bg-brand/20" style={{ left: `${pShiftLeft}%`, width: `${pShiftWidth}%` }} />
                <div className="absolute top-0 h-full w-0.5 bg-brand" style={{ left: `${pShiftLeft}%` }} />
                <div className="absolute top-0 h-full w-0.5 bg-brand" style={{ left: `${pShiftLeft + pShiftWidth}%` }} />
                {pOtLeft !== null && pOtWidth !== null && pOtWidth > 0 && (
                  <>
                    <div className="absolute top-0 h-full bg-orange-300/50" style={{ left: `${pOtLeft}%`, width: `${pOtWidth}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: `${pOtLeft}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: `${pOtLeft + pOtWidth}%` }} />
                  </>
                )}
                {[0, 6, 12, 18, 24].map((h) => (
                  <div key={h} className="absolute top-0 h-full border-l border-line/50" style={{ left: `${(h / 24) * 100}%` }} />
                ))}
                {pShiftWidth > 8 && (
                  <div
                    className="absolute inset-y-0 flex items-center justify-between px-1.5 text-[10px] font-semibold text-brand"
                    style={{ left: `${pShiftLeft}%`, width: `${pShiftWidth}%` }}
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

            {/* OT selectors */}
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
                <p className={`mt-1.5 text-xs font-semibold ${pOtDuration >= 1 && !pOtOverlaps ? 'text-green-600' : 'text-brand'}`}>
                  {pOtDuration > 0
                    ? `Duration: ${pOtDuration % 1 === 0 ? pOtDuration : pOtDuration.toFixed(1)} hr${pOtDuration !== 1 ? 's' : ''}`
                    : 'End time must be after start time'}
                </p>
                {pOtOverlaps && (
                  <p className="mt-1 text-xs font-semibold text-brand">
                    OT cannot overlap the shift ({popup.shiftStart}–{popup.shiftEnd}).
                  </p>
                )}
              </>
            )}
            {otError && !pOtOverlaps && <p className="mt-1.5 text-xs font-semibold text-brand">{otError}</p>}
            {(popup.otStart || popup.otEnd) && (
              <button
                type="button"
                onClick={() => { setOtError(''); setPopup({ ...popup, otStart: '', otEnd: '' }); }}
                className="mt-2 text-xs text-content-muted underline hover:text-content-primary"
              >
                Clear overtime
              </button>
            )}

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
