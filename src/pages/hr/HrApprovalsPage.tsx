import { useState } from 'react';
import { calcOtPay, fmtAed as fmt, MONTHS, HR_ENTITIES, HR_DEPARTMENTS } from '@/services/dataService';
import type { OTRecord, HrStatus } from '@/services/dataService';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { mkOTKey, hrApproveRecords, hrRejectRecords } from '@/store/slices/otSlice';
import { Modal } from '@/components/common/Modal';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const rowKey = (r: OTRecord) => mkOTKey(r.empId, r.date);

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
  const dispatch = useAppDispatch();
  const allRecords = useAppSelector((s) => s.ot.records);

  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [year, setYear]               = useState(todayYear);
  const [month, setMonth]             = useState(todayMonth);
  const [filterEntity, setFilterEntity]         = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterManager, setFilterManager]       = useState('');
  const [activeTab, setActiveTab]     = useState<'pending' | 'approved'>('pending');
  const [filterName, setFilterName]   = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail]           = useState<OTRecord | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ mode: 'bulk' } | { mode: 'single'; record: OTRecord } | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const records = allRecords.filter((r) => {
    const p = r.date.split(' ');
    return r.managerStatus === 'Approved' && p[1] === MONTHS_SHORT[month - 1] && Number(p[2]) === year;
  });

  const pendingCount  = records.filter((r) => r.hrStatus === 'Pending').length;
  const approvedCount = records.filter((r) => r.hrStatus !== 'Pending').length;

  const managerOptions = Array.from(new Set(records.map((r) => r.managerName).filter(Boolean))).sort() as string[];

  const filteredRecords = records
    .filter((r) => activeTab === 'pending' ? r.hrStatus === 'Pending' : r.hrStatus !== 'Pending')
    .filter((r) => !filterEntity     || r.entity       === filterEntity)
    .filter((r) => !filterDepartment || r.department   === filterDepartment)
    .filter((r) => !filterManager    || r.managerName  === filterManager)
    .filter((r) => r.name.toLowerCase().includes(filterName.toLowerCase().trim()));

  const allSelectable = filteredRecords.filter((r) => r.hrStatus === 'Pending');
  const allSelected   = allSelectable.length > 0 && allSelectable.every((r) => selectedIds.has(rowKey(r)));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(allSelectable.map(rowKey)));
  };

  const toggleRow = (key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleYearChange = (y: number) => {
    setYear(y);
    setMonth((m) => Math.min(m, y === todayYear ? todayMonth : 12));
    setFilterName('');
    setSelectedIds(new Set());
  };

  const applyHrStatus = (newStatus: HrStatus, comment?: string) => {
    if (newStatus === 'Approved') {
      dispatch(hrApproveRecords({ keys: [...selectedIds] }));
    } else {
      dispatch(hrRejectRecords({ keys: [...selectedIds], comment }));
    }
    setSelectedIds(new Set());
  };

  const applyHrStatusSingle = (r: OTRecord, newStatus: HrStatus, comment?: string) => {
    const key = rowKey(r);
    if (newStatus === 'Approved') {
      dispatch(hrApproveRecords({ keys: [key] }));
    } else {
      dispatch(hrRejectRecords({ keys: [key], comment }));
    }
    setDetail(null);
  };

  const confirmHrReject = () => {
    const trimmed = rejectComment.trim();
    if (!trimmed || !rejectDialog) return;
    if (rejectDialog.mode === 'bulk') {
      applyHrStatus('Rejected', trimmed);
    } else {
      applyHrStatusSingle(rejectDialog.record, 'Rejected', trimmed);
    }
    setRejectDialog(null);
    setRejectComment('');
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
          <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setSelectedIds(new Set()); }} className={selectClass}>
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Entity</span>
          <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setSelectedIds(new Set()); }} className={selectClass}>
            <option value="">All</option>
            {HR_ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Department</span>
          <select value={filterDepartment} onChange={(e) => { setFilterDepartment(e.target.value); setSelectedIds(new Set()); }} className={selectClass}>
            <option value="">All</option>
            {HR_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Manager</span>
          <select value={filterManager} onChange={(e) => { setFilterManager(e.target.value); setSelectedIds(new Set()); }} className={selectClass}>
            <option value="">All</option>
            {managerOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs + table */}
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
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => { setRejectDialog({ mode: 'bulk' }); setRejectComment(''); }}
                className="rounded-lg border border-danger px-4 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger/10"
              >
                 Reject
              </button>
            </>
          )}
          <span className="ml-auto text-xs text-content-muted">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} · click a row to view details
          </span>
        </div>

        {/* Table */}
        <div>
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-8" />
              <col className="w-24" />
              <col className="w-36" />
              <col className="w-12" />
              <col className="w-24" />
              <col className="w-14" />
              <col className="w-16" />
              <col className="w-14" />
              <col className="w-14" />
              <col className="w-28" />
              <col className="w-24" />
              <col className="w-32" />
            </colgroup>
            <thead className="bg-surface-overlay">
              <tr>
                <th className={thClass}>
                  {activeTab === 'pending' && (
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-brand" />
                  )}
                </th>
                <th className={thClass}>Emp ID</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Grade</th>
                <th className={thClass}>Date</th>
                <th className={thClass + ' text-center'}>Reg OT</th>
                <th className={thClass + ' text-center'}>Non-Reg Hrs</th>
                <th className={thClass + ' text-center'}>Holiday</th>
                <th className={thClass + ' text-center'}>Total</th>
                <th className={thClass}>Approved By</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>OT Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-sm text-content-muted">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const key        = rowKey(r);
                  const isPending  = r.hrStatus === 'Pending';
                  const isSelected = selectedIds.has(key);
                  const { totalOTPay } = calcOtPay(r.grade, r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT);

                  return (
                    <tr
                      key={key}
                      onClick={() => setDetail(r)}
                      className={[
                        'cursor-pointer transition',
                        isSelected ? 'bg-brand-soft' : 'hover:bg-surface-overlay/60',
                      ].join(' ')}
                    >
                      <td className={tdClass} onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <input type="checkbox" checked={isSelected} onChange={() => toggleRow(key)} className="accent-brand" />
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
                      <td className={tdClass + ' truncate text-content-secondary'}>{r.managerName}</td>
                      <td className={tdClass}>
                        {r.hrStatus === 'Approved' && (
                          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">HR Approved</span>
                        )}
                        {r.hrStatus === 'Rejected' && (
                          <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-semibold text-danger">HR Rejected</span>
                        )}
                        {r.hrStatus === 'Pending' && (
                          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">HR Pending</span>
                        )}
                      </td>
                      <td className={tdClass + ' font-semibold text-content-primary'}>
                        AED {fmt(totalOTPay)}
                      </td>
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
        const isPending = r.hrStatus === 'Pending';
        const { hhmm, decimal: workedDec } = formatWorked(r);
        const { grossPay, grossPayPerHour, basicPayMonth, basicPayHour, regularOTPay, after9PMOTPay, holidayOTPay, totalOTPay } =
          calcOtPay(r.grade, r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT);

        const otFields: [string, number][] = [
          ['Regular Day OT', r.regularDayOT],
          ['Non-Reg Hrs OT (22:00–04:00)', r.regularDayOTAfter9PM],
          ['Public / Rest Holiday OT', r.publicHolidayOT],
        ];

        const payRows: [string, string, string?][] = [
          ['Gross Pay / Month', fmt(grossPay)],
          ['Basic Pay / Month (88%)', fmt(basicPayMonth)],
          ['Basic Pay / Hour', fmt(basicPayHour), '×12 ÷ 365 ÷ 8'],
          ['Gross Hourly Rate', fmt(grossPayPerHour), '×12 ÷ 365 ÷ 8'],
          ['Regular Day OT', fmt(regularOTPay), `${r.regularDayOT} hrs × 1.25`],
          ['Non-Reg Hrs OT (22:00–04:00)', fmt(after9PMOTPay), `${r.regularDayOTAfter9PM} hrs × 1.5`],
          ['Public / Rest Holiday OT', fmt(holidayOTPay), `${r.publicHolidayOT} hrs × Gross Rate + ${r.publicHolidayOT} hrs × 0.5 × Basic Rate`],
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
                    {r.hrStatus === 'Approved' && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">HR Approved</span>}
                    {r.hrStatus === 'Rejected' && <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-semibold text-danger">HR Rejected</span>}
                    {r.hrStatus === 'Pending'  && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">Pending</span>}
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

                  {/* Rejection reason */}
                  {r.hrStatus === 'Rejected' && r.hrRejectionComment && (
                    <div className="flex gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-danger mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-danger/90"><span className="font-semibold">Rejection reason:</span> {r.hrRejectionComment}</p>
                    </div>
                  )}

                  {/* OT Hours — read-only */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted">OT Hours (Manager Approved)</p>
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
                      <span className="font-bold text-content-primary">{r.totalOTApproved} hrs</span>
                      <span className="ml-auto text-content-secondary">Approved by</span>
                      <span className="font-semibold text-content-primary">{r.managerName}</span>
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
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => { const rec = detail!; setDetail(null); setRejectDialog({ mode: 'single', record: rec }); setRejectComment(''); }}
                      className="rounded-lg border border-danger px-4 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => applyHrStatusSingle(r, 'Approved')}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Reject comment dialog */}
      {rejectDialog && (
        <Modal zClass="z-60" onClose={() => { setRejectDialog(null); setRejectComment(''); }}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-card border border-line bg-surface-raised shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 border-b border-line px-6 py-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-content-primary">Reject Overtime Request</h3>
                <p className="mt-0.5 text-sm text-content-secondary">
                  {rejectDialog?.mode === 'bulk'
                    ? `You are rejecting ${selectedIds.size} selected record${selectedIds.size !== 1 ? 's' : ''}.`
                    : `You are rejecting ${rejectDialog?.mode === 'single' ? rejectDialog.record.name : ''}'s record for ${rejectDialog?.mode === 'single' ? rejectDialog.record.date : ''}.`}
                </p>
              </div>
            </div>
            <div className="px-6 py-5">
              <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-content-muted mb-2">
                Reason for Rejection <span className="text-danger">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Provide a clear reason so the manager and employee understand the decision…"
                className="w-full resize-none rounded-lg border border-line bg-surface-sunken px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:border-danger focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => { setRejectDialog(null); setRejectComment(''); }}
                className="rounded-lg border border-line px-5 py-2 text-sm font-semibold text-content-secondary transition hover:bg-surface-overlay"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmHrReject}
                disabled={!rejectComment.trim()}
                className="rounded-lg bg-danger px-5 py-2 text-sm font-semibold text-white transition hover:bg-danger/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
