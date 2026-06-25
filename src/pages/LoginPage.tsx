import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import whiteLogo from '@/assets/black_logo.svg';
import { Icon } from '@/components/common/Icon';
import { appText, branding, roleDescriptions, roleLabels } from '@/config/constants';
import { UserRole } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearError, login } from '@/store/slices/authSlice';

const roleOrder: UserRole[] = [UserRole.Employee, UserRole.Manager, UserRole.Hr];

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status, error } = useAppSelector((state) => state.auth);

  const [role, setRole] = useState<UserRole>(UserRole.Employee);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const redirectTo = (location.state as LocationState)?.from?.pathname ?? '/home';

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  useEffect(() => {
    if (error) dispatch(clearError());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, username, password]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    dispatch(login({ username, password, role }));
  };

  const isSubmitting = status === 'submitting';

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface-raised px-4 py-12">
      <main className="w-full max-w-md animate-fade-up">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-base shadow-panel">

          {/* Header band with logo */}
          <div className="flex flex-col items-center gap-3 bg-content-primary px-8 py-8">
            <img src={whiteLogo} alt={branding.productName} className="h-10 w-auto" />
            <p className="text-sm font-semibold text-white/80 tracking-wide">
              Overtime Management Portal
            </p>
          </div>

          {/* Form section */}
          <div className="px-8 py-8">
            <h2 className="font-display text-xl font-semibold text-content-primary">
              {appText.login.heading}
            </h2>
            <p className="mt-1 text-sm text-content-secondary">{appText.login.subheading}</p>

            {/* Role selector */}
            <fieldset className="mt-6">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-content-muted">
                {appText.login.roleSelectorLabel}
              </legend>
              <div className="grid grid-cols-3 gap-2" role="radiogroup">
                {roleOrder.map((option) => {
                  const active = role === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setRole(option)}
                      className={[
                        'rounded-lg border px-3 py-2.5 text-sm font-medium transition',
                        active
                          ? 'border-brand bg-brand-soft text-content-primary'
                          : 'border-line bg-surface-raised text-content-secondary hover:border-line-strong hover:text-content-primary',
                      ].join(' ')}
                    >
                      {roleLabels[option]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-content-muted">{roleDescriptions[role]}</p>
            </fieldset>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 block text-sm font-medium text-content-secondary"
                >
                  {appText.common.username}
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-lg border border-line bg-surface-sunken px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
                  placeholder="Employee ID"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-content-secondary"
                >
                  {appText.common.password}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-line bg-surface-sunken px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-danger/30 bg-brand-soft px-3 py-2.5 text-sm text-content-primary"
                >
                  <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-danger" />
                  <span>{error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-content-on-brand transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? appText.common.signingIn : appText.common.signIn}
              </button>

              <p className="text-center text-xs text-content-muted">
                {appText.common.rememberHint}
              </p>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-content-muted">
          {branding.organisation} · {branding.tagline}
        </p>
      </main>
    </div>
  );
}
