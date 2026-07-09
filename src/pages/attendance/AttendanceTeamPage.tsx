import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { useManagerReports } from '@/hooks/useManagerReports';
import { useAppSelector } from '@/store/hooks';
import type { ManagerReportNode } from '@/services/dataService';

// The tree can nest up to 7 levels deep; cap how far indentation/avatar size keep
// shrinking past that so very deep branches don't get squeezed unreadably narrow.
const MAX_INDENT_DEPTH = 6;

function ReportRow({ node, depth }: { node: ManagerReportNode; depth: number }) {
  const navigate = useNavigate();
  const cappedDepth = Math.min(depth, MAX_INDENT_DEPTH);

  return (
    <button
      type="button"
      onClick={() =>
        navigate(`/attendance/team/${node.employeeId}`, {
          state: { displayName: node.displayName, title: node.title },
        })
      }
      style={{ paddingLeft: `${20 + cappedDepth * 28}px` }}
      className="flex w-full items-center gap-4 py-4 pr-5 text-left transition hover:bg-surface-overlay"
    >
      <Avatar name={node.displayName} size={Math.max(44 - cappedDepth * 3, 28)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-content-primary">{node.displayName}</p>
        <p className="text-xs text-content-secondary">{node.title}</p>
      </div>
      <p className="hidden text-xs text-content-muted sm:block">{node.emailAddress}</p>
      <svg className="h-4 w-4 shrink-0 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function ReportTree({ node, depth }: { node: ManagerReportNode; depth: number }) {
  return (
    <div className="divide-y divide-line">
      <ReportRow node={node} depth={depth} />
      {node.children.map((child) => (
        <ReportTree key={child.employeeId} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

const countNodes = (nodes: ManagerReportNode[]): number =>
  nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);

export function AttendanceTeamPage() {
  const user = useAppSelector((state) => state.auth.user);
  const tree = useManagerReports(user?.id);
  const total = countNodes(tree);

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <section>
        <h1 className="font-display text-2xl font-semibold text-content-primary sm:text-3xl">
          My Team
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          {total} report{total !== 1 ? 's' : ''} · select a name to view their attendance
        </p>
      </section>

      {tree.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-surface-raised/50 py-16 text-center">
          <p className="text-sm text-content-muted">No reports found.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface-raised shadow-panel overflow-hidden">
          {tree.map((node) => (
            <ReportTree key={node.employeeId} node={node} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
