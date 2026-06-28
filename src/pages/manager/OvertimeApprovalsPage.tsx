import { useState } from 'react';
import { calcOtPay, fmtAed, MONTHS } from '@/services/dataService';
import type { OTRecord } from '@/services/dataService';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  mkOTKey,
  managerApproveRecords, managerRejectRecords,
  managerApproveSingle, managerRejectSingle, managerSaveOTHours,
} from '@/store/slices/otSlice';
import { Modal } from '@/components/common/Modal';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const parseHours = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
};

const workedHours = (r: OTRecord) =>
  Math.round((parseHours(r.clockOut) - parseHours(r.clockIn)) * 100) / 100;

const formatWorked = (r: OTRecord) => {
  const total = workedHours(r);
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  return { hhmm: `${h} hr${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`, decimal: total };
};

interface DetailDraft {
  record: OTRecord;
  regularDayOT: number;
  regularDayOTAfter9PM: number;
  publicHolidayOT: number;
}

const computeTotal = (d: DetailDraft) =>
  Math.round((d.regularDayOT + d.regularDayOTAfter9PM + d.publicHolidayOT) * 100) / 100;

export function OvertimeApprovalsPage() {
  const dispatch = useAppDispatch();
  const allRecords  = useAppSelector((s) => s.ot.records);
  const managerId   = useAppSelector((s) => s.auth.user?.id ?? '');
  const managerName = useAppSelector((s) => s.auth.user?.displayName ?? 'Manager');

  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [year, setYear]               = useState(todayYear);
  const [month, setMonth]             = useState(todayMonth);
  const [activeTab, setActiveTab]     = useState<'pending' | 'approved'>('pending');
  const [filterName, setFilterName]   = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail]           = useState<DetailDraft | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ mode: 'bulk' } | { mode: 'single'; draft: DetailDraft } | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const records = allRecords.filter((r) => {
    const p = r.date.split(' ');
    return r.managerId === managerId && p[1] === MONTHS_SHORT[month - 1] && Number(p[2]) === year;
  });

  const pendingCount  = records.filter((r) => r.managerStatus === 'Pending').length;
  const approvedCount = records.filter((r) => r.managerStatus === 'Approved').length;

  const filteredRecords = records
    .filter((r) => activeTab === 'pending' ? r.managerStatus === 'Pending' : r.managerStatus === 'Approved')
    .filter((r) => r.name.toLowerCase().includes(filterName.toLowerCase().trim()));

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const handleYearChange = (y: number) => {
    setYear(y);
    setMonth((m) => Math.min(m, y === todayYear ? todayMonth : 12));
    setFilterName('');
    setSelectedIds(new Set());
  };

  const openDetail = (r: OTRecord) => {
    setDetail({ record: r, regularDayOT: r.regularDayOT, regularDayOTAfter9PM: r.regularDayOTAfter9PM, publicHolidayOT: r.publicHolidayOT });
  };

  const updateDraft = (field: 'regularDayOT' | 'regularDayOTAfter9PM' | 'publicHolidayOT', value: number) => {
    setDetail((prev) => {
      if (!prev) return prev;
      const clamped = Math.max(0, value);
      const maxWorked = workedHours(prev.record);
      const others =
        (field === 'regularDayOT'        ? 0 : prev.regularDayOT) +
        (field === 'regularDayOTAfter9PM' ? 0 : prev.regularDayOTAfter9PM) +
        (field === 'publicHolidayOT'      ? 0 : prev.publicHolidayOT);
      const safe = Math.round(Math.min(clamped, Math.max(0, maxWorked - others)) * 100) / 100;
      return { ...prev, [field]: safe };
    });
  };

  const commitDraft = (newStatus?: 'Approved' | 'Rejected', comment?: string) => {
    if (!detail) return;
    const { record, regularDayOT, regularDayOTAfter9PM, publicHolidayOT } = detail;
    const totalOTApproved = computeTotal(detail);
    const base = { empId: record.empId, date: record.date, regularDayOT, regularDayOTAfter9PM, publicHolidayOT, totalOTApproved };
    if (newStatus === 'Approved') {
      dispatch(managerApproveSingle({ ...base, managerName }));
    } else if (newStatus === 'Rejected') {
      dispatch(managerRejectSingle({ ...base, comment: comment ?? '' }));
    } else {
      dispatch(managerSaveOTHours(base));
    }
    setDetail(null);
  };

  const confirmReject = () => {
    const trimmed = rejectComment.trim();
    if (!trimmed || !rejectDialog) return;
    if (rejectDialog.mode === 'bulk') {
      dispatch(managerRejectRecords({ keys: [...selectedIds], comment: trimmed }));
      setSelectedIds(new Set());
    } else {
      const { draft } = rejectDialog;
      const totalOTApproved = computeTotal(draft);
      dispatch(managerRejectSingle({
        empId: draft.record.empId, date: draft.record.date,
        regularDayOT: draft.regularDayOT, regularDayOTAfter9PM: draft.regularDayOTAfter9PM,
        publicHolidayOT: draft.publicHolidayOT, totalOTApproved,
        comment: trimmed,
      }));
    }
    setRejectDialog(null);
    setRejectComment('');
  };

  const toggleRow = (key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const allSelected  = filteredRecords.length > 0 && filteredRecords.every((r) => selectedIds.has(mkOTKey(r.empId, r.date)));
  const someSelected = filteredRecords.some((r) => selectedIds.has(mkOTKey(r.empId, r.date))) && !allSelected;

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredRecords.map((r) => mkOTKey(r.empId, r.date))));
  };

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';
  const th = 'px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-content-muted whitespace-nowrap border-b border-r border-line';
  const td = 'px-3 py-3.5 text-sm text-content-primary whitespace-nowrap border-r border-line';

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page header */}
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          Overtime Approvals
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Review and approve overtime requests for your team.
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
          <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setSelectedIds(new Set()); }} className={selectClass}>
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-line bg-surface-overlay p-1 w-fit">
        {(['pending', 'approved'] as const).map((tab) => {
          const label = tab === 'pending' ? 'Pending Approvals' : 'Approved';
          const count = tab === 'pending' ? pendingCount : approvedCount;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setFilterName(''); setSelectedIds(new Set()); }}
              className={[
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                active ? 'bg-surface-raised text-content-primary shadow-panel' : 'text-content-secondary hover:text-content-primary',
              ].join(' ')}
            >
              {label}
              <span className={[
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                active
                  ? tab === 'pending' ? 'bg-brand text-content-on-brand' : 'bg-success/15 text-success'
                  : 'bg-surface-sunken text-content-muted',
              ].join(' ')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Name filter + bulk actions */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Filter by employee name…"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="w-64 rounded-lg border border-line bg-surface-raised px-3.5 py-2 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
        />
        {filterName && (
          <button type="button" onClick={() => setFilterName('')} className="text-xs text-content-muted hover:text-content-primary">
            Clear
          </button>
        )}
        {selectedIds.size > 0 && (
          <>
            <div className="mx-2 h-5 w-px bg-line" />
            <span className="text-xs text-content-secondary">{selectedIds.size} selected</span>
            <button
              type="button"
              onClick={() => {
                dispatch(managerApproveRecords({ keys: [...selectedIds], managerName }));
                setSelectedIds(new Set());
              }}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => { setRejectDialog({ mode: 'bulk' }); setRejectComment(''); }}
              className="rounded-lg bg-danger/10 px-4 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger/20"
            >
              Reject
            </button>
          </>
        )}
        <span className="ml-auto text-xs text-content-muted">
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} · click a row to view details
        </span>
      </div>

      {/* Results table */}
      <div className="overflow-x-auto rounded-card border border-line bg-surface-raised shadow-panel">
        <table className="min-w-full">
          <thead className="bg-surface-overlay">
            <tr>
              <th className={`${th} text-center w-10`}>
                <input
                  type="checkbox"
                  checked={activeTab === 'approved' ? true : allSelected}
                  disabled={activeTab === 'approved'}
                  ref={(el) => { if (el) el.indeterminate = activeTab === 'approved' ? false : someSelected; }}
                  onChange={toggleAll}
                  className={`h-4 w-4 accent-brand ${activeTab === 'approved' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                />
              </th>
              <th className={th}>Emp ID</th>
              <th className={th}>Name</th>
              <th className={th}>Date</th>
              <th className={th}>Grade</th>
              <th className={th}>Regular Day OT (Hrs)</th>
              <th className={th}>Non-Reg Hrs OT (22:00–04:00) (Hrs)</th>
              <th className={th}>Public / Rest Holiday (Hrs)</th>
              <th className={th}>Total OT (Hrs)</th>
              <th className={th}>Time in Lieu (Hrs)</th>
              <th className={`${th} text-center`}>Pre-Approved</th>
              <th className={th}>Status</th>
              {activeTab === 'approved' && <th className={th}>HR Approval</th>}
              <th className={th}>OT Pay (AED)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'approved' ? 14 : 13} className="py-12 text-center text-sm text-content-muted">
                  No {activeTab} records for {MONTHS[month - 1]} {year}.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const key = mkOTKey(r.empId, r.date);
                const { totalOTPay } = calcOtPay(r.grade, r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT);
                return (
                  <tr
                    key={key}
                    onClick={() => openDetail(r)}
                    className="cursor-pointer transition hover:bg-surface-overlay"
                  >
                    <td className={`${td} text-center`} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={r.managerStatus === 'Approved' ? true : selectedIds.has(key)}
                        disabled={r.managerStatus === 'Approved'}
                        onChange={() => r.managerStatus !== 'Approved' && toggleRow(key)}
                        className={`h-4 w-4 accent-brand ${r.managerStatus === 'Approved' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className={`${td} font-mono text-xs text-content-secondary`}>{r.empId}</td>
                    <td className={`${td} font-medium`}>{r.name}</td>
                    <td className={td}>{r.date}</td>
                    <td className={td}>
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">{r.grade}</span>
                    </td>
                    <td className={`${td} text-center`}>{r.regularDayOT}</td>
                    <td className={`${td} text-center`}>{r.regularDayOTAfter9PM}</td>
                    <td className={`${td} text-center`}>{r.publicHolidayOT}</td>
                    <td className={`${td} text-center font-semibold`}>{r.totalOTApproved}</td>
                    <td className={`${td} text-center`}>{r.timeInLieu}</td>
                    <td className={`${td} text-center`}>
                      {r.preApproved ? (
                        <input type="checkbox" checked disabled className="h-4 w-4 cursor-not-allowed opacity-60 accent-brand" />
                      ) : null}
                    </td>
                    <td className={td}>
                      <span className={[
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        r.managerStatus === 'Approved' ? 'bg-success/15 text-success' :
                        r.managerStatus === 'Rejected' ? 'bg-danger/15 text-danger' :
                        'bg-warning/15 text-warning',
                      ].join(' ')}>
                        {r.managerStatus}
                      </span>
                    </td>
                    {activeTab === 'approved' && (
                      <td className={td}>
                        <span className={[
                          'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          r.hrStatus === 'Approved' ? 'bg-success/15 text-success' :
                          r.hrStatus === 'Rejected' ? 'bg-danger/15 text-danger' :
                          'bg-warning/15 text-warning',
                        ].join(' ')}>
                          {r.hrStatus ?? 'Pending'}
                        </span>
                      </td>
                    )}
                    <td className={`${td} font-semibold`}>AED {fmtAed(totalOTPay)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail popup */}
      {detail && (() => {
        const r = detail.record;
        const isRejected = r.managerStatus === 'Rejected';
        const isPending  = r.managerStatus === 'Pending';
        const { hhmm, decimal: workedDec } = formatWorked(r);
        const totalOT = computeTotal(detail);
        const { grossPay, grossPayPerHour, basicPayMonth, basicPayHour, regularOTPay, after9PMOTPay, holidayOTPay, totalOTPay } =
          calcOtPay(r.grade, detail.regularDayOT, detail.regularDayOTAfter9PM, detail.publicHolidayOT);
        const payRows: [string, string, string?][] = [
          ['Gross Pay / Month', fmtAed(grossPay)],
          ['Basic Pay / Month (88%)', fmtAed(basicPayMonth)],
          ['Basic Hourly Rate', fmtAed(basicPayHour)],
          ['Gross Hourly Rate', fmtAed(grossPayPerHour)],
          ['Regular Day OT', fmtAed(regularOTPay), `${detail.regularDayOT} hr${detail.regularDayOT !== 1 ? 's' : ''} × 1.25`],
          ['Non-Reg Hrs OT (22:00–04:00)', fmtAed(after9PMOTPay), `${detail.regularDayOTAfter9PM} hr${detail.regularDayOTAfter9PM !== 1 ? 's' : ''} × 1.5`],
          ['Public / Rest Holiday OT', fmtAed(holidayOTPay), `${detail.publicHolidayOT} hrs × Gross Rate + ${detail.publicHolidayOT} hrs × 0.5 × Basic Rate`],
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
                    <span className={[
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      r.managerStatus === 'Approved' ? 'bg-success/15 text-success' :
                      r.managerStatus === 'Rejected' ? 'bg-danger/15 text-danger' :
                      'bg-warning/15 text-warning',
                    ].join(' ')}>
                      {r.managerStatus}
                    </span>
                    {r.preApproved && (
                      <span className="rounded-full bg-surface-overlay border border-line px-2 py-0.5 text-[10px] font-medium text-content-secondary">Pre-Approved</span>
                    )}
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
                  {isRejected && r.managerRejectionComment && (
                    <div className="flex gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-danger mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-danger/90"><span className="font-semibold">Rejection reason:</span> {r.managerRejectionComment}</p>
                    </div>
                  )}

                  {/* OT Hours */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted">
                      OT Hours {isPending && `· max ${workedDec} hrs`}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ['Reg Day OT', 'regularDayOT', detail.regularDayOT],
                        ['Non-Reg Hrs OT', 'regularDayOTAfter9PM', detail.regularDayOTAfter9PM],
                        ['Holiday OT', 'publicHolidayOT', detail.publicHolidayOT],
                      ] as [string, 'regularDayOT' | 'regularDayOTAfter9PM' | 'publicHolidayOT', number][]).map(([label, field, val]) => (
                        <div key={field}>
                          <label className="block text-[10px] font-medium text-content-secondary mb-1">{label} (Hrs)</label>
                          {isPending ? (
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={val}
                              onChange={(e) => updateDraft(field, Number(e.target.value))}
                              className="w-full rounded-md border border-line bg-surface-sunken px-2 py-1.5 text-xs text-content-primary focus:border-brand focus:outline-none"
                            />
                          ) : (
                            <div className="rounded-md border border-line bg-surface-overlay px-2 py-1.5 text-xs font-semibold text-content-primary">
                              {val}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-4 rounded-md bg-surface-overlay px-3 py-1.5 text-xs">
                      <span className="text-content-secondary">Total OT Approved</span>
                      <span className="font-bold text-content-primary">{totalOT} hrs</span>
                      <span className="ml-auto text-content-secondary">Time in Lieu</span>
                      <span className="font-semibold text-content-primary">{r.timeInLieu} hrs</span>
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
                      <span className="text-sm font-bold text-brand">AED {fmtAed(totalOTPay)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
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
                      onClick={() => commitDraft()}
                      className="rounded-lg border border-brand px-4 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { const d = detail!; setDetail(null); setRejectDialog({ mode: 'single', draft: d }); setRejectComment(''); }}
                      className="rounded-lg border border-danger px-4 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => commitDraft('Approved')}
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
                    : `You are rejecting ${rejectDialog?.mode === 'single' ? rejectDialog.draft.record.name : ''}'s record for ${rejectDialog?.mode === 'single' ? rejectDialog.draft.record.date : ''}.`}
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
                placeholder="Provide a clear reason so the employee understands the decision…"
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
                onClick={confirmReject}
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
