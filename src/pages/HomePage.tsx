import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '@/components/common/Icon';
import { appText, roleDescriptions, roleLabels } from '@/config/constants';
import { getNavForRole } from '@/config/menu';
import { useAppSelector } from '@/store/hooks';

export function HomePage() {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  if (!user) return null;

  // Quick-access cards mirror the sidebar but skip the Dashboard self-link.
  const cards = getNavForRole(user.role).filter((item) => item.path !== '/home');
  const displayRole = user.managerLevel === 'L2'
    ? 'Head of Department'
    : user.managerLevel === 'L1'
      ? 'Line Manager'
      : roleLabels[user.role];
  const displayDescription = user.managerLevel === 'L2'
    ? 'Head of Department (L2) — review and approve team requests'
    : user.managerLevel === 'L1'
      ? 'Line Manager (L1) — review and approve team requests'
      : roleDescriptions[user.role];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="animate-fade-up">
        <p className="text-sm font-medium text-brand">{displayRole}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          {appText.home.welcomePrefix} {user.displayName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-content-secondary">{displayDescription}</p>
      </section>

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-content-muted">
          {appText.home.overviewLabel}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.path)}
              className="group flex items-start gap-4 rounded-card border border-line bg-surface-raised p-5 text-left shadow-panel transition hover:border-brand/60 hover:bg-surface-overlay"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-content-on-brand">
                <Icon name={item.icon as IconName} size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-content-primary">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs text-content-muted">
                  Open {item.label.toLowerCase()}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid place-items-center rounded-card border border-dashed border-line bg-surface-raised/40 px-6 py-16 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="grid" size={24} />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold text-content-primary">
          {appText.home.placeholderTitle}
        </h2>
        <p className="mt-1 max-w-md text-sm text-content-secondary">
          {appText.home.placeholderBody}
        </p>
      </section>
    </div>
  );
}
