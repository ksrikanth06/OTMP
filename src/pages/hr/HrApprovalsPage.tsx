import { useState } from 'react';
import {
  calcOtPay, fmtAed as fmt, DUMMY_HR_RECORDS,
  type HrOvertimeRecord, type HrStatus, type OtBreakdown,
} from '@/data/hrOvertimeData';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const rowKey = (r: HrOvertimeRecord) => `${r.empId}-${r.date}`;

export function HrApprovalsPage() {
  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [year, setYear]     = useState(todayYear);
  const [month, setMonth]   = useState(todayMonth);
  const [records, setRecords]         = useState<HrOvertimeRecord[] | null>(null);
  const [activeTab, setActiveTab]     = useState<'pending' | 'approved'>('pending');
  const [filterName, setFilterName]   = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [calcPopup, setCalcPopup]     = useState<{ record: HrOvertimeRecord; result: OtBreakdown } | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const handleYearChange = (y: number) => {
    setYear(y);
    setMonth((m) => Math.min(m, y === todayYear ? todayMonth : 12));
    setRecords(null);
    setFilterName('');
    setSelectedIds(new Set());
  };

  const handleFetch = () => {
    setRecords(DUMMY_HR_RECORDS);
    setSelectedIds(new Set());
  };

  const pendingCount  = records ? records.filter((r) => r.hrStatus === 'Pending').length  : 0;
  const approvedCount = records ? records.filter((r) => r.hrStatus === 'Approved').length : 0;

  const filteredRecords = records
    ? records
        .filter((r) => activeTab === 'pending' ? r.hrStatus === 'Pending' : r.hrStatus !== 'Pending')
        .filter((r) => r.name.toLowerCase().includes(filterName.toLowerCase().trim()))
    : null;

  const allSelectable = filteredRecords?.filter((r) => r.hrStatus === 'Pending') ?? [];
  const allSelected   = allSelectable.length > 0 && allSelectable.every((r) => selectedIds.has(rowKey(r)));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allSelectable.map(rowKey)));
    }
  };

  const toggleRow = (key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const applyHrStatus = (newStatus: HrStatus) => {
    setRecords((prev) =>
      prev
        ? prev.map((r) => selectedIds.has(rowKey(r)) ? { ...r, hrStatus: newStatus } : r)
        : prev,
    );
    setSelectedIds(new Set());
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
          Overtime Approvals
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Review manager-approved overtime records and process HR approval.
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
          <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setRecords(null); }} className={selectClass}>
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={handleFetch}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
        >
          Fetch Records
        </button>
      </div>

      {/* Tabs + table */}
      {records && (
        <div className="overflow-hidden rounded-card border border-line bg-surface-raised shadow-panel">

          {/* Tab bar */}
          <div className="flex border-b border-line">
            <button
              type="button"
              onClick={() => { setActiveTab('pending'); setFilterName(''); setSelectedIds(new Set()); }}
              className={[
                'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition',
                activeTab === 'pending'
                  ? 'border-b-2 border-brand text-content-primary'
                  : 'text-content-secondary hover:text-content-primary',
              ].join(' ')}
            >
              Pending HR Approval
              {pendingCount > 0 && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-content-on-brand">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('approved'); setFilterName(''); setSelectedIds(new Set()); }}
              className={[
                'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition',
                activeTab === 'approved'
                  ? 'border-b-2 border-success text-content-primary'
                  : 'text-content-secondary hover:text-content-primary',
              ].join(' ')}
            >
              HR Approved
              {approvedCount > 0 && (
                <span className="rounded-full bg-success px-2 py-0.5 text-[11px] font-bold text-white">
                  {approvedCount}
                </span>
              )}
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
            <input
              type="text"
              placeholder="Filter by employee name…"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-48 rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
            />
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs text-content-muted">{selectedIds.size} selected</span>
                <button
                  type="button"
                  onClick={() => applyHrStatus('Approved')}
                  className="rounded-lg border border-success px-4 py-1.5 text-sm font-semibold text-success transition hover:bg-success/10"
                >
                  HR Approve
                </button>
                <button
                  type="button"
                  onClick={() => applyHrStatus('Rejected')}
                  className="rounded-lg border border-brand px-4 py-1.5 text-sm font-semibold text-brand transition hover:bg-brand/10"
                >
                  HR Reject
                </button>
              </>
            )}
          </div>

          {/* Table */}
          <div>
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-8" />        {/* checkbox */}
                <col className="w-24" />       {/* emp id */}
                <col className="w-36" />       {/* name */}
                <col className="w-12" />       {/* grade */}
                <col className="w-24" />       {/* date */}
                <col className="w-14" />       {/* regular OT */}
                <col className="w-16" />       {/* OT after 9PM */}
                <col className="w-14" />       {/* holiday OT */}
                <col className="w-14" />       {/* total OT */}
                <col className="w-28" />       {/* approved by */}
                <col className="w-24" />       {/* status */}
                <col className="w-32" />       {/* action */}
              </colgroup>
              <thead className="bg-surface-overlay">
                <tr>
                  <th className={thClass}>
                    {activeTab === 'pending' && (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="accent-brand"
                      />
                    )}
                  </th>
                  <th className={thClass}>Emp ID</th>
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Grade</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass + ' text-center'}>Reg OT</th>
                  <th className={thClass + ' text-center'}>After 9PM</th>
                  <th className={thClass + ' text-center'}>Holiday</th>
                  <th className={thClass + ' text-center'}>Total</th>
                  <th className={thClass}>Approved By</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>OT PAY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredRecords!.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-sm text-content-muted">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords!.map((r) => {
                    const key        = rowKey(r);
                    const isPending  = r.hrStatus === 'Pending';
                    const isSelected = selectedIds.has(key);

                    return (
                      <tr
                        key={key}
                        className={isSelected ? 'bg-brand-soft' : 'hover:bg-surface-overlay/60'}
                      >
                        {/* Checkbox */}
                        <td className={tdClass}>
                          {isPending ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(key)}
                              className="accent-brand"
                            />
                          ) : (
                            <input type="checkbox" checked disabled className="accent-brand opacity-40" />
                          )}
                        </td>

                        <td className={tdClass + ' truncate font-mono'}>{r.empId}</td>
                        <td className={tdClass + ' truncate font-semibold'}>{r.name}</td>
                        <td className={tdClass}>{r.grade}</td>
                        <td className={tdClass + ' whitespace-nowrap'}>{r.date}</td>
                        <td className={tdClass + ' text-center'}>{r.regularDayOT}</td>
                        <td className={tdClass + ' text-center'}>{r.regularDayOTAfter9PM}</td>
                        <td className={tdClass + ' text-center'}>{r.publicHolidayOT}</td>
                        <td className={tdClass + ' text-center font-semibold'}>{r.totalOTApproved}</td>
                        <td className={tdClass + ' truncate text-content-secondary'}>{r.approvedByManager}</td>

                        {/* HR Status badge */}
                        <td className={tdClass}>
                          {r.hrStatus === 'Approved' && (
                            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                              HR Approved
                            </span>
                          )}
                          {r.hrStatus === 'Rejected' && (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                              HR Rejected
                            </span>
                          )}
                          {r.hrStatus === 'Pending' && (
                            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Per-row Calculate action / pay value */}
                        <td className={tdClass}>
                          {r.hrStatus === 'Approved' ? (
                            <button
                              type="button"
                              onClick={() => setCalcPopup({
                                record: r,
                                result: calcOtPay(r.grade, r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT),
                              })}
                              className="text-[11px] font-semibold text-success hover:underline"
                            >
                              AED {fmt(calcOtPay(r.grade, r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT).totalOTPay)}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCalcPopup({
                                record: r,
                                result: calcOtPay(r.grade, r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT),
                              })}
                              className="rounded border border-line bg-surface-sunken px-2 py-1 text-[11px] font-semibold text-content-primary transition hover:border-brand hover:text-brand"
                            >
                              Calculate OT Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OT Pay calculation popup */}
      {calcPopup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setCalcPopup(null)}
        >
          <div
            className="w-[420px] overflow-hidden rounded-card border border-line bg-surface-raised shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-line bg-surface-overlay px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">OT Pay Calculation</p>
              <p className="mt-0.5 text-base font-semibold text-content-primary">
                {calcPopup.record.name}
                <span className="ml-2 text-sm font-normal text-content-muted">
                  {calcPopup.record.grade} · {calcPopup.record.date}
                </span>
              </p>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Pay basis */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-content-muted">Pay Basis</p>
                <div className="rounded-lg border border-line divide-y divide-line text-sm">
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-content-secondary">Gross Pay / Month</span>
                    <span className="font-semibold text-content-primary">AED {fmt(calcPopup.result.grossPay)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-content-secondary">Basic Pay / Month <span className="text-content-muted">(×0.88)</span></span>
                    <span className="font-semibold text-content-primary">AED {fmt(calcPopup.result.basicPayMonth)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-content-secondary">Basic Pay / Hour <span className="text-content-muted">(×12 ÷365 ÷8)</span></span>
                    <span className="font-semibold text-content-primary">AED {fmt(calcPopup.result.basicPayHour)}</span>
                  </div>
                </div>
              </div>

              {/* OT breakdown */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-content-muted">OT Breakdown</p>
                <div className="rounded-lg border border-line divide-y divide-line text-sm">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-content-secondary">
                      Regular OT
                      <span className="ml-1 text-content-muted">
                        ({calcPopup.record.regularDayOT} hrs × 1.25)
                      </span>
                    </span>
                    <span className="font-semibold text-content-primary">AED {fmt(calcPopup.result.regularOTPay)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-content-secondary">
                      OT After 9PM
                      <span className="ml-1 text-content-muted">
                        ({calcPopup.record.regularDayOTAfter9PM} hrs × 1.25)
                      </span>
                    </span>
                    <span className="font-semibold text-content-primary">AED {fmt(calcPopup.result.after9PMOTPay)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-content-secondary">
                      Holiday OT
                      <span className="ml-1 text-content-muted">
                        ({calcPopup.record.publicHolidayOT} hrs × 1.75)
                      </span>
                    </span>
                    <span className="font-semibold text-content-primary">AED {fmt(calcPopup.result.holidayOTPay)}</span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-lg bg-brand-soft px-4 py-3">
                <span className="text-sm font-semibold text-content-primary">Total OT Pay</span>
                <span className="text-lg font-bold text-brand">AED {fmt(calcPopup.result.totalOTPay)}</span>
              </div>
            </div>

            <div className="border-t border-line px-5 py-3">
              <button
                type="button"
                onClick={() => setCalcPopup(null)}
                className="w-full rounded-lg border border-line py-2 text-sm font-semibold text-content-secondary transition hover:border-line-strong hover:text-content-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
