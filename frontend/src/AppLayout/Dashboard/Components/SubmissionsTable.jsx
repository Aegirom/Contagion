import { StatusBadge } from './HooksAndBadges';

const SKELETON = Array(5).fill(null).map((_, i) => ({
  id: i, hash: 'xxxxxxxx', family: '—', status: 'Queued', score: null, date: '—',
}));

const SubmissionsTable = ({ submissions, loading }) => {
  const rows = loading ? SKELETON : submissions;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0A0B10', border: '1px solid #1E2233' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid #1E2233' }}
      >
        <span className="font-display text-[10px] font-bold tracking-widest uppercase text-white">
          Recent Submissions
        </span>
        <span
          className="font-mono text-[10px] tabular-nums px-2 py-0.5 rounded"
          style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.12)',
            color: '#4ADE80',
          }}
        >
          {loading ? '—' : submissions.length}
        </span>
      </div>

      {/* Column headers */}
      <div
        className="grid gap-4 px-5 py-2"
        style={{
          gridTemplateColumns: '1fr 120px 80px 60px',
          borderBottom: '1px solid #141720',
        }}
      >
        {['Sample / Family', 'Status', 'Date', 'Score'].map(col => (
          <span key={col} className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#2D3748' }}>
            {col}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div>
        {rows.map((s, i) => (
          <div
            key={s.id ?? i}
            className="grid gap-4 items-center px-5 py-3 transition-colors cursor-pointer"
            style={{
              gridTemplateColumns: '1fr 120px 80px 60px',
              borderBottom: i < rows.length - 1 ? '1px solid #0F1118' : 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#0F1118'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Sample + family */}
            <div className="flex flex-col gap-0.5 min-w-0">
              {loading ? (
                <>
                  <div className="h-3 rounded" style={{ background: '#141720', width: '60%' }} />
                  <div className="h-2.5 rounded" style={{ background: '#0F1118', width: '45%' }} />
                </>
              ) : (
                <>
                  <span className="font-mono text-xs truncate" style={{ color: '#22C55E' }}>
                    {s.hash.substring(0, 8)}…
                  </span>
                  <span className="font-body text-xs" style={{ color: '#475569' }}>
                    {s.family}
                  </span>
                </>
              )}
            </div>

            {/* Status */}
            <div>
              {loading
                ? <div className="h-5 w-20 rounded" style={{ background: '#141720' }} />
                : <StatusBadge status={s.status} />
              }
            </div>

            {/* Date */}
            <span className="font-mono text-[10px]" style={{ color: loading ? '#1E2233' : '#334155' }}>
              {loading ? '—' : s.date}
            </span>

            {/* Score */}
            <span
              className="font-mono text-sm tabular-nums text-right"
              style={{
                color: s.score === null
                  ? '#2D3748'
                  : s.score > 85
                  ? '#EF4444'
                  : '#F59E0B',
              }}
            >
              {loading ? '—' : s.score !== null ? s.score : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmissionsTable;
