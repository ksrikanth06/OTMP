import { useNavigate } from 'react-router-dom';
import { getDirectReports } from '@/config/credentials';
import { useAppSelector } from '@/store/hooks';
import { Avatar } from '@/components/common/Avatar';

export function MyTeamPage() {
  const navigate = useNavigate();
  const user     = useAppSelector((state) => state.auth.user);
  const team     = user ? getDirectReports(user.id) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          My Team
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          {team.length} direct report{team.length !== 1 ? 's' : ''}
        </p>
      </section>

      {team.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-surface-raised/50 py-16 text-center">
          <p className="text-sm text-content-muted">No direct reports found.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface-raised shadow-panel overflow-hidden">
          {team.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => navigate(`/home/team/${member.id}/shift-plan`)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface-overlay"
            >
              <Avatar name={member.displayName} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-content-primary">{member.displayName}</p>
                <p className="text-xs text-content-secondary">{member.jobTitle}</p>
              </div>
              <p className="hidden text-xs text-content-muted sm:block">{member.email}</p>
              <svg className="h-4 w-4 shrink-0 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
