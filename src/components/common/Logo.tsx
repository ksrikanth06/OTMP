import { branding } from '@/config/constants';
import { Icon } from './Icon';

interface LogoProps {
  /** Hide the wordmark, showing only the mark (useful in collapsed states). */
  compact?: boolean;
}

/**
 * Branding lockup: a gradient mark + product wordmark. The mark uses the
 * red→black brand gradient defined in the theme.
 */
export function Logo({ compact = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-card bg-brand-gradient text-content-on-brand shadow-brand">
        <Icon name="clock" size={22} />
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="font-display text-base font-semibold tracking-tight text-content-primary">
            {branding.productName}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-content-muted">
            {branding.organisation}
          </span>
        </span>
      )}
    </div>
  );
}
