import { useState } from 'react';
import { getEmployeeAttendance, MONTHS, REGULAR_OT_END_MINS } from '@/services/dataService';
import type { OTRecord, AttendanceRecord } from '@/services/dataService';
import { useAppSelector } from '@/store/hooks';
import { Modal } from '@/components/common/Modal';


type Tab = 'all' | 'pending' | 'approved' | 'rejected';

interface FormState {
  date: string;
  regularDayOT: string;
  regularDayOTAfter9PM: string;
  publicHolidayOT: string;
  notes: string;
}

const EMPTY: FormState = {
  date: '',
  regularDayOT: '',
  regularDayOTAfter9PM: '',
  publicHolidayOT: '',
  notes: '',
};

const maxDate = () => new Date().toISOString().split('T')[0];

// ─── Approval Metro Line ──────────────────────────────────────────────────────

type StepState = 'done' | 'rejected' | 'pending' | 'waiting';

const STEP_DOT: Record<StepState, string> = {
  done:    'bg-success border-success text-white',
  rejected:'bg-danger  border-danger  text-white',
  pending: 'bg-warning border-warning text-white',
  waiting: 'bg-surface-overlay border-line text-content-muted',
};
const STEP_LINE: Record<StepState, string> = {
  done:    'bg-success',
  rejected:'bg-danger',
  pending: 'bg-line',
  waiting: 'bg-line',
};
const STEP_CHIP: Record<StepState, string> = {
  done:    'bg-success/15 text-success',
  rejected:'bg-danger/15  text-danger',
  pending: 'bg-warning/15 text-warning',
  waiting: 'bg-surface-overlay text-content-muted',
};
const STEP_LABEL: Record<StepState, string> = {
  done:    'Approved',
  rejected:'Rejected',
  pending: 'Pending',
  waiting: 'Awaiting',
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

function ApprovalStep({
  role, state, name, comment, isLast,
}: {
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
          <p className="mt-1 rounded bg-surface-sunken px-2 py-1.5 text-xs text-content-secondary">
            {comment}
          </p>
        )}
      </div>
    </div>
  );
}


function toMins(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function calcOTBreakdown(clockIn: string, clockOut: string, totalHours: number) {
  const regularShiftMins = 8 * 60;
  if (totalHours <= 8.75) return { regularDayOT: 0, regularDayOTAfter9PM: 0, publicHolidayOT: 0 };
  const otMins = Math.round((totalHours - 8) * 60);
  if (otMins <= 0) return { regularDayOT: 0, regularDayOTAfter9PM: 0, publicHolidayOT: 0 };

  const otStartMins = toMins(clockIn) + regularShiftMins;
  const otEndMins   = toMins(clockOut);

  const regularOTMins =
    otStartMins < REGULAR_OT_END_MINS
      ? Math.min(otEndMins, REGULAR_OT_END_MINS) - otStartMins
      : 0;

  const after9PMOTMins =
    otEndMins > REGULAR_OT_END_MINS
      ? otEndMins - Math.max(otStartMins, REGULAR_OT_END_MINS)
      : 0;

  const round = (n: number) => Math.round(n / 60 * 100) / 100;
  return {
    regularDayOT:        round(Math.max(0, regularOTMins)),
    regularDayOTAfter9PM: round(Math.max(0, after9PMOTMins)),
    publicHolidayOT:     0,
  };
}

export function OvertimeRequestsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const allRecords = useAppSelector((s) => s.ot.records);
  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  // List state
  const [year, setYear]       = useState(todayYear);
  const [month, setMonth]     = useState(todayMonth);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [detail, setDetail]   = useState<OTRecord | null>(null);

  // New-request modal state
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors]       = useState<Partial<FormState>>({});
  // undefined = no date chosen yet; null = date chosen but no record found
  const [dateRecord, setDateRecord] = useState<AttendanceRecord | null | undefined>(undefined);

  if (!user) return null;

  // ── List helpers ──────────────────────────────────────────────────────────
  const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const records = allRecords.filter((r) => {
    const p = r.date.split(' ');
    return r.empId === user.id && p[1] === MON_SHORT[month - 1] && Number(p[2]) === year;
  });

  const handleYearChange = (y: number) => {
    setYear(y);
    setMonth((m) => Math.min(m, y === todayYear ? todayMonth : 12));
  };

  const effectiveStatus = (r: OTRecord): string => {
    if (r.managerStatus === 'Rejected') return 'Rejected';
    if (r.managerStatus === 'Pending')  return 'Pending';
    if (r.hrStatus === 'Approved')      return 'Approved';
    if (r.hrStatus === 'Rejected')      return 'Rejected';
    return 'Pending';
  };

  const counts = {
    all:      records.length,
    pending:  records.filter((r) => effectiveStatus(r) === 'Pending').length,
    approved: records.filter((r) => effectiveStatus(r) === 'Approved').length,
    rejected: records.filter((r) => effectiveStatus(r) === 'Rejected').length,
  };

  const filtered = activeTab === 'all' ? records : records.filter((r) => effectiveStatus(r).toLowerCase() === activeTab);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const setField = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // "YYYY-MM-DD"
    setErrors((prev) => ({ ...prev, date: undefined }));
    if (!val) {
      setForm((prev) => ({ ...prev, date: val, regularDayOT: '', regularDayOTAfter9PM: '', publicHolidayOT: '' }));
      setDateRecord(undefined);
      return;
    }
    const [y, m, d] = val.split('-').map(Number);
    const monthRecords = getEmployeeAttendance(user.id, y, m);
    const rec = monthRecords.find((r) => r.day === d) ?? null;
    setDateRecord(rec);

    const eligible = rec?.status === 'Present' && (rec.totalHours ?? 0) >= 9.5;
    if (eligible && rec!.clockIn && rec!.clockOut) {
      const ot = calcOTBreakdown(rec!.clockIn!, rec!.clockOut!, rec!.totalHours!);
      setForm((prev) => ({
        ...prev,
        date: val,
        regularDayOT:         String(ot.regularDayOT),
        regularDayOTAfter9PM: String(ot.regularDayOTAfter9PM),
        publicHolidayOT:      String(ot.publicHolidayOT),
      }));
    } else {
      setForm((prev) => ({ ...prev, date: val, regularDayOT: '', regularDayOTAfter9PM: '', publicHolidayOT: '' }));
    }
  };

  const hoursOk = dateRecord?.status === 'Present' && (dateRecord.totalHours ?? 0) >= 9.5;

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!form.date) next.date = 'Date is required.';
    if (form.date && !hoursOk) next.date = 'Minimum 9.5 hours worked required to apply for overtime.';
    const reg  = parseFloat(form.regularDayOT        || '0');
    const late = parseFloat(form.regularDayOTAfter9PM || '0');
    const hol  = parseFloat(form.publicHolidayOT     || '0');
    if (reg + late + hol <= 0) next.regularDayOT = 'Enter at least one OT hour type.';
    if (reg  < 0) next.regularDayOT = 'Cannot be negative.';
    if (late < 0) next.regularDayOTAfter9PM = 'Cannot be negative.';
    if (hol  < 0) next.publicHolidayOT = 'Cannot be negative.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setForm(EMPTY);
    setErrors({});
    setSubmitted(false);
    setDateRecord(undefined);
  };

  const reg   = parseFloat(form.regularDayOT        || '0') || 0;
  const late  = parseFloat(form.regularDayOTAfter9PM || '0') || 0;
  const hol   = parseFloat(form.publicHolidayOT     || '0') || 0;
  const totalOT = Math.round((reg + late + hol) * 100) / 100;

  // ── Shared styles ─────────────────────────────────────────────────────────
  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

  const inputClass = (err?: string) =>
    `w-full rounded-lg border ${err ? 'border-danger' : 'border-line'} bg-surface-sunken px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none`;

  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-content-muted whitespace-nowrap border-b border-r border-line';
  const td = 'px-4 py-3.5 text-sm text-content-primary whitespace-nowrap border-r border-line';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const statusChip = (status: string) => {
    const cls =
      status === 'Approved' ? 'bg-success/15 text-success' :
      status === 'Rejected' ? 'bg-danger/15 text-danger' :
      'bg-warning/15 text-warning';
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
             My Overtime Work          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            View your overtime work or Log a new Overtime Request.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
        >
          + New Request
        </button>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-line bg-surface-overlay p-1 w-fit">
        {tabs.map(({ key, label }) => {
            const active = activeTab === key;
            const count = counts[key];
            const badgeColor =
              key === 'approved' ? 'bg-success/15 text-success' :
              key === 'rejected' ? 'bg-danger/15 text-danger' :
              key === 'pending'  ? 'bg-warning/15 text-warning' :
              'bg-surface-sunken text-content-muted';
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={[
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                  active ? 'bg-surface-raised text-content-primary shadow-panel' : 'text-content-secondary hover:text-content-primary',
                ].join(' ')}
              >
                {label}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? badgeColor : 'bg-surface-sunken text-content-muted'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      {/* Table */}
      {filtered.length === 0 ? (
          <div className="grid place-items-center rounded-card border border-dashed border-line bg-surface-raised/40 px-6 py-16 text-center">
            <p className="text-sm text-content-muted">No {activeTab === 'all' ? '' : activeTab} requests found for {MONTHS[month - 1]} {year}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-surface-raised shadow-panel">
            <table className="min-w-full">
              <thead className="bg-surface-overlay">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Reg Day OT (Hrs)</th>
                  <th className={th}>Non-Reg Hrs OT (Hrs)</th>
                  <th className={th}>Holiday OT (Hrs)</th>
                  <th className={th}>Total OT (Hrs)</th>
                  <th className={th}>Manager Approval</th>
                  <th className={`${th} border-r-0`}>HR Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((r) => (
                  <tr
                    key={r.empId + r.date}
                    onClick={() => setDetail(r)}
                    className="cursor-pointer transition hover:bg-surface-overlay"
                  >
                    <td className={`${td} font-medium`}>{r.date}</td>
                    <td className={`${td} text-center`}>{r.regularDayOT}</td>
                    <td className={`${td} text-center`}>{r.regularDayOTAfter9PM}</td>
                    <td className={`${td} text-center`}>{r.publicHolidayOT}</td>
                    <td className={`${td} text-center font-semibold`}>{r.totalOTApproved}</td>
                    <td className={td}>{statusChip(r.managerStatus)}</td>
                    <td className={`${td} border-r-0`}>
                      {r.managerStatus !== 'Approved'
                        ? <span className="text-content-muted">—</span>
                        : statusChip(r.hrStatus ?? 'Pending')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Detail popup */}
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-card border border-line bg-surface-raised shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-sm font-semibold text-content-primary">{detail.date}</h3>
                  {statusChip(effectiveStatus(detail))}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-content-muted">
                  <span>In: <span className="font-mono font-semibold text-success">{detail.clockIn}</span></span>
                  <span>·</span>
                  <span>Out: <span className="font-mono font-semibold text-content-primary">{detail.clockOut}</span></span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="ml-2 shrink-0 rounded-lg p-1 text-content-muted transition hover:bg-surface-overlay hover:text-content-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {(() => {
              const managerState: StepState =
                detail.managerStatus === 'Approved' ? 'done'
                : detail.managerStatus === 'Rejected' ? 'rejected'
                : 'pending';

              const hrState: StepState =
                managerState !== 'done' ? 'waiting'
                : detail.hrStatus === 'Approved' ? 'done'
                : detail.hrStatus === 'Rejected' ? 'rejected'
                : 'pending';

              const managerName = detail.managerName
                ? `Reviewed by ${detail.managerName}`
                : undefined;

              return (
                <div className="space-y-4 px-5 py-4">
                  {/* Approval timeline */}
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted">Approval Status</p>
                    <div className="pl-1">
                      <ApprovalStep
                        role="Employee"
                        state="done"
                        name={`Submitted on ${detail.date}`}
                      />
                      <ApprovalStep
                        role="Line Manager"
                        state={managerState}
                        name={managerState === 'done' ? managerName : undefined}
                        comment={managerState === 'rejected' ? detail.managerRejectionComment : undefined}
                      />
                      <ApprovalStep
                        role="HR"
                        state={hrState}
                        isLast
                      />
                    </div>
                  </div>

                  {/* OT Hours */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted">OT Hours</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['Reg Day OT',    detail.regularDayOT],
                        ['Non-Reg Hrs OT',  detail.regularDayOTAfter9PM],
                        ['Holiday OT',    detail.publicHolidayOT],
                      ].map(([label, val]) => (
                        <div key={String(label)} className="rounded-lg border border-line bg-surface-overlay px-3 py-2">
                          <p className="text-[10px] text-content-muted">{label}</p>
                          <p className="mt-0.5 text-sm font-bold text-content-primary">{val} hrs</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-overlay px-3 py-2 text-xs">
                      <span className="text-content-secondary">Total OT Approved</span>
                      <span className="font-bold text-content-primary">{detail.totalOTApproved} hrs</span>
                      <span className="text-content-secondary">Time in Lieu</span>
                      <span className="font-semibold text-content-primary">{detail.timeInLieu} hrs</span>
                    </div>
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

      {/* New Request modal */}
      {showForm && (
        <Modal onClose={handleClose}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-card border border-line bg-surface-raised shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-display text-base font-semibold text-content-primary">New Overtime Request</h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1 text-content-muted transition hover:bg-surface-overlay hover:text-content-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            {submitted ? (
              <div className="px-6 py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-success" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-content-primary">Request Submitted</h3>
                <p className="mt-1 text-sm text-content-secondary">
                  Your overtime request for <span className="font-semibold text-content-primary">{form.date}</span> has been submitted and is pending manager approval.
                </p>
                <div className="mt-5 divide-y divide-line rounded-lg border border-line bg-surface-overlay text-left">
                  {[
                    ['Date', form.date],
                    ['Regular Day OT', `${reg} hrs`],
                    ['Non-Reg Hrs OT (22:00–04:00)', `${late} hrs`],
                    ['Public / Holiday OT', `${hol} hrs`],
                    ['Total OT', `${totalOT} hrs`],
                    ...(form.notes ? [['Notes', form.notes] as [string, string]] : []),
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex items-start justify-between px-4 py-2.5">
                      <span className="text-xs text-content-muted">{label}</span>
                      <span className="text-xs font-semibold text-content-primary text-right max-w-[60%]">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setForm(EMPTY); setErrors({}); setSubmitted(false); setDateRecord(undefined); }}
                    className="rounded-lg border border-line px-5 py-2 text-sm font-semibold text-content-secondary transition hover:bg-surface-overlay"
                  >
                    Submit Another
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-content-muted mb-1.5">
                    Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    max={maxDate()}
                    value={form.date}
                    onChange={handleDateChange}
                    className={inputClass(errors.date)}
                  />
                  {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}

                  {/* Attendance info for selected date */}
                  {form.date && dateRecord !== undefined && (
                    dateRecord === null || dateRecord.status !== 'Present' ? (
                      <div className="mt-2 rounded-lg border border-line bg-surface-overlay px-3 py-2 text-xs text-content-muted">
                        No attendance record found for this date.
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-5 rounded-lg bg-surface-overlay px-3 py-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-content-muted">Clock In</span>
                            <span className="font-mono font-bold text-success">{dateRecord.clockIn}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-content-muted">Clock Out</span>
                            <span className="font-mono font-bold text-content-primary">{dateRecord.clockOut}</span>
                          </div>
                          <div className="ml-auto flex items-center gap-1.5">
                            <span className="text-content-muted">Hours Worked</span>
                            <span className={`font-bold ${(dateRecord.totalHours ?? 0) < 9.5 ? 'text-danger' : 'text-content-primary'}`}>
                              {dateRecord.totalHours} hrs
                            </span>
                          </div>
                        </div>
                        {(dateRecord.totalHours ?? 0) < 9.5 && (
                          <p className="text-xs text-danger">
                            Minimum 9.5 hours worked required to apply for overtime. You worked {dateRecord.totalHours} hrs on this date.
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* OT Hours */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-content-muted mb-2">
                    OT Hours <span className="text-danger">*</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      ['regularDayOT',          'Reg Day OT'],
                      ['regularDayOTAfter9PM',  'Non-Reg Hrs OT'],
                      ['publicHolidayOT',       'Holiday OT'],
                    ] as [keyof FormState, string][]).map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-[11px] font-medium text-content-secondary mb-1">{label} (Hrs)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          placeholder="0"
                          value={form[field]}
                          onChange={setField(field)}
                          disabled
                          className={`${inputClass(errors[field])} disabled:opacity-60 disabled:cursor-not-allowed`}
                        />
                      </div>
                    ))}
                  </div>
                  {errors.regularDayOT && (
                    <p className="mt-1 text-xs text-danger">{errors.regularDayOT}</p>
                  )}
                  {totalOT > 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-overlay px-3 py-2 text-xs">
                      <span className="text-content-secondary">Total OT</span>
                      <span className="font-bold text-content-primary">{totalOT} hrs</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-content-muted mb-1.5">
                    Notes <span className="text-content-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add context for your manager…"
                    value={form.notes}
                    onChange={setField('notes')}
                    className="w-full resize-none rounded-lg border border-line bg-surface-sunken px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-1 border-t border-line">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-line px-5 py-2 text-sm font-semibold text-content-secondary transition hover:bg-surface-overlay"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={form.date !== '' && !hoursOk}
                    className="rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
