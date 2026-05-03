import React from 'react';

const VerifiedBadge = ({ role, size = 16, style = {} }) => {
  if (role !== 'Admin' && role !== 'Moderator' && role !== 'Administrator') return null;

  const isAdmin = role === 'Admin' || role === 'Administrator';

  const colors = isAdmin
    ? { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#F87171', icon: '#EF4444' }
    : { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#FBBF24', icon: '#F59E0B' };

  const labelSize = Math.max(9, Math.round(size * 0.65));
  const iconSize = Math.max(10, size - 4);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        marginLeft: '4px',
        padding: '2px 5px',
        borderRadius: '4px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        fontSize: `${labelSize}px`,
        fontWeight: '700',
        fontFamily: 'monospace',
        letterSpacing: '0.06em',
        lineHeight: 1,
        color: colors.text,
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          stroke={colors.icon}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke={colors.icon}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {isAdmin ? 'Admin' : 'Mod'}
    </span>
  );
};

export default VerifiedBadge;
