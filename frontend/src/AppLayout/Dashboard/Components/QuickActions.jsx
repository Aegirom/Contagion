const hex2rgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(',');
};

const FALLBACK_ACTIONS = [
  { label: 'Submit',      color: '#22C55E', icon: '↑' },
  { label: 'Leaderboard', color: '#8B5CF6', icon: '★' },
  { label: 'Pending',     color: '#22D3EE', icon: '◎' },
  { label: 'Export',      color: '#F59E0B', icon: '⤓' },
];

const QuickActions = ({ loading, actions }) => {
  const items = loading
    ? Array(4).fill({ label: '', color: '#1E2233', icon: '' })
    : (actions?.length > 0 ? actions : FALLBACK_ACTIONS);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0A0B10', border: '1px solid #1E2233' }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E2233' }}>
        <span className="font-display text-[10px] font-bold tracking-widest uppercase text-white">
          Quick Actions
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px p-px" style={{ background: '#141720' }}>
        {items.map((action, i) => {
          const rgb = loading ? '20,23,32' : hex2rgb(action.color);
          return (
            <button
              key={i}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-2 py-4 px-3 transition-all duration-200 group"
              style={{
                background: '#0A0B10',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#0F1118'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0A0B10'; }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-200"
                style={{
                  background: loading ? '#141720' : `rgba(${rgb}, 0.1)`,
                  border: `1px solid rgba(${rgb}, 0.15)`,
                  color: loading ? '#2D3748' : action.color,
                }}
              >
                {action.icon}
              </div>
              <span
                className="font-mono text-[9px] uppercase tracking-wider"
                style={{ color: loading ? '#2D3748' : '#475569' }}
              >
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
