import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../../assets/logo.png';

const SidebarItem = ({ item, active, isOpen }) => (
  <Link
    to={item.to}
    className="flex items-center gap-3 px-4 py-3 rounded-lg font-body text-sm transition-all duration-200 group"
    style={{
      background: active ? 'rgba(34,197,94,0.08)' : 'transparent',
      color: active ? '#22C55E' : '#64748B',
      border: active ? '1px solid rgba(34,197,94,0.15)' : '1px solid transparent',
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.color = '#94A3B8';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#64748B';
      }
    }}
  >
    <span
      className="transition-colors duration-200"
      style={{ color: active ? '#22C55E' : '#475569' }}
    >
      {item.icon}
    </span>
    {isOpen && <span>{item.label}</span>}
    {active && isOpen && (
      <div
        className="ml-auto w-1.5 h-1.5 rounded-full"
        style={{ background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }}
      />
    )}
  </Link>
);

const CollapsedItem = ({ item, active }) => (
  <Link
    key={item.to}
    to={item.to}
    className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-all duration-200"
    style={{
      background: active ? 'rgba(34,197,94,0.1)' : 'transparent',
      color: active ? '#22C55E' : '#475569',
      border: active ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
    }}
  >
    {item.icon}
  </Link>
);

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const navItems = [
    { to: '/feed', label: 'Feed', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
    { to: '/create-post', label: 'Create Analysis', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg> },
    { to: '/dashboard', label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { to: '/submissions', label: 'Submissions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> },
    { to: '/sandbox', label: 'Sandbox', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { to: '/leaderboard', label: 'Leaderboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { to: '/reviews', label: 'Reviews', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ];

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 flex flex-col z-30 transition-all duration-300"
      style={{
        width: isOpen ? '220px' : '64px',
        background: 'rgba(5,5,8,0.95)',
        borderRight: '1px solid rgba(30,34,51,0.8)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 h-16 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(30,34,51,0.6)' }}
      >
        <Link to="/dashboard" className="flex items-center justify-center flex-shrink-0">
          <img src={logo} alt="Contagion" className="w-8 h-8 rounded-lg object-cover" style={{ backgroundColor: '#0F1118' }} />
        </Link>
        {isOpen && (
          <span
            className="font-display text-sm font-bold tracking-[0.15em]"
            style={{ color: '#F1F5F9', whiteSpace: 'nowrap' }}
          >
            CONTAGION
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto transition-colors duration-200"
          style={{ color: '#475569' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#22C55E')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isOpen ? (
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M13 17l5-5-5-5M6 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) =>
          isOpen ? (
            <SidebarItem key={item.to} item={item} active={location.pathname === item.to} isOpen={isOpen} />
          ) : (
            <CollapsedItem key={item.to} item={item} active={location.pathname === item.to} />
          )
        )}
      </nav>

      {/* Sidebar footer */}
      {isOpen && (
        <div
          className="px-4 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(30,34,51,0.6)' }}
        >
          <div
            className="p-3 rounded-lg"
            style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse-green" style={{ background: '#22C55E' }} />
              <span className="font-code text-[9px] tracking-widest uppercase" style={{ color: '#22C55E' }}>
                System Online
              </span>
            </div>
            <p className="font-code text-[9px]" style={{ color: '#1E4D2B' }}>3 sandboxes active</p>
            <p className="font-code text-[9px]" style={{ color: '#1E4D2B' }}>v2.4.1 — stable</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
