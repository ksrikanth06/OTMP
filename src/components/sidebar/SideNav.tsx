import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '@/components/common/Icon';
import { appText, roleDescriptions, roleLabels } from '@/config/constants';
import { getNavForRole } from '@/config/menu';
import { useAppSelector } from '@/store/hooks';

interface SideNavProps {
  /** Mobile drawer open state. */
  open: boolean;
  /** Called when a link is chosen or the backdrop tapped (mobile). */
  onNavigate: () => void;
}

export function SideNav({ open, onNavigate }: SideNavProps) {
  const user = useAppSelector((state) => state.auth.user);
  if (!user) return null;

  const items = getNavForRole(user.role);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    [
      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-brand-soft text-content-primary'
        : 'text-content-secondary hover:bg-surface-overlay hover:text-content-primary',
    ].join(' ');

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-surface-sunken/70 backdrop-blur-sm lg:hidden"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface-raised transition-transform duration-300',
          'lg:static lg:z-auto lg:w-64 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-line px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-content-muted">
            {appText.common.role}
          </p>
          <p className="mt-1 text-sm font-semibold text-content-primary">
            {roleLabels[user.role]}
          </p>
          <p className="text-xs text-content-muted">{roleDescriptions[user.role]}</p>
        </div>

        <nav className="scrollbar-slim flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-content-muted">
            {appText.home.overviewLabel}
          </p>
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  end={item.path === '/home'}
                  className={linkClasses}
                  onClick={onNavigate}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={[
                          'grid h-8 w-8 place-items-center rounded-md transition',
                          isActive
                            ? 'bg-brand text-content-on-brand'
                            : 'bg-surface-overlay text-content-secondary group-hover:text-content-primary',
                        ].join(' ')}
                      >
                        <Icon name={item.icon as IconName} size={18} />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>

                {/* Sub-items */}
                {item.children && item.children.length > 0 && (
                  <ul className="ml-11 mt-1 space-y-1 border-l border-line pl-3">
                    {item.children.map((child) => (
                      <li key={child.key}>
                        <NavLink
                          to={child.path}
                          className={({ isActive }) =>
                            [
                              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                              isActive
                                ? 'bg-brand-soft text-content-primary'
                                : 'text-content-secondary hover:bg-surface-overlay hover:text-content-primary',
                            ].join(' ')
                          }
                          onClick={onNavigate}
                        >
                          <Icon name={child.icon as IconName} size={15} />
                          <span className="truncate">{child.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
