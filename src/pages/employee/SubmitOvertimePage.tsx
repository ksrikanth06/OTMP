import { useState } from 'react';

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

export function SubmitOvertimePage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!form.date) next.date = 'Date is required.';
    const reg  = parseFloat(form.regularDayOT       || '0');
    const late = parseFloat(form.regularDayOTAfter9PM || '0');
    const hol  = parseFloat(form.publicHolidayOT    || '0');
    const total = reg + late + hol;
    if (total <= 0) next.regularDayOT = 'Enter at least one OT hour type.';
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

  const handleReset = () => {
    setForm(EMPTY);
    setErrors({});
    setSubmitted(false);
  };

  const inputClass = (err?: string) =>
    `w-full rounded-lg border ${err ? 'border-danger' : 'border-line'} bg-surface-sunken px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none`;

  const reg  = parseFloat(form.regularDayOT       || '0') || 0;
  const late = parseFloat(form.regularDayOTAfter9PM || '0') || 0;
  const hol  = parseFloat(form.publicHolidayOT    || '0') || 0;
  const totalOT = Math.round((reg + late + hol) * 100) / 100;

  if (submitted) {
    return (
      <div className="animate-fade-up mx-auto max-w-lg space-y-6">
        <section>
          <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
            Submit Overtime
          </h1>
        </section>

        <div className="rounded-card border border-success/40 bg-success/5 p-8 text-center shadow-panel">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-success" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-content-primary">Request Submitted</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Your overtime request for <span className="font-semibold text-content-primary">{form.date}</span> has been submitted and is pending manager approval.
          </p>

          <div className="mt-5 divide-y divide-line rounded-lg border border-line bg-surface-raised text-left">
            {[
              ['Date', form.date],
              ['Regular Day OT', `${reg} hrs`],
              ['Regular Day OT after 9PM', `${late} hrs`],
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

          <button
            type="button"
            onClick={handleReset}
            className="mt-5 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto max-w-lg space-y-6">
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          Submit Overtime
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          Submit a new overtime request for manager approval.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="rounded-card border border-line bg-surface-raised p-6 shadow-panel space-y-5">
        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-content-muted mb-1.5">
            Date <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            max={maxDate()}
            value={form.date}
            onChange={set('date')}
            className={inputClass(errors.date)}
          />
          {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
        </div>

        {/* OT Hours */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-content-muted mb-2">
            OT Hours <span className="text-danger">*</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {([
              ['regularDayOT',          'Reg Day OT'],
              ['regularDayOTAfter9PM',  'After 9PM OT'],
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
                  onChange={set(field)}
                  className={inputClass(errors[field])}
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
            onChange={set('notes')}
            className="w-full resize-none rounded-lg border border-line bg-surface-sunken px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1 border-t border-line">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-line px-5 py-2 text-sm font-semibold text-content-secondary transition hover:bg-surface-overlay"
          >
            Clear
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong"
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
