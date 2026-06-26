import { useState } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { getDirectReports } from '@/config/credentials';
import { useAppSelector } from '@/store/hooks';
import { AuthenticatedUser } from '@/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ShiftType = 'A' | 'B';

const SHIFT_CONFIG: Record<ShiftType, { label: string; time: string; dot: string; badge: string; activeBg: string }> = {
  A: { label: 'Shift A', time: '04:00 – 13:00', dot: 'bg-warning',  badge: 'bg-warning/15 text-warning',   activeBg: 'bg-warning/10 border-warning text-warning' },
  B: { label: 'Shift B', time: '13:00 – 22:00', dot: 'bg-success',  badge: 'bg-success/15 text-success',   activeBg: 'bg-success/10 border-success text-success' },
};

const getDefaultShift = (empIndex: number, day: number): ShiftType =>
  (empIndex + day) % 2 === 0 ? 'A' : 'B';

interface ExtraEntry { hours: number; comments: string }
interface PopupState {
  employee: AuthenticatedUser;
  day: number;
  shift: ShiftType;
  extraHours: number;
  comments: string;
}

export function ShiftPlanPage() {
  const user = useAppSelector((state) => state.auth.user);
  const team = user ? getDirectReports(user.id) : [];

  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDate  = today.getDate();

  const [year, setYear]   = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [selectedDay, setSelectedDay] = useState<number>(todayDate);

  // Override store: key = `${empId}-${day}`
  const [shiftOverrides, setShiftOverrides] = useState<Record<string, ShiftType>>({});
  const [extraStore, setExtraStore]         = useState<Record<string, ExtraEntry>>({});

  const [popup, setPopup] = useState<PopupState | null>(null);

  const years = Array.from({ length: 3 }, (_, i) => todayYear - 1 + i);

  const daysInMonth   = new Date(year, month, 0).getDate();
  const firstWeekDay  = new Date(year, month - 1, 1).getDay();
  const isCurrentMonth = year === todayYear && month === todayMonth;

  const rowKey = (empId: string, day: number) => `${empId}-${day}`;

  const getShift = (empId: string, empIndex: number, day: number): ShiftType =>
    shiftOverrides[rowKey(empId, day)] ?? getDefaultShift(empIndex, day);

  // Calendar grid
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const openPopup = (employee: AuthenticatedUser, empIndex: number, day: number) => {
    const key = rowKey(employee.id, day);
    setPopup({
      employee,
      day,
      shift:      shiftOverrides[key] ?? getDefaultShift(empIndex, day),
      extraHours: extraStore[key]?.hours   ?? 0,
      comments:   extraStore[key]?.comments ?? '',
    });
  };

  const savePopup = () => {
    if (!popup) return;
    const key = rowKey(popup.employee.id, popup.day);
    setShiftOverrides((prev) => ({ ...prev, [key]: popup.shift }));
    if (popup.extraHours > 0 || popup.comments) {
      setExtraStore((prev) => ({ ...prev, [key]: { hours: popup.extraHours, comments: popup.comments } }));
    } else {
      setExtraStore((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
    setPopup(null);
  };

  const selectClass =
    'rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none';

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          Shift Plan
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Click a date to view shifts. Click an employee to edit their shift or add extra hours.
        </p>
      </section>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-6 rounded-card border border-line bg-surface-raised p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Year</span>
          <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setSelectedDay(1); }} className={selectClass}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Month</span>
          <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setSelectedDay(1); }} className={selectClass}>
            {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        {/* Legend */}
        <div className="ml-auto flex items-center gap-5">
          {(Object.entries(SHIFT_CONFIG) as [ShiftType, typeof SHIFT_CONFIG[ShiftType]][]).map(([type, cfg]) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-content-secondary">
              <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
              {cfg.label} ({cfg.time})
            </span>
          ))}
        </div>
      </div>

      {/* Calendar + detail */}
      <div className="flex gap-6 items-start">

        {/* Calendar */}
        <div className="flex-1 overflow-hidden rounded-card border border-line bg-surface-raised shadow-panel">
          <div className="grid grid-cols-7 border-b border-line">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-content-muted">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-line">
            {cells.map((day, idx) => {
              if (!day) return <div key={`blank-${idx}`} className="min-h-[88px] bg-surface-overlay/30" />;

              const isToday    = isCurrentMonth && day === todayDate;
              const isSelected = day === selectedDay;
              const aCount     = team.filter((emp, i) => getShift(emp.id, i, day) === 'A').length;
              const bCount     = team.filter((emp, i) => getShift(emp.id, i, day) === 'B').length;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={[
                    'min-h-[88px] w-full p-2 text-left transition',
                    isSelected
                      ? 'bg-brand-soft ring-1 ring-inset ring-brand'
                      : 'hover:bg-surface-overlay',
                  ].join(' ')}
                >
                  <span className={[
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    isToday ? 'bg-brand text-content-on-brand' : isSelected ? 'text-brand' : 'text-content-primary',
                  ].join(' ')}>
                    {day}
                  </span>
                  <div className="mt-2 space-y-1">
                    {aCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-warning" />
                        <span className="text-[10px] text-content-muted">A ×{aCount}</span>
                      </div>
                    )}
                    {bCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        <span className="text-[10px] text-content-muted">B ×{bCount}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="w-72 shrink-0 overflow-hidden rounded-card border border-line bg-surface-raised shadow-panel">
          <div className="border-b border-line bg-surface-overlay px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Shifts on</p>
            <p className="mt-0.5 text-base font-semibold text-content-primary">
              {selectedDay} {MONTHS[month - 1]} {year}
            </p>
          </div>

          <div className="divide-y divide-line">
            {team.map((emp, idx) => {
              const shift = getShift(emp.id, idx, selectedDay);
              const cfg   = SHIFT_CONFIG[shift];
              const extra = extraStore[rowKey(emp.id, selectedDay)];
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => openPopup(emp, idx, selectedDay)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-surface-overlay"
                >
                  <Avatar name={emp.displayName} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-content-primary">{emp.displayName}</p>
                    <p className="text-xs text-content-muted">{emp.jobTitle}</p>
                    {extra && (
                      <p className="text-[11px] text-brand">+{extra.hours}h extra</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.activeBg}`}>
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Employee shift popup */}
      {popup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setPopup(null)}
        >
          <div
            className="w-96 rounded-card border border-line bg-surface-raised p-6 shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Avatar name={popup.employee.displayName} size={40} />
              <div>
                <p className="text-sm font-semibold text-content-primary">{popup.employee.displayName}</p>
                <p className="text-xs text-content-muted">{popup.employee.jobTitle}</p>
              </div>
            </div>
            <p className="mt-1 text-xs text-content-muted">
              {selectedDay} {MONTHS[month - 1]} {year}
            </p>

            {/* Shift selector */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Shift</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(['A', 'B'] as ShiftType[]).map((type) => {
                const cfg    = SHIFT_CONFIG[type];
                const active = popup.shift === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPopup({ ...popup, shift: type })}
                    className={[
                      'rounded-xl border-2 px-4 py-3 text-left transition',
                      active
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-line bg-surface-sunken text-content-primary hover:border-line-strong',
                    ].join(' ')}
                  >
                    <p className="text-sm font-bold">{cfg.label}</p>
                    <p className="text-xs opacity-70">{cfg.time}</p>
                  </button>
                );
              })}
            </div>

            {/* Extra hours */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Extra Hours</p>
            <input
              type="number"
              min={0}
              step={0.5}
              value={popup.extraHours}
              onChange={(e) => setPopup({ ...popup, extraHours: Math.max(0, Number(e.target.value)) })}
              placeholder="0"
              className="mt-2 w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none"
            />

            {/* Comments */}
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">Comments</p>
            <textarea
              rows={3}
              value={popup.comments}
              onChange={(e) => setPopup({ ...popup, comments: e.target.value })}
              placeholder="Reason for change or extra hours…"
              className="mt-2 w-full resize-none rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
            />

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={savePopup}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="flex-1 rounded-lg border border-line py-2 text-sm font-semibold text-content-secondary transition hover:border-line-strong hover:text-content-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
