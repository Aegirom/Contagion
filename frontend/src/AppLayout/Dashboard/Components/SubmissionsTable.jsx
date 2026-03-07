import { StatusBadge } from './HooksAndBadges';

const SubmissionsTable = ({ submissions, loading }) => {
  const displayData = loading ? Array(4).fill(null).map((_, i) => ({ id: i, hash: '...', family: 'Loading', status: 'Queued', score: null })) : submissions;

  return (
    <div className="rounded-lg border" style={{ background: '#0F1118', borderColor: '#1E2233' }}>
      <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1E2233' }}>
        <h3 className="font-display text-sm font-black tracking-wider text-white">
          Recent Submissions
        </h3>
        <span
          className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          {loading ? '-' : submissions.length}
        </span>
      </div>
      <div>
        {displayData.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center justify-between px-5 py-2.5 border-b hover:bg-[#141720] transition-colors cursor-pointer"
            style={{ borderColor: '#1E2233' }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="font-code text-sm font-medium truncate" style={{ color: '#22C55E' }}>
                {s.hash.substring(0, 8)}...
              </span>
              <span className="font-body text-sm whitespace-nowrap" style={{ color: '#E5E5E5' }}>
                {loading ? 'Loading...' : s.family}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <StatusBadge status={s.status} />
              <span className="font-code text-sm w-10 text-right" style={{ color: s.score !== null && s.score > 85 ? '#EF4444' : s.score !== null ? '#F59E0B' : '#475569' }}>
                {s.score !== null ? s.score : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmissionsTable;
