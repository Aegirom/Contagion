import { useState, useEffect, useRef, useCallback } from 'react';

const useCounter = (target, duration = 1000, delay = 0) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start;
    let raf;
    const delayTimer = setTimeout(() => {
      const tick = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.floor(eased * target));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return value;
};

const useTilt = (strength = 4) => {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, hovering: false });

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -strength,
      y: ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * strength,
      hovering: true,
    });
  }, [strength]);

  const onLeave = useCallback(() => setTilt({ x: 0, y: 0, hovering: false }), []);

  return { ref, tilt, onMove, onLeave };
};

const SeverityBadge = ({ level }) => {
  const map = {
    CRITICAL: { color: '#EF4444' },
    HIGH: { color: '#F97316' },
    MEDIUM: { color: '#F59E0B' },
    LOW: { color: '#22C55E' },
    INFO: { color: '#22D3EE' },
  };
  const cfg = map[level] || map.INFO;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-black uppercase tracking-wider"
      style={{ background: `${cfg.color}1A`, color: cfg.color, border: `1px solid ${cfg.color}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {level}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    Completed: { color: '#22C55E' },
    Analyzing: { color: '#22D3EE' },
    Queued: { color: '#F59E0B' },
    Failed: { color: '#EF4444' },
    'Peer Review': { color: '#8B5CF6' },
  };
  const cfg = map[status] || map.Queued;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-black uppercase tracking-wider"
      style={{ background: `${cfg.color}1A`, color: cfg.color, border: `1px solid ${cfg.color}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {status}
    </span>
  );
};

export { useCounter, useTilt, SeverityBadge, StatusBadge };
