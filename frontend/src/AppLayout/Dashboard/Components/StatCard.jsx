import { useCounter } from './HooksAndBadges';

const StatCard = ({ label, value, suffix = '', change, changePos, color, icon, delay, loading = false }) => {
  const numericTarget = loading ? 0 : parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
  const counted = useCounter(numericTarget, 1000, loading ? 0 : delay);
  const displayValue = loading ? '...' : value.includes(',') ? counted.toLocaleString() : counted.toString();

  return (
    <div
      className={`rounded-lg border p-6 hover:border-opacity-40 transition-all ${loading ? 'opacity-75' : ''}`}
      style={{ background: '#0F1118', borderColor: '#1E2233' }}
    >
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `rgba(${parseInt(color, 16)}, 0.1)`,
            borderColor: `rgba(${parseInt(color, 16)}, 0.2)`,
          }}
        >
          {icon}
        </div>
        {change && (
          <span
            className="px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider"
            style={{
              background: changePos ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: changePos ? '#4ADE80' : '#F87171',
              border: `1px solid ${changePos ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {change}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className="font-display text-3xl font-bold tracking-tight text-white"
        >
          {displayValue}
        </span>
        {suffix && (
          <span className="font-body text-sm" style={{ color: '#64748B' }}>
            {suffix}
          </span>
        )}
      </div>

      <p className="font-body text-sm mt-2" style={{ color: '#475569' }}>
        {label}
      </p>
    </div>
  );
};

export default StatCard;
