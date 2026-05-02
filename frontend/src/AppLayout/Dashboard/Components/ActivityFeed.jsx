import { useState } from 'react';

const ActivityFeed = ({ items, loading }) => {
  const [visibleCount, setVisibleCount] = useState(6);
  const displayItems = loading
    ? Array(4).fill({ msg: '', time: '', color: '#1E2233' })
    : items.slice(0, visibleCount);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0A0B10', border: '1px solid #1E2233' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #1E2233' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#22C55E',
              boxShadow: '0 0 6px rgba(34,197,94,0.7)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <span className="font-display text-[10px] font-bold tracking-widest uppercase text-white">
            Live Feed
          </span>
        </div>
        <span
          className="font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded"
          style={{ background: '#141720', color: '#334155' }}
        >
          {loading ? '—' : items.length}
        </span>
      </div>

      {/* Items */}
      <div>
        {displayItems.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-[#0F1118]"
            style={{ borderBottom: i < displayItems.length - 1 ? '1px solid #141720' : 'none' }}
          >
            {loading ? (
              <>
                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: '#1E2233' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded" style={{ background: '#141720', width: '75%' }} />
                  <div className="h-2 rounded" style={{ background: '#0F1118', width: '40%' }} />
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                  style={{ background: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
                    {item.msg}
                  </p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: '#2D3748' }}>
                    {item.time}
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {!loading && items.length > visibleCount && (
        <button
          onClick={() => setVisibleCount(v => v + 5)}
          className="w-full py-2 font-mono text-[10px] uppercase tracking-widest transition-colors hover:bg-[#0F1118]"
          style={{ color: '#334155', borderTop: '1px solid #141720' }}
        >
          + more
        </button>
      )}
    </div>
  );
};

export default ActivityFeed;
