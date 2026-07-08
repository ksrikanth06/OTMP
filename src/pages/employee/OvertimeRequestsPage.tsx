import { useState, useEffect } from 'react';
import {
  getEmployeeAttendance,
  getEmployeeManagerId,
  getEmployeeGrade,
  MONTHS,
  REGULAR_OT_END_MINS,
} from '@/services/dataService';
import type { OTRecord, AttendanceRecord } from '@/services/dataService';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { employeeSubmitOT } from '@/store/slices/otSlice';
import { Modal } from '@/components/common/Modal';

// ─── Constants ────────────────────────────────────────────────────────────────

const REASONS = [
  'Project Deadline Requirement',
  'Critical System Maintenance',
  'Emergency Operational Support',
  'Client Deliverable Commitment',
  'Infrastructure Upgrade Work',
  'Regulatory Compliance Activity',
  'Staff Shortage Coverage',
  'Peak Workload Period',
  'Cross-Team Dependency Work',
  'Management-Directed Priority',
  'Other',
];
const OTHER_IDX = REASONS.length - 1;

const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── OT breakdown ─────────────────────────────────────────────────────────────

function toMins(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function calcOTBreakdown(clockIn: string, clockOut: string, totalHours: number) {
  if (totalHours <= 8.75) return { regularDayOT: 0, regularDayOTAfter9PM: 0, publicHolidayOT: 0 };
  const otStartMins = toMins(clockIn) + 8 * 60;
  const otEndMins   = toMins(clockOut);
  const regularOTMins  = otStartMins < REGULAR_OT_END_MINS
    ? Math.min(otEndMins, REGULAR_OT_END_MINS) - otStartMins : 0;
  const after9PMOTMins = otEndMins > REGULAR_OT_END_MINS
    ? otEndMins - Math.max(otStartMins, REGULAR_OT_END_MINS) : 0;
  const round = (n: number) => Math.round(n / 60 * 100) / 100;
  return {
    regularDayOT:         round(Math.max(0, regularOTMins)),
    regularDayOTAfter9PM: round(Math.max(0, after9PMOTMins)),
    publicHolidayOT:      0,
  };
}

// ─── Status chips ─────────────────────────────────────────────────────────────

function ApprovalChip({ label, status }: { label: string; status: string }) {
  const cls =
    status === 'Approved' ? 'bg-success/15 text-success' :
    status === 'Rejected' ? 'bg-danger/15 text-danger' :
    status === 'Awaiting' ? 'bg-surface-overlay text-content-muted' :
    'bg-warning/15 text-warning';
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-bold uppercase tracking-wide text-content-muted">{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status}</span>
    </div>
  );
}

// ─── Approval timeline (for detail popup) ────────────────────────────────────

type StepState = 'done' | 'rejected' | 'pending' | 'waiting';

const STEP_DOT: Record<StepState, string> = {
  done:    'bg-success border-success text-white',
  rejected:'bg-danger  border-danger  text-white',
  pending: 'bg-warning border-warning text-white',
  waiting: 'bg-surface-overlay border-line text-content-muted',
};
const STEP_LINE: Record<StepState, string> = {
  done: 'bg-success', rejected: 'bg-danger', pending: 'bg-line', waiting: 'bg-line',
};
const STEP_CHIP: Record<StepState, string> = {
  done:    'bg-success/15 text-success',
  rejected:'bg-danger/15  text-danger',
  pending: 'bg-warning/15 text-warning',
  waiting: 'bg-surface-overlay text-content-muted',
};
const STEP_LABEL: Record<StepState, string> = {
  done: 'Approved', rejected: 'Rejected', pending: 'Pending', waiting: 'Awaiting',
};

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
  if (state === 'rejected') return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
  if (state === 'pending') return <span className="h-2 w-2 rounded-full bg-white" />;
  return <span className="h-2 w-2 rounded-full bg-content-muted/40" />;
}

function ApprovalStep({ role, state, name, comment, isLast }: {
  role: string; state: StepState; name?: string; comment?: string; isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${STEP_DOT[state]}`}>
          <StepIcon state={state} />
        </div>
        {!isLast && <div className={`mt-1 w-0.5 flex-1 min-h-[28px] rounded-full ${STEP_LINE[state]}`} />}
      </div>
      <div className={`${isLast ? '' : 'pb-4'} min-w-0 flex-1`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-content-primary">{role}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STEP_CHIP[state]}`}>
            {STEP_LABEL[state]}
          </span>
        </div>
        {name && <p className="mt-0.5 text-xs text-content-muted">{name}</p>}
        {comment && (
          <p className="mt-1 rounded bg-surface-sunken px-2 py-1.5 text-xs text-content-secondary">{comment}</p>
        )}
      </div>
    </div>
  );
}

// ─── Close button ─────────────────────────────────────────────────────────────

function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-2 shrink-0 rounded-lg p-1 text-content-muted transition hover:bg-surface-overlay hover:text-content-primary"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OvertimeRequestsPage() {
  const user       = useAppSelector((s) => s.auth.user);
  const allRecords = useAppSelector((s) => s.ot.records);
  const dispatch   = useAppDispatch();

  const today      = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  // Filters
  const [year,  setYear]  = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);

  // Apply popup
  const [applyTarget,   setApplyTarget]   = useState<AttendanceRecord | null>(null);
  const [reasonIdx,     setReasonIdx]     = useState<number | null>(null);
  const [customReason,  setCustomReason]  = useState('');
  const [applySuccess,  setApplySuccess]  = useState(false);

  // Detail popup (for already-applied rows)
  const [detail, setDetail] = useState<OTRecord | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

  if (!user) return null;

  const years         = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth      = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const handleYearChange = (y: number) => {
    setYear(y);
    setMonth((m) => Math.min(m, y === todayYear ? todayMonth : 12));
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    getEmployeeAttendance(user.id, year, month).then(setAttendanceData);
  }, [user.id, year, month]);

  // Applied OT records for this month (from Redux)
  const appliedOT = allRecords.filter((r) => {
    const [, mon, yr] = r.date.split(' ');
    return r.empId === user.id && mon === MON_SHORT[month - 1] && Number(yr) === year;
  });
  const otByDate = new Map(appliedOT.map((r) => [r.date, r]));

  // OT-eligible attendance days: worked > 8.75 hrs OR already applied
  const attendance = attendanceData.filter(
    (r) => (r.status === 'Present' && (r.totalHours ?? 0) > 8.75) || otByDate.has(r.date),
  );

  // ── Apply popup helpers ────────────────────────────────────────────────────

  const otBreakdown = applyTarget?.clockIn && applyTarget?.clockOut
    ? calcOTBreakdown(applyTarget.clockIn, applyTarget.clockOut, applyTarget.totalHours ?? 0)
    : null;
  const totalOT = otBreakdown
    ? Math.round((otBreakdown.regularDayOT + otBreakdown.regularDayOTAfter9PM + otBreakdown.publicHolidayOT) * 100) / 100
    : 0;
  const canApply = reasonIdx !== null && (reasonIdx !== OTHER_IDX || customReason.trim().length > 0);

  const openApply = (rec: AttendanceRecord) => {
    setApplyTarget(rec);
    setReasonIdx(null);
    setCustomReason('');
    setApplySuccess(false);
  };

  const closeApply = () => {
    setApplyTarget(null);
    setReasonIdx(null);
    setCustomReason('');
    setApplySuccess(false);
  };

  const handleApply = () => {
    if (!canApply || !applyTarget || !otBreakdown) return;
    const newRecord: OTRecord = {
      empId:      user.id,
      managerId:  getEmployeeManagerId(user.id),
      name:       user.displayName,
      grade:      getEmployeeGrade(user.id),
      entity:     user.entity,
      department: user.department,
      date:       applyTarget.date,
      clockIn:    applyTarget.clockIn ?? '',
      clockOut:   applyTarget.clockOut ?? '',
      preApproved: false,
      employee_submit_status: 'Submitted',
      employee_submitted_hours: {
        regularDayOT:         otBreakdown.regularDayOT,
        regularDayOTAfter9PM: otBreakdown.regularDayOTAfter9PM,
        publicHolidayOT:      otBreakdown.publicHolidayOT,
        total:                totalOT,
      },
      l1_approval_status: 'Pending',
      l1_approved_hours:  null,
      l1_comments:        '',
      l2_approval_status: null,
      l2_comments:        '',
      reason: reasonIdx === OTHER_IDX ? customReason.trim() : REASONS[reasonIdx!],
    };
    dispatch(employeeSubmitOT(newRecord));
    setApplySuccess(true);
  };

  // ── Shared style tokens ────────────────────────────────────────────────────

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

  const STATUS_BG: Record<string, string> = {
    Present: 'bg-success/15 text-success',
    Weekend: 'bg-violet-500/15 text-violet-600',
    Leave:   'bg-brand/10 text-brand',
    Holiday: 'bg-amber-500/15 text-amber-600',
  };
  const STATUS_LABEL: Record<string, string> = {
    Present: 'Present', Weekend: 'Week Off', Leave: 'Leave', Holiday: 'Public Holiday',
  };

  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-content-muted whitespace-nowrap';
  const td = 'px-4 py-3.5 text-sm';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Header */}
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          My Overtime Work
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Your monthly attendance. Eligible days show an Apply Overtime button. Applied requests display L1 and HoD status.
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
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectClass}>
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-content-muted">
          <span>{MONTHS[month - 1]} {year}</span>
          {appliedOT.length > 0 && (
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">
              {appliedOT.length} applied
            </span>
          )}
        </div>
      </div>

      {/* Attendance table */}
      {attendance.length === 0 ? (
        <div className="grid place-items-center rounded-card border border-dashed border-line bg-surface-raised/40 px-6 py-16 text-center">
          <p className="text-sm text-content-muted">No records for {MONTHS[month - 1]} {year}.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface-raised shadow-panel">
          <table className="min-w-full">
            <thead className="border-b border-line bg-surface-overlay">
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Day</th>
                <th className={th}>Status</th>
                <th className={th}>Clock In</th>
                <th className={th}>Clock Out</th>
                <th className={th}>Hours</th>
                <th className={`${th} text-right pr-5`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {attendance.map((rec) => {
                const otRecord    = otByDate.get(rec.date);
                const isEligible  = rec.status === 'Present' && (rec.totalHours ?? 0) > 8.75 && !otRecord;
                const hasApplied  = !!otRecord;
                const rowBg       =
                  rec.status === 'Weekend' ? 'bg-violet-500/5' :
                  rec.status === 'Leave'   ? 'bg-brand/5' :
                  rec.status === 'Holiday' ? 'bg-amber-500/5' : '';

                const l2Label = otRecord?.l2_approval_status == null ? 'Awaiting' : otRecord.l2_approval_status;

                return (
                  <tr
                    key={rec.date}
                    className={[
                      'transition',
                      rowBg,
                      hasApplied ? 'cursor-pointer hover:bg-surface-overlay' : 'hover:bg-surface-overlay/40',
                    ].join(' ')}
                    onClick={hasApplied ? () => setDetail(otRecord!) : undefined}
                  >
                    {/* Date */}
                    <td className={`${td} font-mono text-xs font-medium text-content-primary`}>
                      {rec.date}
                    </td>

                    {/* Day */}
                    <td className={`${td} text-xs text-content-secondary`}>{rec.dayOfWeek}</td>

                    {/* Status */}
                    <td className={td}>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BG[rec.status] ?? 'bg-surface-overlay text-content-muted'}`}>
                        {STATUS_LABEL[rec.status] ?? rec.status}
                      </span>
                    </td>

                    {/* Clock In */}
                    <td className={`${td} font-mono text-xs ${rec.clockIn ? 'text-success' : 'text-content-muted'}`}>
                      {rec.clockIn ?? '—'}
                    </td>

                    {/* Clock Out */}
                    <td className={`${td} font-mono text-xs text-content-primary`}>
                      {rec.clockOut ?? '—'}
                    </td>

                    {/* Hours */}
                    <td className={`${td} font-mono text-xs ${(rec.totalHours ?? 0) > 8.75 ? 'font-bold text-warning' : 'text-content-primary'}`}>
                      {rec.totalHours != null ? `${rec.totalHours} h` : '—'}
                    </td>

                    {/* Action */}
                    <td
                      className={`${td} text-right pr-4`}
                      onClick={(e) => hasApplied && e.stopPropagation()}
                    >
                      {hasApplied ? (
                        <div className="flex items-center justify-end gap-2">
                          <ApprovalChip label="L1" status={otRecord!.l1_approval_status} />
                          <span className="text-content-muted text-xs">›</span>
                          <ApprovalChip label="HoD" status={l2Label} />
                        </div>
                      ) : isEligible ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openApply(rec); }}
                          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-content-on-brand transition hover:bg-brand-strong"
                        >
                          Apply Overtime
                        </button>
                      ) : (
                        <span className="text-xs text-content-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Apply Overtime popup ─────────────────────────────────────────────── */}
      {applyTarget && (
        <Modal onClose={closeApply}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-card border border-line bg-surface-raised shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-line px-6 py-4">
              <div>
                <h2 className="font-display text-base font-semibold text-content-primary">Apply for Overtime</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
                  <span className="font-medium text-content-secondary">{applyTarget.date}</span>
                  <span>·</span>
                  <span>In <span className="font-mono font-bold text-success">{applyTarget.clockIn}</span></span>
                  <span>·</span>
                  <span>Out <span className="font-mono font-bold text-content-primary">{applyTarget.clockOut}</span></span>
                  <span>·</span>
                  <span className="font-bold text-warning">{applyTarget.totalHours} hrs worked</span>
                </div>
              </div>
              <CloseBtn onClick={closeApply} />
            </div>

            {applySuccess ? (
              /* Success state */
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-success" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-content-primary">Overtime Applied</h3>
                <p className="mt-1 text-sm text-content-secondary">
                  Your request for <span className="font-semibold text-content-primary">{applyTarget.date}</span> has been submitted and is pending manager approval.
                </p>
                <div className="mt-5 divide-y divide-line rounded-lg border border-line bg-surface-overlay text-left text-xs">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-content-muted">Total OT</span>
                    <span className="font-bold text-content-primary">{totalOT} hrs</span>
                  </div>
                  <div className="flex items-start justify-between px-4 py-2.5">
                    <span className="text-content-muted">Reason</span>
                    <span className="font-semibold text-content-primary text-right max-w-[65%]">
                      {reasonIdx === OTHER_IDX ? customReason : REASONS[reasonIdx ?? 0]}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeApply}
                  className="mt-5 rounded-lg bg-brand px-8 py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-5 px-6 py-5">
                {/* OT Hours breakdown */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">
                    OT Hours Breakdown
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ['Reg Day OT',    otBreakdown?.regularDayOT         ?? 0],
                      ['Non-Reg OT',    otBreakdown?.regularDayOTAfter9PM ?? 0],
                      ['Holiday OT',    otBreakdown?.publicHolidayOT      ?? 0],
                    ] as [string, number][]).map(([label, val]) => (
                      <div key={label} className="rounded-lg border border-line bg-surface-overlay px-3 py-2.5">
                        <p className="text-[10px] text-content-muted">{label}</p>
                        <p className="mt-0.5 text-base font-bold text-content-primary">{val} hrs</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-soft px-3 py-2.5 text-sm">
                    <span className="font-medium text-content-secondary">Total Overtime</span>
                    <span className="font-bold text-brand">{totalOT} hrs</span>
                  </div>
                </div>

                {/* Reason selector */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">
                    Reason for Overtime <span className="text-danger">*</span>
                  </label>
                  <select
                    value={reasonIdx ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReasonIdx(val === '' ? null : Number(val));
                      setCustomReason('');
                    }}
                    className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2.5 text-sm text-content-primary focus:border-brand focus:outline-none"
                  >
                    <option value="" disabled>Select a reason…</option>
                    {REASONS.map((reason, idx) => (
                      <option key={reason} value={idx}>{reason}</option>
                    ))}
                  </select>

                  {/* Custom reason textarea — only when Other is selected */}
                  {reasonIdx === OTHER_IDX && (
                    <textarea
                      rows={3}
                      placeholder="Describe the reason for this overtime request…"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      autoFocus
                      className="mt-2.5 w-full resize-none rounded-lg border border-line bg-surface-sunken px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
                    />
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={closeApply}
                    className="rounded-lg border border-line px-5 py-2 text-sm font-semibold text-content-secondary transition hover:bg-surface-overlay"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!canApply}
                    className="rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Detail popup (applied OT record) ────────────────────────────────── */}
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-card border border-line bg-surface-raised shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-content-primary">{detail.date}</h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-content-muted">
                  <span>In <span className="font-mono font-bold text-success">{detail.clockIn}</span></span>
                  <span>·</span>
                  <span>Out <span className="font-mono font-bold text-content-primary">{detail.clockOut}</span></span>
                </div>
              </div>
              <CloseBtn onClick={() => setDetail(null)} />
            </div>

            {(() => {
              const l1State: StepState =
                detail.l1_approval_status === 'Approved' ? 'done' :
                detail.l1_approval_status === 'Rejected' ? 'rejected' : 'pending';
              const l2State: StepState =
                l1State !== 'done' ? 'waiting' :
                detail.l2_approval_status === 'Approved' ? 'done' :
                detail.l2_approval_status === 'Rejected' ? 'rejected' : 'pending';

              return (
                <div className="space-y-4 px-5 py-4">
                  {/* Approval timeline */}
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted">Approval Status</p>
                    <div className="pl-1">
                      <ApprovalStep role="Employee" state="done" name={`Submitted on ${detail.date}`} />
                      <ApprovalStep
                        role="Line Manager (L1)"
                        state={l1State}
                        name={l1State === 'done' && detail.l1ManagerName ? `Reviewed by ${detail.l1ManagerName}` : undefined}
                        comment={l1State === 'rejected' ? detail.l1_comments : undefined}
                      />
                      <ApprovalStep role="Head of Department (L2)" state={l2State} isLast />
                    </div>
                  </div>

                  {/* OT Hours */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted">Submitted Hours</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ['Reg Day OT',  detail.employee_submitted_hours.regularDayOT],
                        ['Non-Reg OT',  detail.employee_submitted_hours.regularDayOTAfter9PM],
                        ['Holiday OT',  detail.employee_submitted_hours.publicHolidayOT],
                      ] as [string, number][]).map(([label, val]) => (
                        <div key={label} className="rounded-lg border border-line bg-surface-overlay px-3 py-2">
                          <p className="text-[10px] text-content-muted">{label}</p>
                          <p className="mt-0.5 text-sm font-bold text-content-primary">{val} hrs</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center rounded-lg bg-surface-overlay px-3 py-2 text-xs">
                      <span className="text-content-secondary">Total Submitted</span>
                      <span className="ml-2 font-bold text-content-primary">{detail.employee_submitted_hours.total} hrs</span>
                    </div>
                    {detail.l1_approved_hours && detail.l1_approved_hours.total !== detail.employee_submitted_hours.total && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-warning/8 border border-warning/20 px-3 py-2 text-xs">
                        <span className="text-content-muted">L1 adjusted to</span>
                        <span className="font-bold text-warning">{detail.l1_approved_hours.total} hrs</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end border-t border-line px-5 py-3">
              <button
                type="button"
                onClick={() => setDetail(null)}
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
