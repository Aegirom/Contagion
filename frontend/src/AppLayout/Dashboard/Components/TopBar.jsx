import { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';

const TopBar = ({ pageName, toggleSidebar, sidebarOpen }) => {
  const { user, logout: authLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour12: false });

  const handleProfileClick = () => {
    setProfileOpen(false);
    navigate('/profile');
  };

  const logout = () => {
    authLogout();
    navigate('/login');
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 h-16 flex-shrink-0"
      style={{
        background: 'rgba(10,11,16,0.9)',
        borderBottom: '1px solid rgba(30,34,51,0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="font-code text-xs" style={{ color: '#475569' }}>CONTAGION</span>
        <span style={{ color: '#1E2233' }}>/</span>
        <span className="font-code text-xs" style={{ color: '#22C55E' }}>{pageName}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(5,5,8,0.6)', border: '1px solid rgba(30,34,51,0.7)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.8)', animation: 'blink 2s ease-in-out infinite' }} />
          <span className="font-code text-xs tabular-nums" style={{ color: '#22C55E' }}>{formatTime(currentTime)}</span>
          <span className="font-code text-[10px]" style={{ color: '#475569' }}>{formatDate(currentTime)}</span>
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{ background: 'rgba(5,5,8,0.6)', border: '1px solid rgba(30,34,51,0.7)', color: '#64748B' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; e.currentTarget.style.color = '#22C55E'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(30,34,51,0.7)'; e.currentTarget.style.color = '#64748B'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.8)' }}
          />
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{
              background: profileOpen ? 'rgba(34,197,94,0.08)' : 'rgba(5,5,8,0.6)',
              border: `1px solid ${profileOpen ? 'rgba(34,197,94,0.25)' : 'rgba(30,34,51,0.7)'}`,
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-display text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: '#050508',
                boxShadow: '0 0 10px rgba(34,197,94,0.4)',
              }}
            >
              {user?.username?.charAt(0) || 'A'}
            </div>
            <span className="font-body text-sm hidden md:block" style={{ color: '#94A3B8' }}>
              {user?.username?.split(' ')[0] || 'Analyst'}
            </span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"
              style={{ transition: 'transform 0.2s ease', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden animate-scale-in z-50"
              style={{
                background: 'rgba(10,11,16,0.98)',
                border: '1px solid rgba(30,34,51,0.9)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,51,0.6)' }}>
                <p className="font-body text-sm font-semibold" style={{ color: '#F1F5F9' }}>{user?.username || 'Analyst'}</p>
                <p className="font-code text-xs mt-0.5" style={{ color: '#475569' }}>{user?.email || 'analyst@contagion.sec'}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="badge-info text-[9px]">{user?.role || 'ANALYST'}</span>
                  <span className="badge-low text-[9px]">RANK #42</span>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="block w-full text-left px-4 py-3 font-body text-sm transition-all duration-150"
                style={{ color: '#64748B' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94A3B8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
              >
                <span className="text-base">⚙</span>
                Profile Settings
              </Link>
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="block w-full text-left px-4 py-3 font-body text-sm transition-all duration-150"
                style={{ color: '#64748B' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94A3B8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
              >
                <span className="text-base">🔒</span>
                Security
              </Link>
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="block w-full text-left px-4 py-3 font-body text-sm transition-all duration-150"
                style={{ color: '#64748B' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94A3B8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
              >
                <span className="text-base">🔑</span>
                API Keys
              </Link>
              <div style={{ borderTop: '1px solid rgba(30,34,51,0.6)' }}>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left font-body text-sm transition-all duration-150"
                  style={{ color: '#EF4444' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
