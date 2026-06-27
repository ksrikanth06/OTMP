import { useState } from 'react';
import { calcOtPay, fmtAed, MONTHS } from '@/services/dataService';
import type { HrOvertimeRecord } from '@/services/dataService';
import { useAppSelector } from '@/store/hooks';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function exportCsv(rows: HrOvertimeRecord[], month: string, year: number) {
  const headers = [
    'Emp ID', 'Employee Name', 'Grade', 'Date',
    'Regular OT (hrs)', 'OT After 9PM (hrs)', 'Holiday OT (hrs)', 'Total OT (hrs)',
    'Approved By (Manager)',
    'Regular OT Pay (AED)', 'OT After 9PM Pay (AED)', 'Holiday OT Pay (AED)', 'Total OT Pay (AED)',
  ];

  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const dataRows = rows.map((r) => {
    const pay = calcOtPay(r.grade, r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT);
    return [
      r.empId, r.name, r.grade, r.date,
      r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT, r.totalOTApproved,
      r.approvedByManager,
      pay.regularOTPay.toFixed(2), pay.after9PMOTPay.toFixed(2),
      pay.holidayOTPay.toFixed(2), pay.totalOTPay.toFixed(2),
    ].map(escape).join(',');
  });

  const csv = [headers.join(','), ...dataRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `overtime-payroll-${month}-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function HrPayrollPage() {
  const allHrRecords = useAppSelector((s) => s.ot.hrRecords);

  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [year, setYear]   = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [filterName, setFilterName] = useState('');

  const years = Array.from({ length: 5 }, (_, i) => todayYear - i);
  const maxMonth = year === todayYear ? todayMonth : 12;
  const availableMonths = MONTHS.slice(0, maxMonth);

  const records = allHrRecords.filter((r) => {
    const p = r.date.split(' ');
    return r.hrStatus === 'Approved' && p[1] === MONTHS_SHORT[month - 1] && Number(p[2]) === year;
  });

  const filtered = records.filter((r) => r.name.toLowerCase().includes(filterName.toLowerCase().trim()));

  const grandTotal = filtered.reduce((sum, r) => {
    return sum + calcOtPay(r.grade, r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT).totalOTPay;
  }, 0);

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';
  const thClass = 'whitespace-nowrap border-r border-line px-2 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-content-muted last:border-r-0';
  const tdClass = 'border-r border-line px-2 py-2.5 text-xs text-content-primary last:border-r-0';

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          Export Overtime Payroll Data
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          HR-approved overtime records with calculated pay. Export to CSV for payroll processing.
        </p>
      </section>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-surface-raised p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Year</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Month</span>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectClass}>
            {availableMonths.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => exportCsv(filtered, MONTHS[month - 1], year)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            Export CSV
          </button>
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
            <span className="text-xs text-content-muted">
              {filtered!.length} record{filtered!.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div>
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-24" />  {/* emp id */}
                <col className="w-36" />  {/* name */}
                <col className="w-12" />  {/* grade */}
                <col className="w-24" />  {/* date */}
                <col className="w-14" />  {/* reg ot */}
                <col className="w-16" />  {/* after 9pm */}
                <col className="w-14" />  {/* holiday */}
                <col className="w-14" />  {/* total ot */}
                <col className="w-28" />  {/* approved by */}
                <col className="w-24" />  {/* reg pay */}
                <col className="w-24" />  {/* 9pm pay */}
                <col className="w-24" />  {/* holiday pay */}
                <col className="w-28" />  {/* total pay */}
              </colgroup>
              <thead className="bg-surface-overlay">
                <tr>
                  <th className={thClass}>Emp ID</th>
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Grade</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass + ' text-center'}>Reg OT</th>
                  <th className={thClass + ' text-center'}>After 9PM</th>
                  <th className={thClass + ' text-center'}>Holiday</th>
                  <th className={thClass + ' text-center'}>Total OT</th>
                  <th className={thClass}>Approved By</th>
                  <th className={thClass + ' text-right'}>Reg Pay</th>
                  <th className={thClass + ' text-right'}>9PM Pay</th>
                  <th className={thClass + ' text-right'}>Holiday Pay</th>
                  <th className={thClass + ' text-right'}>Total Pay (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered!.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-10 text-center text-sm text-content-muted">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filtered!.map((r) => {
                    const pay = calcOtPay(r.grade, r.regularDayOT, r.regularDayOTAfter9PM, r.publicHolidayOT);
                    return (
                      <tr key={`${r.empId}-${r.date}`} className="hover:bg-surface-overlay/60">
                        <td className={tdClass + ' truncate font-mono'}>{r.empId}</td>
                        <td className={tdClass + ' truncate font-semibold'}>{r.name}</td>
                        <td className={tdClass}>{r.grade}</td>
                        <td className={tdClass + ' whitespace-nowrap'}>{r.date}</td>
                        <td className={tdClass + ' text-center'}>{r.regularDayOT}</td>
                        <td className={tdClass + ' text-center'}>{r.regularDayOTAfter9PM}</td>
                        <td className={tdClass + ' text-center'}>{r.publicHolidayOT}</td>
                        <td className={tdClass + ' text-center font-semibold'}>{r.totalOTApproved}</td>
                        <td className={tdClass + ' truncate text-content-secondary'}>{r.approvedByManager}</td>
                        <td className={tdClass + ' text-right'}>{fmtAed(pay.regularOTPay)}</td>
                        <td className={tdClass + ' text-right'}>{fmtAed(pay.after9PMOTPay)}</td>
                        <td className={tdClass + ' text-right'}>{fmtAed(pay.holidayOTPay)}</td>
                        <td className={tdClass + ' text-right font-semibold text-green-700'}>{fmtAed(pay.totalOTPay)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Grand total footer */}
              {filtered!.length > 0 && (
                <tfoot className="border-t-2 border-line bg-surface-overlay">
                  <tr>
                    <td colSpan={12} className="px-2 py-2.5 text-right text-xs font-semibold text-content-secondary">
                      Grand Total
                    </td>
                    <td className="px-2 py-2.5 text-right text-sm font-bold text-brand">
                      AED {fmtAed(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
    </div>
  );
}

