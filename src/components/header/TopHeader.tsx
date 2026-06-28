import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import whiteLogo from '@/assets/white_logo.svg';
import { Avatar } from '@/components/common/Avatar';
import { Icon } from '@/components/common/Icon';
import { appText, branding, roleLabels } from '@/config/constants';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

interface TopHeaderProps {
  /** Toggles the mobile sidebar drawer. */
  onToggleNav: () => void;
  navOpen: boolean;
}

export function TopHeader({ onToggleNav, navOpen }: TopHeaderProps) {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  if (!user) return null;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <header className="relative z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface-raised/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface-raised/70 lg:px-6">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={onToggleNav}
          className="grid h-10 w-10 place-items-center rounded-lg text-content-secondary transition hover:bg-surface-overlay hover:text-content-primary lg:hidden"
          aria-label={navOpen ? appText.header.closeMenu : appText.header.openMenu}
          aria-expanded={navOpen}
        >
          <Icon name={navOpen ? 'close' : 'menu'} />
        </button>
        <img src={whiteLogo} alt={branding.productName} className="h-6 w-auto" />
        <span className="hidden text-sm font-semibold text-content-primary sm:block">
          Overtime Management Portal
        </span>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-3 rounded-full border border-line bg-surface-base/60 py-1 pl-1 pr-2 transition hover:border-line-strong hover:bg-surface-overlay sm:pr-3"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={appText.header.profileMenu}
        >
          <Avatar name={user.displayName} />
          <span className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-sm font-semibold text-content-primary">{user.displayName}</span>
            <span className="text-xs text-content-muted">{roleLabels[user.role]}</span>
          </span>
          <Icon name="chevron-down" size={16} className="hidden text-content-muted sm:block" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 origin-top-right animate-fade-up overflow-hidden rounded-card border border-line bg-surface-overlay shadow-panel"
          >
            <div className="flex items-start gap-3 border-b border-line px-4 py-3">
              <Avatar name={user.displayName} size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-content-primary">
                  {user.displayName}
                </p>
                <p className="truncate text-xs text-content-secondary">{user.email}</p>
                <p className="mt-0.5 text-xs font-medium text-brand">{user.jobTitle}</p>
                <div className="mt-1.5 space-y-0.5">
                  <p className="truncate text-xs text-content-muted">
                    <span className="font-medium text-content-secondary">Entity: </span>{user.entity}
                  </p>
                  <p className="truncate text-xs text-content-muted">
                    <span className="font-medium text-content-secondary">Dept: </span>{user.department}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-content-secondary transition hover:bg-brand-soft hover:text-content-primary"
            >
              <Icon name="logout" size={18} />
              {appText.common.logout}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
