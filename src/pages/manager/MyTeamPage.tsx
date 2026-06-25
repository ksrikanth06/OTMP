import { getDirectReports } from '@/config/credentials';
import { useAppSelector } from '@/store/hooks';
import { Avatar } from '@/components/common/Avatar';

export function MyTeamPage() {
  const user = useAppSelector((state) => state.auth.user);
  const team = user ? getDirectReports(user.id) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* Header */}
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          My Team
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          {team.length} direct report{team.length !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Team list */}
      {team.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-surface-raised/50 py-16 text-center">
          <p className="text-sm text-content-muted">No direct reports found.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface-raised shadow-panel overflow-hidden">
          {team.map((member) => (
            <div key={member.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-surface-overlay">
              <Avatar name={member.displayName} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-content-primary">{member.displayName}</p>
                <p className="text-xs text-content-secondary">{member.jobTitle}</p>
              </div>
              <p className="hidden text-xs text-content-muted sm:block">{member.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
