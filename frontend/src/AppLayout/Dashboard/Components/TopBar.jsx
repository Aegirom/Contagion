import { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { NotificationContext } from "../../../context/NotificationContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const resolveAvatarUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
};

const timeAgo = (dateString) => {
  const now = new Date();
  const then = new Date(dateString);
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const notificationIcon = (type) => {
  switch (type) {
    case "like":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "comment":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "sandbox":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
};

const TopBar = ({ pageName }) => {
  const { user, logout: authLogout } = useContext(AuthContext);
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.profile?.avatar_url]);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatDate = (d) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  const formatTime = (d) => d.toLocaleTimeString("en-US", { hour12: false });

  const logout = () => {
    authLogout();
    navigate("/login");
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.notification_id);
    }
    if (notif.related_submission_id) {
      navigate(`/post/${notif.related_submission_id}`);
    }
    setNotifOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 h-16 flex-shrink-0"
      style={{
        background: "rgba(10,11,16,0.9)",
        borderBottom: "1px solid rgba(30,34,51,0.7)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="font-code text-xs" style={{ color: "#475569" }}>
          CONTAGION
        </span>
        <span style={{ color: "#1E2233" }}>/</span>
        <span className="font-code text-xs" style={{ color: "#22C55E" }}>
          {pageName}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div
          className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(5,5,8,0.6)",
            border: "1px solid rgba(30,34,51,0.7)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "#22C55E",
              boxShadow: "0 0 6px rgba(34,197,94,0.8)",
              animation: "blink 2s ease-in-out infinite",
            }}
          />
          <span
            className="font-code text-xs tabular-nums"
            style={{ color: "#22C55E" }}
          >
            {formatTime(currentTime)}
          </span>
          <span className="font-code text-[10px]" style={{ color: "#475569" }}>
            {formatDate(currentTime)}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) fetchNotifications();
            }}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: notifOpen ? "rgba(34,197,94,0.08)" : "rgba(5,5,8,0.6)",
              border: `1px solid ${notifOpen ? "rgba(34,197,94,0.25)" : "rgba(30,34,51,0.7)"}`,
              color: notifOpen ? "#22C55E" : "#64748B",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-code text-[9px] font-bold"
                style={{
                  background: "#EF4444",
                  color: "#fff",
                  boxShadow: "0 0 6px rgba(239,68,68,0.8)",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden animate-scale-in z-50"
              style={{
                background: "rgba(10,11,16,0.98)",
                border: "1px solid rgba(30,34,51,0.9)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid rgba(30,34,51,0.6)" }}
              >
                <span className="font-body text-sm font-semibold" style={{ color: "#F1F5F9" }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="font-code text-[10px] uppercase tracking-wider transition-colors duration-150"
                    style={{ color: "#22C55E" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#4ADE80")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#22C55E")}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="1.5"
                      className="mx-auto mb-2"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <p className="font-body text-xs" style={{ color: "#475569" }}>
                      No notifications
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.notification_id}
                      onClick={() => handleNotifClick(notif)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-150"
                      style={{
                        background: notif.is_read ? "transparent" : "rgba(34,197,94,0.03)",
                        borderBottom: "1px solid rgba(30,34,51,0.4)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = notif.is_read
                          ? "transparent"
                          : "rgba(34,197,94,0.03)")
                      }
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(30,34,51,0.6)" }}
                      >
                        {notificationIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-xs" style={{ color: "#94A3B8" }}>
                          <span className="font-semibold" style={{ color: "#F1F5F9" }}>
                            {notif.actor_username}
                          </span>{" "}
                          {notif.message}
                        </p>
                        <p className="font-code text-[10px] mt-1" style={{ color: "#475569" }}>
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: "#22C55E" }}
                        />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{
              background: profileOpen
                ? "rgba(34,197,94,0.08)"
                : "rgba(5,5,8,0.6)",
              border: `1px solid ${profileOpen ? "rgba(34,197,94,0.25)" : "rgba(30,34,51,0.7)"}`,
            }}
          >
            <div
              className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-display text-xs font-bold"
              style={{
                background: "#1e2233",
                color: "#22C55E",
              }}
            >
              {resolveAvatarUrl(user?.profile?.avatar_url) && !avatarError ? (
                <img
                  src={resolveAvatarUrl(user.profile.avatar_url)}
                  alt={user?.username || "A"}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full">
                  {user?.username?.charAt(0) || "A"}
                </span>
              )}
            </div>
            <span
              className="font-body text-sm hidden md:block"
              style={{ color: "#94A3B8" }}
            >
              {user?.username?.split(" ")[0] || "Analyst"}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#475569"
              strokeWidth="2"
              style={{
                transition: "transform 0.2s ease",
                transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden animate-scale-in z-50"
              style={{
                background: "rgba(10,11,16,0.98)",
                border: "1px solid rgba(30,34,51,0.9)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ borderBottom: "1px solid rgba(30,34,51,0.6)" }}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {user?.profile?.avatar_url ? (
                    <img
                      src={resolveAvatarUrl(user.profile.avatar_url)}
                      alt={user?.username || "Analyst"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-display text-sm font-bold"
                      style={{
                        background: "linear-gradient(135deg, #22C55E, #16A34A)",
                        color: "#050508",
                      }}
                    >
                      {user?.username?.charAt(0) || "A"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-body text-sm font-semibold truncate"
                    style={{ color: "#F1F5F9" }}
                  >
                    {user?.username || "Analyst"}
                  </p>
                  <p
                    className="font-code text-xs mt-0.5 truncate"
                    style={{ color: "#475569" }}
                  >
                    {user?.email || ""}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="badge-info text-[9px] flex-shrink-0">
                      {user?.role || "ANALYST"}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 w-full text-left px-4 py-3 font-body text-sm transition-all duration-150"
                style={{ color: "#64748B" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.color = "#94A3B8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748B";
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Profile Settings
              </Link>
              <div style={{ borderTop: "1px solid rgba(30,34,51,0.6)" }}>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left font-body text-sm transition-all duration-150"
                  style={{ color: "#EF4444" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
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
