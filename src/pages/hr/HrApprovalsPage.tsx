import { useState, useEffect } from 'react';
import { calcOtPay, fmtAed as fmt, MONTHS, HR_ENTITIES, HR_DEPARTMENTS } from '@/services/dataService';
import type { OTRecord } from '@/services/dataService';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchHrOTRecords } from '@/store/slices/otSlice';
import { Modal } from '@/components/common/Modal';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const parseHours = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
};

const formatWorked = (r: OTRecord) => {
  const total = Math.round((parseHours(r.clockOut) - parseHours(r.clockIn)) * 100) / 100;
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  return { hhmm: `${h} hr${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`, decimal: total };
};

export function HrApprovalsPage() {
  const allRecords = useAppSelector((s) => s.ot.records);
  const dispatch   = useAppDispatch();

  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [year, setYear]               = useState(todayYear);
  const [month, setMonth]             = useState(todayMonth);
  const [filterEntity, setFilterEntity]         = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterManager, setFilterManager]       = useState('');
  const [filterName, setFilterName]   = useState('');
  const [detail, setDetail]           = useState<OTRecord | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  // HR only sees records fully approved by both L1 and L2
  const records = allRecords.filter((r) => {
    const p = r.date.split(' ');
    return (
      r.l1_approval_status === 'Approved' &&
      r.l2_approval_status === 'Approved' &&
      p[1] === MONTHS_SHORT[month - 1] &&
      Number(p[2]) === year
    );
  });

  const managerOptions = Array.from(new Set(records.map((r) => r.l1ManagerName).filter(Boolean))).sort() as string[];

  const filteredRecords = records
    .filter((r) => !filterEntity     || r.entity       === filterEntity)
    .filter((r) => !filterDepartment || r.department   === filterDepartment)
    .filter((r) => !filterManager    || r.l1ManagerName === filterManager)
    .filter((r) => r.name.toLowerCase().includes(filterName.toLowerCase().trim()));

  useEffect(() => {
    dispatch(fetchHrOTRecords({ year, month }));
  }, [year, month]);

  const handleYearChange = (y: number) => {
    setYear(y);
    setMonth((m) => Math.min(m, y === todayYear ? todayMonth : 12));
    setFilterName('');
  };

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

  const thClass = 'whitespace-nowrap border-r border-line px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-content-muted last:border-r-0';
  const tdClass = 'border-r border-line px-2 py-2.5 text-xs text-content-primary last:border-r-0';

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page header */}
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          Approved Overtime Records
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Overtime records approved by both Line Manager (L1) and Head of Department (L2).
        </p>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-surface-raised p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Year</span>
          <select value={year} onChange={(e) => handleYearChange(Number(e.target.value))} className={selectClass}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Month</span>
          <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); }} className={selectClass}>
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Entity</span>
          <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className={selectClass}>
            <option value="">All</option>
            {HR_ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Department</span>
          <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className={selectClass}>
            <option value="">All</option>
            {HR_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Line Manager</span>
          <select value={filterManager} onChange={(e) => setFilterManager(e.target.value)} className={selectClass}>
            <option value="">All</option>
            {managerOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-card border border-line bg-surface-raised shadow-panel">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
          <input
            type="text"
            placeholder="Filter by employee name…"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-48 rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
          />
          <span className="ml-auto text-xs text-content-muted">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} · click a row to view details
          </span>
        </div>

        <div>
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-24" />
              <col className="w-36" />
              <col className="w-12" />
              <col className="w-24" />
              <col className="w-14" />
              <col className="w-16" />
              <col className="w-14" />
              <col className="w-14" />
              <col className="w-28" />
              <col className="w-28" />
            </colgroup>
            <thead className="bg-surface-overlay">
              <tr>
                <th className={thClass}>Emp ID</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Grade</th>
                <th className={thClass}>Date</th>
                <th className={thClass + ' text-center'}>Reg OT</th>
                <th className={thClass + ' text-center'}>Non-Reg Hrs</th>
                <th className={thClass + ' text-center'}>Holiday</th>
                <th className={thClass + ' text-center'}>Total</th>
                <th className={thClass}>L1 Approver</th>
                <th className={thClass}>L2 Approver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-content-muted">
                    No fully-approved records found for {MONTHS[month - 1]} {year}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const key = `${r.empId}|${r.date}`;
                  return (
                    <tr
                      key={key}
                      onClick={() => setDetail(r)}
                      className="cursor-pointer transition hover:bg-surface-overlay/60"
                    >
                      <td className={tdClass + ' truncate font-mono'}>{r.empId}</td>
                      <td className={tdClass + ' truncate font-semibold'}>{r.name}</td>
                      <td className={tdClass}>{r.grade}</td>
                      <td className={tdClass + ' whitespace-nowrap'}>{r.date}</td>
                      <td className={tdClass + ' text-center'}>{r.l1_approved_hours?.regularDayOT ?? 0}</td>
                      <td className={tdClass + ' text-center'}>{r.l1_approved_hours?.regularDayOTAfter9PM ?? 0}</td>
                      <td className={tdClass + ' text-center'}>{r.l1_approved_hours?.publicHolidayOT ?? 0}</td>
                      <td className={tdClass + ' text-center font-semibold'}>{r.l1_approved_hours?.total ?? 0}</td>
                      <td className={tdClass + ' truncate text-content-secondary'}>{r.l1ManagerName ?? '—'}</td>
                      <td className={tdClass + ' truncate text-content-secondary'}>{r.l2ManagerName ?? '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail popup */}
      {detail && (() => {
        const r = detail;
        const { hhmm, decimal: workedDec } = formatWorked(r);
        const approvedHrs = r.l1_approved_hours ?? r.employee_submitted_hours;
        const { grossPay, grossPayPerHour, basicPayMonth, basicPayHour, regularOTPay, after9PMOTPay, holidayOTPay, totalOTPay } =
          calcOtPay(r.grade, approvedHrs.regularDayOT, approvedHrs.regularDayOTAfter9PM, approvedHrs.publicHolidayOT);

        const otFields: [string, number][] = [
          ['Regular Day OT', approvedHrs.regularDayOT],
          ['Non-Reg OT (22:00–04:00)', approvedHrs.regularDayOTAfter9PM],
          ['Public / Rest Holiday OT', approvedHrs.publicHolidayOT],
        ];

        const payRows: [string, string, string?][] = [
          ['Gross Pay / Month', fmt(grossPay)],
          ['Basic Pay / Month (88%)', fmt(basicPayMonth)],
          ['Basic Pay / Hour', fmt(basicPayHour), '×12 ÷ 365 ÷ 8'],
          ['Gross Hourly Rate', fmt(grossPayPerHour), '×12 ÷ 365 ÷ 8'],
          ['Regular Day OT', fmt(regularOTPay), `${approvedHrs.regularDayOT} hrs × 1.25`],
          ['Non-Reg Hrs OT (22:00–04:00)', fmt(after9PMOTPay), `${approvedHrs.regularDayOTAfter9PM} hrs × 1.5`],
          ['Public / Rest Holiday OT', fmt(holidayOTPay), `${approvedHrs.publicHolidayOT} hrs × Gross Rate + ${approvedHrs.publicHolidayOT} hrs × 0.5 × Basic Rate`],
        ];

        return (
          <Modal onClose={() => setDetail(null)}>
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-card border border-line bg-surface-raised shadow-panel"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line px-4 py-3 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-sm font-semibold text-content-primary">{r.name}</h3>
                    <span className="font-mono text-xs text-content-muted">{r.empId}</span>
                    <span className="text-xs text-content-muted">·</span>
                    <span className="text-xs text-content-muted">{r.date}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">Grade {r.grade}</span>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">Fully Approved</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="ml-2 shrink-0 rounded-lg p-1 text-content-muted transition hover:bg-surface-overlay hover:text-content-primary"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-3 px-4 py-3">
                  {/* Attendance */}
                  <div className="flex items-center gap-2 rounded-lg bg-surface-overlay px-3 py-2 text-xs">
                    <span className="text-content-muted">In</span>
                    <span className="font-bold text-content-primary">{r.clockIn}</span>
                    <span className="text-content-muted mx-1">→</span>
                    <span className="text-content-muted">Out</span>
                    <span className="font-bold text-content-primary">{r.clockOut}</span>
                    <span className="ml-auto font-semibold text-content-primary">{workedDec} hrs worked</span>
                    <span className="text-content-muted">({hhmm})</span>
                  </div>

                  {/* Approval chain */}
                  <div className="divide-y divide-line rounded-lg border border-line bg-surface-overlay">
                    <div className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="text-content-secondary">L1 Line Manager</span>
                      <span className="font-semibold text-success">{r.l1ManagerName ?? '—'}</span>
                    </div>
                    {r.l1_comments && (
                      <div className="px-3 py-2 text-xs">
                        <span className="text-content-muted">L1 Comment: </span>
                        <span className="text-content-primary">{r.l1_comments}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="text-content-secondary">L2 Head of Department</span>
                      <span className="font-semibold text-success">{r.l2ManagerName ?? '—'}</span>
                    </div>
                    {r.l2_comments && (
                      <div className="px-3 py-2 text-xs">
                        <span className="text-content-muted">L2 Comment: </span>
                        <span className="text-content-primary">{r.l2_comments}</span>
                      </div>
                    )}
                  </div>

                  {/* Employee submitted hours vs approved */}
                  {r.employee_submitted_hours.total !== approvedHrs.total && (
                    <div className="flex items-center gap-3 rounded-lg bg-warning/5 border border-warning/20 px-3 py-2 text-xs">
                      <span className="text-content-secondary">Employee submitted</span>
                      <span className="font-semibold text-warning">{r.employee_submitted_hours.total} hrs</span>
                      <span className="text-content-muted">→ L1 adjusted to</span>
                      <span className="font-semibold text-content-primary">{approvedHrs.total} hrs</span>
                    </div>
                  )}

                  {/* OT Hours — read-only */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted">OT Hours</p>
                    <div className="grid grid-cols-3 gap-2">
                      {otFields.map(([label, val]) => (
                        <div key={label}>
                          <p className="text-[10px] font-medium text-content-secondary mb-1">{label} (Hrs)</p>
                          <div className="rounded-md border border-line bg-surface-overlay px-2 py-1.5 text-xs font-semibold text-content-primary">
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-4 rounded-md bg-surface-overlay px-3 py-1.5 text-xs">
                      <span className="text-content-secondary">Total OT</span>
                      <span className="font-bold text-content-primary">{approvedHrs.total} hrs</span>
                    </div>
                  </div>

                  {/* Pay breakdown */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted">OT Pay Calculation</p>
                    <div className="divide-y divide-line rounded-lg border border-line bg-surface-overlay">
                      {payRows.map(([label, amount, note]) => (
                        <div key={label} className="flex items-center justify-between px-3 py-1.5">
                          <p className="text-xs text-content-secondary">{label}{note && <span className="ml-1 text-[10px] text-content-muted">({note})</span>}</p>
                          <span className="text-xs font-semibold text-content-primary">AED {amount}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between rounded-lg bg-brand/10 px-3 py-2">
                      <p className="text-xs font-semibold text-brand">Total OT Pay</p>
                      <span className="text-sm font-bold text-brand">AED {fmt(totalOTPay)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3 shrink-0">
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
        );
      })()}
    </div>
  );
}
