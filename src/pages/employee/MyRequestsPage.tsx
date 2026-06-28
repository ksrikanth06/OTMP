import { useState } from 'react';
import { getEmployeeOvertimeRequests, MONTHS } from '@/services/dataService';
import type { OTRecord } from '@/services/dataService';
import { useAppSelector } from '@/store/hooks';
import { Modal } from '@/components/common/Modal';

type Tab = 'all' | 'pending' | 'approved' | 'rejected';

export function MyRequestsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [year, setYear]     = useState(todayYear);
  const [month, setMonth]   = useState(todayMonth);
  const [records, setRecords] = useState<OTRecord[] | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [detail, setDetail] = useState<OTRecord | null>(null);

  if (!user) return null;

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const handleYearChange = (y: number) => {
    setYear(y);
    setMonth((m) => Math.min(m, y === todayYear ? todayMonth : 12));
    setRecords(null);
  };

  const handleFetch = () => {
    setRecords(getEmployeeOvertimeRequests(user.id, year, month));
    setActiveTab('all');
  };

  const counts = records
    ? {
        all:      records.length,
        pending:  records.filter((r) => r.managerStatus === 'Pending').length,
        approved: records.filter((r) => r.managerStatus === 'Approved').length,
        rejected: records.filter((r) => r.managerStatus === 'Rejected').length,
      }
    : null;

  const filtered = records
    ? activeTab === 'all' ? records : records.filter((r) => r.managerStatus.toLowerCase() === activeTab)
    : null;

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

  const statusChip = (status: string) => {
    const cls =
      status === 'Approved' ? 'bg-success/15 text-success' :
      status === 'Rejected' ? 'bg-danger/15 text-danger' :
      'bg-warning/15 text-warning';
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
  };

  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-content-muted whitespace-nowrap border-b border-r border-line';
  const td = 'px-4 py-3.5 text-sm text-content-primary whitespace-nowrap border-r border-line';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          My Requests
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Track the status of your overtime submissions.
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
          <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setRecords(null); }} className={selectClass}>
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={handleFetch}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
        >
          Fetch Requests
        </button>
      </div>

      {/* Tabs */}
      {records && (
        <div className="flex gap-1 rounded-xl border border-line bg-surface-overlay p-1 w-fit">
          {tabs.map(({ key, label }) => {
            const active = activeTab === key;
            const count = counts![key];
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
      )}

      {/* Table */}
      {filtered && (
        filtered.length === 0 ? (
          <div className="grid place-items-center rounded-card border border-dashed border-line bg-surface-raised/40 px-6 py-16 text-center">
            <p className="text-sm text-content-muted">No {activeTab === 'all' ? '' : activeTab} requests found for {MONTHS[month - 1]} {year}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-surface-raised shadow-panel">
            <table className="min-w-full">
              <thead className="bg-surface-overlay">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Clock In</th>
                  <th className={th}>Clock Out</th>
                  <th className={th}>Reg Day OT (Hrs)</th>
                  <th className={th}>Non-Reg Hrs OT (Hrs)</th>
                  <th className={th}>Holiday OT (Hrs)</th>
                  <th className={th}>Total OT (Hrs)</th>
                  <th className={`${th} border-r-0`}>Status</th>
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
                    <td className={`${td} font-mono`}>{r.clockIn}</td>
                    <td className={`${td} font-mono`}>{r.clockOut}</td>
                    <td className={`${td} text-center`}>{r.regularDayOT}</td>
                    <td className={`${td} text-center`}>{r.regularDayOTAfter9PM}</td>
                    <td className={`${td} text-center`}>{r.publicHolidayOT}</td>
                    <td className={`${td} text-center font-semibold`}>{r.totalOTApproved}</td>
                    <td className={`${td} border-r-0`}>{statusChip(r.managerStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
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
                  {statusChip(detail.managerStatus)}
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

            <div className="space-y-3 px-5 py-4">
              {detail.managerStatus === 'Rejected' && detail.managerRejectionComment && (
                <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
                  <p className="text-xs text-danger/90"><span className="font-semibold">Rejection reason:</span> {detail.managerRejectionComment}</p>
                </div>
              )}

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-muted">OT Hours</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['Reg Day OT', detail.regularDayOT],
                    ['Non-Reg Hrs OT', detail.regularDayOTAfter9PM],
                    ['Holiday OT', detail.publicHolidayOT],
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
