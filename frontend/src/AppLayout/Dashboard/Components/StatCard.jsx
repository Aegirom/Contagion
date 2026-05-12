import { useState } from 'react';
import { useCounter } from './HooksAndBadges';

const hex2rgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(',');
};

const StatCard = ({ label, value, suffix = '', change, changePos, color, icon, delay = 0, loading = false }) => {
  const [hovered, setHovered] = useState(false);
  const raw = String(value).replace(/[^0-9]/g, '');
  const numericTarget = loading ? 0 : parseInt(raw, 10) || 0;
  const counted = useCounter(numericTarget, 1200, loading ? 0 : delay);
  const displayValue = loading
    ? '—'
    : String(value).includes(',')
    ? counted.toLocaleString()
    : counted.toString();

  const rgb = hex2rgb(color);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 cursor-default"
      style={{
        background: '#F9FAFB',
        border: `1px solid ${hovered ? `rgba(${rgb}, 0.25)` : '#E5E7EB'}`,
        boxShadow: hovered ? `0 0 24px rgba(${rgb}, 0.06)` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Colored accent top line */}
      <div
        style={{
          height: '2px',
          background: loading
            ? '#E5E7EB'
            : `linear-gradient(to right, ${color}, transparent)`,
          transition: 'opacity 0.3s',
          opacity: hovered ? 1 : 0.6,
        }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: loading ? '#F3F4F6' : `rgba(${rgb}, 0.08)`,
              border: `1px solid rgba(${rgb}, 0.12)`,
            }}
          >
            {icon}
          </div>
          {change && (
            <span
              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{
                background: changePos ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                color: changePos ? '#4ADE80' : '#F87171',
                border: `1px solid ${changePos ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}
            >
              {change}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 mb-1">
          <span
            className="font-display text-3xl font-bold tracking-tight"
            style={{ color: loading ? '#E5E7EB' : '#111827' }}
          >
            {displayValue}
          </span>
          {suffix && (
            <span className="font-mono text-xs" style={{ color: '#9CA3AF' }}>
              {suffix}
            </span>
          )}
        </div>

        <p className="font-body text-xs" style={{ color: '#9CA3AF' }}>
          {label}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
