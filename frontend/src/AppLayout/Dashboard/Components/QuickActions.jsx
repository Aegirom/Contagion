const QuickActions = ({ loading, actions }) => {
  // Use API data or default static actions
  const displayActions = loading ? [
    { label: 'Loading...', color: '#475569', icon: '...' },
    { label: '...', color: '#475569', icon: '...' },
    { label: '...', color: '#475569', icon: '...' },
    { label: '...', color: '#475569', icon: '...' },
  ] : (actions && actions.length > 0 ? actions.map(a => ({
    label: a.label,
    color: a.color || '#475569',
    icon: a.icon || '...'
  })) : [
    { label: 'Submit', color: '#22C55E', icon: '↑' },
    { label: 'Leaderboard', color: '#8B5CF6', icon: '★' },
    { label: 'Pending', color: '#22D3EE', icon: '◎' },
    { label: 'Export', color: '#F59E0B', icon: '⤓' },
  ]);

  return (
    <div className="rounded-lg border" style={{ background: '#0F1118', borderColor: '#1E2233' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: '#1E2233' }}>
        <h3 className="font-display text-[10px] font-black tracking-wider text-white uppercase">
          Quick Actions
        </h3>
      </div>

      <div className="divide-y" style={{ borderColor: '#1E2233' }}>
        {displayActions.map((action, i) => (
          <button
            key={i}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors group hover:bg-[#141720]"
            style={{ background: 'transparent' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded flex items-center justify-center font-display text-xs transition-colors"
                style={{
                  background: `rgba(${parseInt(action.color.replace('#', ''), 16)}, 0.1)`,
                  color: action.color,
                  border: `1px solid rgba(${parseInt(action.color.replace('#', ''), 16)}, 0.2)`,
                }}
              >
                {action.icon}
              </div>
              <span className="font-body text-xs text-[#E5E5E5]">{action.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
