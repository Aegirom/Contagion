import { useState } from 'react';

const ActivityFeed = ({ items, loading }) => {
  const [visibleCount, setVisibleCount] = useState(4);
  const displayItems = loading ? items.slice(0, 3) : items.slice(0, visibleCount);

  return (
    <div className="rounded-lg border" style={{ background: '#0F1118', borderColor: '#1E2233' }}>
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1E2233' }}>
        <h3 className="font-display text-sm font-black tracking-wider text-white">
          Activity Feed
        </h3>
        <span
          className="px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider"
          style={{ background: '#0A0B10', color: '#94A3B8' }}
        >
          {loading ? '-' : items.length}
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: '#1E2233' }}>
        {displayItems.map((item, i) => (
          <div
            key={i}
            className="px-5 py-3 hover:bg-[#141720] transition-colors flex items-start gap-3"
          >
            <div
              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
              style={{ background: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-[#E5E5E5]">{loading ? 'Processing...' : item.msg}</p>
              <p className="font-code text-[10px] mt-0.5" style={{ color: '#475569' }}>
                {loading ? '...' : item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
