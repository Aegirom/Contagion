const RankPanel = ({ loading }) => {
  return (
    <div className="rounded-lg border" style={{ background: '#0F1118', borderColor: '#1E2233' }}>
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1E2233' }}>
        <h3 className="font-display text-sm font-black tracking-wider text-white">
          Analyst Reputation
        </h3>
        <span
          className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          {loading ? '...' : 'RANK #42'}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span
              className="font-display text-3xl font-bold tracking-tight"
              style={{ color: loading ? '#475569' : '#8B5CF6' }}
            >
              {loading ? '...' : '2,450'}
            </span>
            <span className="font-body text-sm" style={{ color: '#64748B' }}>XP</span>
          </div>
          <p className="font-body text-xs mt-1" style={{ color: '#475569' }}>
            {loading ? '...' : '550 XP until Rank #41'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-code text-[9px] font-black uppercase tracking-widest" style={{ color: '#475569' }}>
              PROGRESS
            </span>
            <span className="font-code text-[9px]" style={{ color: loading ? '#475569' : '#8B5CF6' }}>
              {loading ? '...' : '82%'}
            </span>
          </div>

          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#0A0B10' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: loading ? '40%' : '82%',
                background: 'linear-gradient(to right, #6D28D9, #8B5CF6)',
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: loading ? '...' : 'Ransomware Hunter', color: '#F59E0B' },
            { label: loading ? '...' : 'APT Analyst', color: '#8B5CF6' },
            { label: loading ? '...' : 'Top Reviewer', color: '#22C55E' },
          ].map((badge, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider"
              style={{
                background: loading ? '#1E2233' : `rgba(${parseInt(badge.color.replace('#', ''), 16)}, 0.1)`,
                border: `1px solid ${loading ? '#1E2233' : `rgba(${parseInt(badge.color.replace('#', ''), 16)}, 0.2)`}`,
                color: loading ? '#64748B' : badge.color,
              }}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RankPanel;
