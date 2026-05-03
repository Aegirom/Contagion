const hex2rgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(',');
};

const BADGE_COLORS = ['#22C55E', '#8B5CF6', '#F59E0B', '#22D3EE', '#EF4444'];

const RankPanel = ({ loading, reputation }) => {
  const score    = reputation?.reputation_score   ?? 0;
  const xpLeft   = reputation?.xp_until_next_rank ?? 500;
  const progress = reputation?.progress_percent   ?? 0;
  const badges   = reputation?.badges             ?? [];
  const rank     = reputation?.rank               ?? 1;
  const rankLevel = reputation?.rank_level        ?? 0;

  const rankTitles = ['Novice', 'Analyst', 'Specialist', 'Expert', 'Veteran', 'Master', 'Legend'];
  const titleIndex = Math.min(rankLevel, rankTitles.length - 1);
  const rankTitle = rankTitles[titleIndex];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0A0B10', border: '1px solid #1E2233' }}
    >
      <div style={{ height: '1px', background: 'linear-gradient(to right, #6D28D9, transparent)' }} />

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-0 items-stretch">
        {/* Score */}
        <div
          className="flex flex-col justify-center px-6 py-5"
          style={{ borderRight: '1px solid #141720' }}
        >
          <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: '#334155' }}>
            Reputation
          </p>
          <span
            className="font-display text-3xl font-bold tracking-tight"
            style={{ color: loading ? '#1E2233' : '#8B5CF6' }}
          >
            {loading ? '—' : score.toLocaleString()}
          </span>
          <p className="font-mono text-[10px] mt-1" style={{ color: '#2D3748' }}>
            {loading ? '—' : `${xpLeft} XP to rank up`}
          </p>
        </div>

        {/* Progress + badges */}
        <div className="flex flex-col justify-center px-6 py-5 gap-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#334155' }}>
                Progress to next rank
              </span>
              <span className="font-mono text-[10px]" style={{ color: '#6D28D9' }}>
                {loading ? '—' : `${progress}%`}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#141720' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: loading ? '0%' : `${progress}%`,
                  background: 'linear-gradient(to right, #4C1D95, #8B5CF6)',
                  transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.slice(0, 5).map((badge, i) => {
                const color = BADGE_COLORS[i % BADGE_COLORS.length];
                const rgb = hex2rgb(color);
                return (
                  <span
                    key={i}
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded"
                    style={{
                      background: `rgba(${rgb}, 0.06)`,
                      border: `1px solid rgba(${rgb}, 0.12)`,
                      color,
                    }}
                  >
                    {badge}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Rank badge */}
        <div
          className="flex items-center justify-center px-6 py-5"
          style={{ borderLeft: '1px solid #141720' }}
        >
          <div
            className="flex flex-col items-center justify-center w-20 h-20 rounded-xl"
            style={{
              background: 'rgba(109,40,217,0.07)',
              border: '1px solid rgba(109,40,217,0.15)',
            }}
          >
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#4C1D95' }}>
              {loading ? '—' : rankTitle}
            </span>
            <span className="font-display text-2xl font-bold" style={{ color: loading ? '#1E2233' : '#8B5CF6' }}>
              {loading ? '—' : `#${rank}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankPanel;
