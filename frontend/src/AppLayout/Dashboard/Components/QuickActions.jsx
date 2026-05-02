import { useNavigate } from 'react-router-dom';

const hex2rgb = (hex) => {
  if (!hex || typeof hex !== 'string') return '34,197,94';
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(',');
};

const FALLBACK_ACTIONS = [
  { label: 'Submit Analysis', action: 'submit', color: '#22C55E', icon: '↑', to: '/create-post' },
  { label: 'Leaderboard', action: 'leaderboard', color: '#8B5CF6', icon: '★', to: '/leaderboard' },
  { label: 'Drafts', action: 'drafts', color: '#22D3EE', icon: '◎', to: '/drafts' },
  { label: 'Submissions', action: 'submissions', color: '#F59E0B', icon: '⤓', to: '/submissions' },
];

const ACTION_META = {
  submit: { label: 'Submit Analysis', color: '#22C55E', icon: '↑', to: '/create-post' },
  leaderboard: { label: 'Leaderboard', color: '#8B5CF6', icon: '★', to: '/leaderboard' },
  reviews: { label: 'Submissions', color: '#22D3EE', icon: '◎', to: '/submissions' },
  submissions: { label: 'Submissions', color: '#22D3EE', icon: '◎', to: '/submissions' },
  sandbox: { label: 'Sandbox', color: '#F59E0B', icon: '⤓', to: '/sandbox' },
  export: { label: 'Sandbox', color: '#F59E0B', icon: '⤓', to: '/sandbox' },
  drafts: { label: 'Drafts', color: '#22D3EE', icon: '◎', to: '/drafts' },
};

const QuickActions = ({ loading, actions }) => {
  const navigate = useNavigate();
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
          const fallback = FALLBACK_ACTIONS[i % FALLBACK_ACTIONS.length];
          const meta = ACTION_META[action.action] || fallback;
          const color = action.color || meta.color;
          const icon = meta.icon;
          const label = meta.label || action.label || fallback.label;
          const target = meta.to || fallback.to;
          const rgb = loading ? '20,23,32' : hex2rgb(color);
          return (
            <button
              key={i}
              disabled={loading}
              onClick={() => target && navigate(target)}
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
                  color: loading ? '#2D3748' : color,
                }}
              >
                {icon}
              </div>
              <span
                className="font-mono text-[9px] uppercase tracking-wider"
                style={{ color: loading ? '#2D3748' : '#475569' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
