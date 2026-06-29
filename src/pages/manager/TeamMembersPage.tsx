import { useNavigate, useParams } from 'react-router-dom';
import { getDirectReports } from '@/config/credentials';
import { Avatar } from '@/components/common/Avatar';
import { DIRECTORY } from '@/services/mockData';

export function TeamMembersPage() {
  const navigate       = useNavigate();
  const { managerId }  = useParams<{ managerId: string }>();
  const manager        = DIRECTORY.find((d) => d.id === managerId);
  const members        = managerId ? getDirectReports(managerId) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/home/team')}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-content-secondary transition hover:border-line-strong hover:text-content-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          My Team
        </button>
        {manager && (
          <div className="flex items-center gap-3">
            <Avatar name={manager.displayName} size={40} />
            <div>
              <h1 className="font-display text-xl font-semibold text-content-primary">{manager.displayName}'s Team</h1>
              <p className="text-xs text-content-muted">{manager.jobTitle} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>

      {members.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-surface-raised/50 py-16 text-center">
          <p className="text-sm text-content-muted">No team members found.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface-raised shadow-panel overflow-hidden">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex w-full items-center gap-4 px-5 py-4"
            >
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
