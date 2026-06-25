import { useState } from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface OvertimeRecord {
  empId: string;
  name: string;
  date: string;
  grade: string;
  regularDayOT: number;
  regularDayOTAfter9PM: number;
  publicHolidayOT: number;
  totalOTApproved: number;
  timeInLieu: number;
  preApproved: boolean;
  status: string;
  clockIn: string;
  clockOut: string;
}

/** Parses "HH:MM" into decimal hours, e.g. "08:30" → 8.5 */
const parseHours = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
};

const workedHours = (r: OvertimeRecord) =>
  Math.round((parseHours(r.clockOut) - parseHours(r.clockIn)) * 100) / 100;

const formatWorked = (r: OvertimeRecord) => {
  const total = workedHours(r);
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  const hhmm = `${h} hr${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`;
  const decimal = total;
  return { hhmm, decimal };
};

const DUMMY_RECORDS: OvertimeRecord[] = [
  // Jordan Avery – EMP-1001
  { empId: 'EMP-1001', name: 'Jordan Avery',  date: '02 Jun 2026', grade: 'G5', regularDayOT: 3,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 0, preApproved: true,  status: 'Approved', clockIn: '08:02', clockOut: '20:15' },
  { empId: 'EMP-1001', name: 'Jordan Avery',  date: '05 Jun 2026', grade: 'G5', regularDayOT: 2,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2,   timeInLieu: 0, preApproved: true,  status: 'Approved', clockIn: '08:00', clockOut: '18:30' },
  { empId: 'EMP-1001', name: 'Jordan Avery',  date: '10 Jun 2026', grade: 'G5', regularDayOT: 0,   regularDayOTAfter9PM: 2.5, publicHolidayOT: 0, totalOTApproved: 2.5, timeInLieu: 1, preApproved: false, status: 'Pending',  clockIn: '07:45', clockOut: '21:20' },
  { empId: 'EMP-1001', name: 'Jordan Avery',  date: '14 Jun 2026', grade: 'G5', regularDayOT: 4,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 4,   timeInLieu: 0, preApproved: true,  status: 'Pending',  clockIn: '08:00', clockOut: '20:05' },
  { empId: 'EMP-1001', name: 'Jordan Avery',  date: '19 Jun 2026', grade: 'G5', regularDayOT: 1.5, regularDayOTAfter9PM: 1.5, publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 0, preApproved: false, status: 'Pending',  clockIn: '08:30', clockOut: '21:00' },

  // Priya Nair – EMP-1004
  { empId: 'EMP-1004', name: 'Priya Nair',    date: '01 Jun 2026', grade: 'G7', regularDayOT: 2,   regularDayOTAfter9PM: 0,   publicHolidayOT: 4, totalOTApproved: 6,   timeInLieu: 2, preApproved: false, status: 'Approved', clockIn: '07:55', clockOut: '18:30' },
  { empId: 'EMP-1004', name: 'Priya Nair',    date: '06 Jun 2026', grade: 'G7', regularDayOT: 3.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 0, preApproved: true,  status: 'Approved', clockIn: '08:10', clockOut: '19:55' },
  { empId: 'EMP-1004', name: 'Priya Nair',    date: '11 Jun 2026', grade: 'G7', regularDayOT: 0,   regularDayOTAfter9PM: 3,   publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 1, preApproved: true,  status: 'Approved', clockIn: '09:00', clockOut: '21:30' },
  { empId: 'EMP-1004', name: 'Priya Nair',    date: '17 Jun 2026', grade: 'G7', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 2, totalOTApproved: 4.5, timeInLieu: 0, preApproved: false, status: 'Pending',  clockIn: '07:30', clockOut: '19:45' },
  { empId: 'EMP-1004', name: 'Priya Nair',    date: '23 Jun 2026', grade: 'G7', regularDayOT: 4,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 2, preApproved: true,  status: 'Pending',  clockIn: '08:00', clockOut: '21:15' },

  // Marcus Webb – EMP-1005
  { empId: 'EMP-1005', name: 'Marcus Webb',   date: '03 Jun 2026', grade: 'G4', regularDayOT: 0,   regularDayOTAfter9PM: 3,   publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 1, preApproved: true,  status: 'Approved', clockIn: '09:10', clockOut: '21:45' },
  { empId: 'EMP-1005', name: 'Marcus Webb',   date: '08 Jun 2026', grade: 'G4', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2.5, timeInLieu: 0, preApproved: false, status: 'Approved', clockIn: '08:00', clockOut: '18:45' },
  { empId: 'EMP-1005', name: 'Marcus Webb',   date: '13 Jun 2026', grade: 'G4', regularDayOT: 1,   regularDayOTAfter9PM: 2,   publicHolidayOT: 0, totalOTApproved: 3,   timeInLieu: 0, preApproved: true,  status: 'Pending',  clockIn: '08:15', clockOut: '20:50' },
  { empId: 'EMP-1005', name: 'Marcus Webb',   date: '20 Jun 2026', grade: 'G4', regularDayOT: 3,   regularDayOTAfter9PM: 0.5, publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 1, preApproved: true,  status: 'Pending',  clockIn: '07:50', clockOut: '20:20' },

  // Layla Hassan – EMP-1006
  { empId: 'EMP-1006', name: 'Layla Hassan',  date: '04 Jun 2026', grade: 'G6', regularDayOT: 5,   regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 0, preApproved: false, status: 'Approved', clockIn: '07:30', clockOut: '19:00' },
  { empId: 'EMP-1006', name: 'Layla Hassan',  date: '09 Jun 2026', grade: 'G6', regularDayOT: 2,   regularDayOTAfter9PM: 1.5, publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 0, preApproved: true,  status: 'Approved', clockIn: '08:00', clockOut: '21:00' },
  { empId: 'EMP-1006', name: 'Layla Hassan',  date: '16 Jun 2026', grade: 'G6', regularDayOT: 0,   regularDayOTAfter9PM: 0,   publicHolidayOT: 4, totalOTApproved: 4,   timeInLieu: 2, preApproved: false, status: 'Pending',  clockIn: '07:45', clockOut: '18:15' },
  { empId: 'EMP-1006', name: 'Layla Hassan',  date: '22 Jun 2026', grade: 'G6', regularDayOT: 3.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 1, preApproved: true,  status: 'Pending',  clockIn: '08:05', clockOut: '19:50' },

  // Tom Bancroft – EMP-1007
  { empId: 'EMP-1007', name: 'Tom Bancroft',  date: '05 Jun 2026', grade: 'G3', regularDayOT: 1,   regularDayOTAfter9PM: 2,   publicHolidayOT: 3, totalOTApproved: 6,   timeInLieu: 3, preApproved: true,  status: 'Approved', clockIn: '08:45', clockOut: '22:10' },
  { empId: 'EMP-1007', name: 'Tom Bancroft',  date: '12 Jun 2026', grade: 'G3', regularDayOT: 2.5, regularDayOTAfter9PM: 0,   publicHolidayOT: 0, totalOTApproved: 2.5, timeInLieu: 0, preApproved: false, status: 'Approved', clockIn: '08:00', clockOut: '18:45' },
  { empId: 'EMP-1007', name: 'Tom Bancroft',  date: '18 Jun 2026', grade: 'G3', regularDayOT: 0,   regularDayOTAfter9PM: 3.5, publicHolidayOT: 0, totalOTApproved: 3.5, timeInLieu: 1, preApproved: true,  status: 'Pending',  clockIn: '09:00', clockOut: '22:00' },
  { empId: 'EMP-1007', name: 'Tom Bancroft',  date: '24 Jun 2026', grade: 'G3', regularDayOT: 4,   regularDayOTAfter9PM: 1,   publicHolidayOT: 0, totalOTApproved: 5,   timeInLieu: 2, preApproved: false, status: 'Pending',  clockIn: '07:55', clockOut: '21:30' },
];

export function OvertimeApprovalsPage() {
  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [year, setYear]       = useState(todayYear);
  const [month, setMonth]     = useState(todayMonth);
  const [records, setRecords]         = useState<OvertimeRecord[] | null>(null);
  const [activeTab, setActiveTab]     = useState<'pending' | 'approved'>('pending');
  const [filterName, setFilterName]   = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clockPopup, setClockPopup]   = useState<OvertimeRecord | null>(null);

  const pendingCount  = records ? records.filter((r) => r.status === 'Pending').length  : 0;
  const approvedCount = records ? records.filter((r) => r.status === 'Approved').length : 0;

  const filteredRecords = records
    ? records
        .filter((r) => activeTab === 'pending' ? r.status === 'Pending' : r.status === 'Approved')
        .filter((r) => r.name.toLowerCase().includes(filterName.toLowerCase().trim()))
    : null;

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const handleYearChange = (y: number) => {
    setYear(y);
    setMonth((m) => Math.min(m, y === todayYear ? todayMonth : 12));
    setRecords(null);
    setFilterName('');
  };

  const handleFetch = () => {
    // TODO: replace with API call using year, month
    setRecords(DUMMY_RECORDS);
  };

  const updateHours = (empId: string, date: string, field: 'regularDayOT' | 'regularDayOTAfter9PM' | 'publicHolidayOT', value: number) => {
    setRecords((prev) =>
      prev
        ? prev.map((r) => {
            if (r.empId !== empId || r.date !== date) return r;
            const clamped = Math.max(0, value);
            const others =
              (field === 'regularDayOT'        ? 0 : r.regularDayOT) +
              (field === 'regularDayOTAfter9PM' ? 0 : r.regularDayOTAfter9PM) +
              (field === 'publicHolidayOT'      ? 0 : r.publicHolidayOT);
            const maxAllowed = Math.max(0, workedHours(r) - others);
            const safeValue  = Math.min(clamped, maxAllowed);
            const rounded    = Math.round(safeValue * 100) / 100;
            const updated    = { ...r, [field]: rounded };
            updated.totalOTApproved =
              Math.round((updated.regularDayOT + updated.regularDayOTAfter9PM + updated.publicHolidayOT) * 100) / 100;
            return updated;
          })
        : prev,
    );
  };


  const toggleRow = (key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const allSelected  = !!filteredRecords && filteredRecords.length > 0 && filteredRecords.every((r) => selectedIds.has(r.empId + r.date));
  const someSelected = !!filteredRecords && filteredRecords.some((r) => selectedIds.has(r.empId + r.date)) && !allSelected;

  const toggleAll = () => {
    if (!filteredRecords) return;
    setSelectedIds(allSelected ? new Set() : new Set(filteredRecords.map((r) => r.empId + r.date)));
  };

  const applyStatusToSelected = (newStatus: 'Approved' | 'Rejected') => {
    setRecords((prev) =>
      prev
        ? prev.map((r) =>
            selectedIds.has(r.empId + r.date) ? { ...r, status: newStatus } : r,
          )
        : prev,
    );
    setSelectedIds(new Set());
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
          Select a month and fetch overtime data for your team.
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
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setRecords(null); }}
            className={selectClass}
          >
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>

        <button
          type="button"
          onClick={handleFetch}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
        >
          Fetch Overtime Data
        </button>
      </div>

      {/* Tabs — visible once data is loaded */}
      {records && (
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
                  active
                    ? 'bg-surface-raised text-content-primary shadow-panel'
                    : 'text-content-secondary hover:text-content-primary',
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
      )}

      {/* Name filter — visible once data is loaded */}
      {records && (
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter by employee name…"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-64 rounded-lg border border-line bg-surface-raised px-3.5 py-2 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
          />
          {filterName && (
            <button
              type="button"
              onClick={() => setFilterName('')}
              className="text-xs text-content-muted hover:text-content-primary"
            >
              Clear
            </button>
          )}

          {selectedIds.size > 0 && (
            <>
              <div className="mx-2 h-5 w-px bg-line" />
              <span className="text-xs text-content-secondary">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={() => applyStatusToSelected('Approved')}
                className="rounded-lg bg-success/10 px-4 py-1.5 text-sm font-semibold text-success transition hover:bg-success/20"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => applyStatusToSelected('Rejected')}
                className="rounded-lg bg-danger/10 px-4 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger/20"
              >
                Reject
              </button>
            </>
          )}

          <span className="ml-auto text-xs text-content-muted">
            {filteredRecords!.length} record{filteredRecords!.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Results table */}
      {filteredRecords && (
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
                <th className={th}>Regular Day OT after 9PM (Hrs)</th>
                <th className={th}>Public / Rest Holiday (Hrs)</th>
                <th className={th}>Total OT Approved (Hrs)</th>
                <th className={th}>Time in Lieu (Hrs)</th>
                <th className={`${th} text-center`}>Pre-Approved</th>
                <th className={th}>Status</th>
                <th className={`${th} text-center`}>Clock In / Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredRecords!.map((r) => {
                const rowKey = r.empId + r.date;
                return (
                <tr key={rowKey} className="transition hover:bg-surface-overlay">
                  <td className={`${td} text-center`}>
                    <input
                      type="checkbox"
                      checked={r.status === 'Approved' ? true : selectedIds.has(rowKey)}
                      disabled={r.status === 'Approved'}
                      onChange={() => r.status !== 'Approved' && toggleRow(rowKey)}
                      className={`h-4 w-4 accent-brand ${r.status === 'Approved' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    />
                  </td>
                  <td className={`${td} font-mono text-xs text-content-secondary`}>{r.empId}</td>
                  <td className={`${td} font-medium`}>{r.name}</td>
                  <td className={td}>{r.date}</td>
                  <td className={td}>
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
                      {r.grade}
                    </span>
                  </td>
                  <td className={`${td} text-center`}>
                    {r.status === 'Approved' ? r.regularDayOT : (
                      <input
                        type="number"
                        min={0}
                        value={r.regularDayOT}
                        onChange={(e) => updateHours(r.empId, r.date, 'regularDayOT', Number(e.target.value))}
                        step="0.5"
                        className="w-16 rounded border border-line bg-surface-sunken px-2 py-1 text-center text-sm text-content-primary focus:border-brand focus:outline-none"
                      />
                    )}
                  </td>
                  <td className={`${td} text-center`}>
                    {r.status === 'Approved' ? r.regularDayOTAfter9PM : (
                      <input
                        type="number"
                        min={0}
                        value={r.regularDayOTAfter9PM}
                        onChange={(e) => updateHours(r.empId, r.date, 'regularDayOTAfter9PM', Number(e.target.value))}
                        step="0.5"
                        className="w-16 rounded border border-line bg-surface-sunken px-2 py-1 text-center text-sm text-content-primary focus:border-brand focus:outline-none"
                      />
                    )}
                  </td>
                  <td className={`${td} text-center`}>
                    {r.status === 'Approved' ? r.publicHolidayOT : (
                      <input
                        type="number"
                        min={0}
                        value={r.publicHolidayOT}
                        onChange={(e) => updateHours(r.empId, r.date, 'publicHolidayOT', Number(e.target.value))}
                        step="0.5"
                        className="w-16 rounded border border-line bg-surface-sunken px-2 py-1 text-center text-sm text-content-primary focus:border-brand focus:outline-none"
                      />
                    )}
                  </td>
                  <td className={`${td} text-center font-semibold`}>{r.totalOTApproved}</td>
                  <td className={`${td} text-center`}>{r.timeInLieu}</td>
                  <td className={`${td} text-center`}>
                    {r.preApproved ? (
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="h-4 w-4 cursor-not-allowed opacity-60 accent-brand"
                      />
                    ) : null}
                  </td>
                  <td className={td}>{r.status}</td>
                  <td className={`${td} text-center`}>
                    <button
                      type="button"
                      onClick={() => setClockPopup(r)}
                      className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-content-secondary transition hover:border-brand hover:text-brand"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      )}

      {/* Clock in/out modal */}
      {clockPopup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setClockPopup(null)}
        >
          <div
            className="w-80 rounded-card border border-line bg-surface-raised p-6 shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-base font-semibold text-content-primary">
              Clock In / Out
            </h3>
            <p className="mt-0.5 text-sm text-content-secondary">{clockPopup.name}</p>
            <p className="text-xs text-content-muted">{clockPopup.date}</p>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-surface-overlay px-5 py-4">
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-content-muted">Clock In</p>
                <p className="mt-1.5 text-2xl font-bold text-content-primary">{clockPopup.clockIn}</p>
              </div>
              <div className="h-px flex-1 bg-line" />
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-content-muted">Clock Out</p>
                <p className="mt-1.5 text-2xl font-bold text-content-primary">{clockPopup.clockOut}</p>
              </div>
            </div>

            {(() => {
              const { hhmm, decimal } = formatWorked(clockPopup);
              return (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-line px-5 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-content-muted">Total Time at Work</p>
                    <p className="mt-1 text-sm font-semibold text-content-primary">{hhmm}</p>
                  </div>
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand">
                    {decimal} hrs
                  </span>
                </div>
              );
            })()}

            <button
              type="button"
              onClick={() => setClockPopup(null)}
              className="mt-5 w-full rounded-lg bg-brand py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
