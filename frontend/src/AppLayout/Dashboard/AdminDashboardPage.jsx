import { useState, useEffect, useCallback } from "react";
import { adminAPI, moderationAPI } from "../../services/adminService";
import { StatusBadge } from "../Dashboard/Components/HooksAndBadges";
import { useCounter } from "../Dashboard/Components/HooksAndBadges";

const GREEN = "#22C55E";
const RED = "#EF4444";
const PURPLE = "#8B5CF6";
const CYAN = "#22D3EE";
const AMBER = "#F59E0B";

const StatCard = ({ label, value, change, changePos, color, icon, delay = 0, loading = false }) => {
  const [hovered, setHovered] = useState(false);
  const raw = String(value).replace(/[^0-9]/g, "");
  const numericTarget = loading ? 0 : parseInt(raw, 10) || 0;
  const counted = useCounter(numericTarget, 1200, loading ? 0 : delay);
  const displayValue = loading ? "—" : counted.toString();

  const hex2rgb = (hex) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)].join(",");
  };
  const rgb = hex2rgb(color);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 cursor-default"
      style={{
        background: "#F9FAFB",
        border: `1px solid ${hovered ? `rgba(${rgb}, 0.25)` : "#E5E7EB"}`,
        boxShadow: hovered ? `0 0 24px rgba(${rgb}, 0.06)` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          height: "2px",
          background: loading ? "#E5E7EB" : `linear-gradient(to right, ${color}, transparent)`,
          opacity: hovered ? 1 : 0.6,
        }}
      />
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: loading ? "#F3F4F6" : `rgba(${rgb}, 0.08)`, border: `1px solid rgba(${rgb}, 0.12)` }}
          >
            {icon}
          </div>
          {change && (
            <span
              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{
                background: changePos ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
                color: changePos ? "#4ADE80" : "#F87171",
                border: `1px solid ${changePos ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
              }}
            >
              {change}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="font-display text-3xl font-bold tracking-tight" style={{ color: loading ? "#E5E7EB" : "#111827" }}>
            {displayValue}
          </span>
        </div>
        <p className="font-body text-xs" style={{ color: "#6B7280" }}>{label}</p>
      </div>
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const map = {
    Administrator: { color: RED },
    Moderator: { color: PURPLE },
    Analyst: { color: GREEN },
    Observer: { color: CYAN },
  };
  const cfg = map[role] || { color: "#6B7280" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${cfg.color}1A`, color: cfg.color, border: `1px solid ${cfg.color}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {role}
    </span>
  );
};

const StatusIndicator = ({ active }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
    style={{
      background: active ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
      color: active ? "#4ADE80" : "#F87171",
      border: `1px solid ${active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
    }}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? GREEN : RED }} />
    {active ? "Active" : "Suspended"}
  </span>
);

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error("[Admin] Failed to load users:", err.response?.data || err.message);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAction = async (userId, action, payload) => {
    setActionLoading(userId);
    try {
      if (action === "role") await adminAPI.updateUserRole(userId, { role: payload.role });
      if (action === "suspend") await adminAPI.suspendUser(userId);
      if (action === "unsuspend") await adminAPI.unsuspendUser(userId);
      if (action === "delete") await adminAPI.deleteUser(userId);
      setConfirmDelete(null);
      await loadUsers();
    } catch (err) {
      console.error("[Admin] Action failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all" || (filterStatus === "active" ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">Users</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>—</span>
        </div>
        {Array(5).fill(null).map((_, i) => (
          <div key={i} className="grid gap-4 items-center px-5 py-3" style={{ gridTemplateColumns: "1fr 180px 120px 100px 140px", borderBottom: "1px solid #E5E7EB" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full" style={{ background: "#F3F4F6" }} />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 rounded" style={{ background: "#F3F4F6", width: "60%" }} />
                <div className="h-2 rounded" style={{ background: "#E5E7EB", width: "40%" }} />
              </div>
            </div>
            <div className="h-3 rounded" style={{ background: "#F3F4F6" }} />
            <div className="h-5 w-20 rounded" style={{ background: "#F3F4F6" }} />
            <div className="h-5 w-16 rounded" style={{ background: "#F3F4F6" }} />
            <div className="flex gap-1.5">
              <div className="h-6 w-14 rounded" style={{ background: "#F3F4F6" }} />
              <div className="h-6 w-12 rounded" style={{ background: "#F3F4F6" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <p className="font-mono text-xs mb-3" style={{ color: RED }}>{error}</p>
        <button onClick={loadUsers} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.07)", color: GREEN, border: "1px solid rgba(34,197,94,0.15)" }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }}
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 rounded-lg text-sm border" style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }}>
          <option value="all">All Roles</option>
          <option value="Administrator">Administrator</option>
          <option value="Moderator">Moderator</option>
          <option value="Analyst">Analyst</option>
          <option value="Observer">Observer</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg text-sm border" style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">User Management</span>
          <span className="font-mono text-[10px] tabular-nums px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", color: "#4ADE80" }}>{filtered.length}</span>
        </div>

        <div className="grid gap-4 px-5 py-2" style={{ gridTemplateColumns: "1fr 180px 120px 100px 140px", borderBottom: "1px solid #F3F4F6" }}>
          {["User", "Email", "Role", "Status", "Actions"].map((col) => (
            <span key={col} className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#9CA3AF" }}>{col}</span>
          ))}
        </div>

        <div>
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-mono text-xs" style={{ color: "#9CA3AF" }}>No users found</p>
            </div>
          ) : (
            filtered.map((u, i) => (
              <div
                key={u.user_id}
                className="grid gap-4 items-center px-5 py-3 transition-colors"
                style={{
                  gridTemplateColumns: "1fr 180px 120px 100px 140px",
                  borderBottom: i < filtered.length - 1 ? "1px solid #E5E7EB" : "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#E5E7EB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "#F3F4F6", color: GREEN }}>
                    {(u.full_name || u.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-xs truncate block" style={{ color: GREEN }}>{u.full_name || u.username}</span>
                    {u.full_name && <span className="font-body text-xs" style={{ color: "#6B7280" }}>@{u.username}</span>}
                  </div>
                </div>
                <span className="font-mono text-[10px] truncate" style={{ color: "#6B7280" }}>{u.email}</span>
                <select
                  value={u.role}
                  disabled={actionLoading === u.user_id}
                  onChange={(e) => handleAction(u.user_id, "role", { role: e.target.value })}
                  className="px-2 py-1 rounded text-[10px] font-bold border cursor-pointer"
                  style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }}
                >
                  <option value="Analyst">Analyst</option>
                  <option value="Observer">Observer</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Administrator">Administrator</option>
                </select>
                <div>
                  {u.is_active ? (
                    <StatusIndicator active />
                  ) : (
                    <StatusIndicator active={false} />
                  )}
                </div>
                <div className="flex gap-1.5">
                  {u.is_active ? (
                    <button
                      onClick={() => handleAction(u.user_id, "suspend")}
                      disabled={actionLoading === u.user_id}
                      className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-all"
                      style={{
                        background: "rgba(239,68,68,0.07)", color: RED, border: "1px solid rgba(239,68,68,0.15)",
                        opacity: actionLoading === u.user_id ? 0.4 : 1, cursor: actionLoading === u.user_id ? "not-allowed" : "pointer",
                      }}
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(u.user_id, "unsuspend")}
                      disabled={actionLoading === u.user_id}
                      className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-all"
                      style={{
                        background: "rgba(34,197,94,0.07)", color: GREEN, border: "1px solid rgba(34,197,94,0.15)",
                        opacity: actionLoading === u.user_id ? 0.4 : 1, cursor: actionLoading === u.user_id ? "not-allowed" : "pointer",
                      }}
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(u)}
                    disabled={actionLoading === u.user_id}
                    className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-all"
                    style={{
                      background: "rgba(239,68,68,0.07)", color: RED, border: "1px solid rgba(239,68,68,0.15)",
                      opacity: actionLoading === u.user_id ? 0.4 : 1, cursor: actionLoading === u.user_id ? "not-allowed" : "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ background: "#F9FAFB", border: `1px solid ${RED}33` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: RED, boxShadow: `0 0 8px ${RED}` }} />
              <h3 className="font-display text-sm font-bold text-gray-900">Delete User</h3>
            </div>
            <p className="font-body text-xs mb-1" style={{ color: "#6B7280" }}>
              Permanently delete <span style={{ color: RED }}>{confirmDelete.username}</span> and all their data?
            </p>
            <p className="font-mono text-[10px] mb-4" style={{ color: "#9CA3AF" }}>This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", color: CYAN, border: "1px solid rgba(59,130,246,0.15)" }}>Cancel</button>
              <button onClick={() => handleAction(confirmDelete.user_id, "delete")} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.15)", color: RED, border: "1px solid rgba(239,68,68,0.25)" }}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostsPanel() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getAllSubmissions(filterStatus === "all" ? undefined : filterStatus);
      setSubmissions(res.data);
    } catch (err) {
      console.error("[Admin] Failed to load posts:", err.response?.data || err.message);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const sid = confirmDelete.submission_id;
    setActionLoading(sid);
    try {
      await adminAPI.forceDeleteSubmission(sid);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      console.error("[Admin] Delete failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const submissionStatusMap = {
    Published: "Completed",
    Pending: "Queued",
    Draft: "Queued",
    Rejected: "Failed",
    Archived: "Queued",
  };

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">Posts</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>—</span>
        </div>
        {Array(5).fill(null).map((_, i) => (
          <div key={i} className="grid gap-4 items-center px-5 py-3" style={{ gridTemplateColumns: "1fr 120px 80px 100px", borderBottom: "1px solid #E5E7EB" }}>
            <div className="space-y-1.5">
              <div className="h-3 rounded" style={{ background: "#F3F4F6", width: "70%" }} />
              <div className="h-2 rounded" style={{ background: "#E5E7EB", width: "40%" }} />
            </div>
            <div className="h-5 w-20 rounded" style={{ background: "#F3F4F6" }} />
            <div className="h-2 rounded" style={{ background: "#F3F4F6", width: "60%" }} />
            <div className="h-6 w-14 rounded" style={{ background: "#F3F4F6" }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <p className="font-mono text-xs mb-3" style={{ color: RED }}>{error}</p>
        <button onClick={load} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.07)", color: GREEN, border: "1px solid rgba(34,197,94,0.15)" }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg text-sm border" style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }}>
          <option value="all">All Status</option>
          <option value="Published">Published</option>
          <option value="Pending">Pending</option>
          <option value="Draft">Draft</option>
          <option value="Rejected">Rejected</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">Submissions</span>
          <span className="font-mono text-[10px] tabular-nums px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", color: "#4ADE80" }}>{submissions.length}</span>
        </div>

        <div className="grid gap-4 px-5 py-2" style={{ gridTemplateColumns: "1fr 120px 80px 100px", borderBottom: "1px solid #F3F4F6" }}>
          {["Title / Author", "Status", "Date", "Actions"].map((col) => (
            <span key={col} className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#9CA3AF" }}>{col}</span>
          ))}
        </div>

        <div>
          {submissions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-mono text-xs" style={{ color: "#9CA3AF" }}>No submissions found</p>
            </div>
          ) : (
            submissions.map((s, i) => (
              <div
                key={s.submission_id}
                className="grid gap-4 items-center px-5 py-3 transition-colors"
                style={{
                  gridTemplateColumns: "1fr 120px 80px 100px",
                  borderBottom: i < submissions.length - 1 ? "1px solid #E5E7EB" : "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#E5E7EB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div className="min-w-0">
                  <span className="font-mono text-xs truncate block" style={{ color: GREEN }}>{s.title}</span>
                  <span className="font-body text-xs" style={{ color: "#6B7280" }}>by {s.username}</span>
                </div>
                <StatusBadge status={submissionStatusMap[s.status] || "Queued"} />
                <span className="font-mono text-[10px]" style={{ color: "#9CA3AF" }}>{new Date(s.updated_at || s.submitted_at).toLocaleDateString()}</span>
                <button
                  onClick={() => setConfirmDelete(s)}
                  disabled={actionLoading === s.submission_id}
                  className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-all"
                  style={{
                    background: "rgba(239,68,68,0.07)", color: RED, border: "1px solid rgba(239,68,68,0.15)",
                    opacity: actionLoading === s.submission_id ? 0.4 : 1, cursor: actionLoading === s.submission_id ? "not-allowed" : "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ background: "#F9FAFB", border: `1px solid ${RED}33` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: RED, boxShadow: `0 0 8px ${RED}` }} />
              <h3 className="font-display text-sm font-bold text-gray-900">Delete Submission</h3>
            </div>
            <p className="font-body text-xs mb-1" style={{ color: "#6B7280" }}>
              Permanently delete <span style={{ color: RED }}>{confirmDelete.title}</span>?
            </p>
            <p className="font-mono text-[10px] mb-4" style={{ color: "#9CA3AF" }}>This will also delete all comments, likes, shares, reviews, and sandbox data.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", color: CYAN, border: "1px solid rgba(59,130,246,0.15)" }}>Cancel</button>
              <button onClick={handleDelete} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.15)", color: RED, border: "1px solid rgba(239,68,68,0.25)" }}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PendingSubmissionsPanel() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await moderationAPI.getPendingSubmissions();
      setSubmissions(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (submissionId) => {
    setActionLoading(submissionId);
    try {
      await moderationAPI.moderateSubmission(submissionId, "approve");
      await load();
    } catch (err) {
      console.error("[Admin] Approve failed:", err.response?.data || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!confirmReject) return;
    setActionLoading(confirmReject);
    try {
      await moderationAPI.moderateSubmission(confirmReject, "reject", reason);
      setConfirmReject(null);
      setReason("");
      await load();
    } catch (err) {
      console.error("[Admin] Reject failed:", err.response?.data || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER, boxShadow: "0 0 6px rgba(245,158,11,0.7)" }} />
          <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">Pending Review</span>
        </div>
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <div className="space-y-1.5 flex-1"><div className="h-3 rounded" style={{ background: "#F3F4F6", width: "50%" }} /><div className="h-2 rounded" style={{ background: "#E5E7EB", width: "30%" }} /></div>
            <div className="flex gap-1.5"><div className="h-6 w-14 rounded" style={{ background: "#F3F4F6" }} /><div className="h-6 w-14 rounded" style={{ background: "#F3F4F6" }} /></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <p className="font-mono text-xs mb-3" style={{ color: RED }}>{error}</p>
        <button onClick={load} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.07)", color: GREEN, border: "1px solid rgba(34,197,94,0.15)" }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER, boxShadow: "0 0 6px rgba(245,158,11,0.7)" }} />
          <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">Pending Review</span>
        </div>
        <span className="font-mono text-[10px] tabular-nums px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", color: AMBER }}>{submissions.length}</span>
      </div>
      {submissions.length === 0 ? (
        <div className="px-4 py-12 text-center"><p className="font-mono text-xs" style={{ color: "#9CA3AF" }}>No pending submissions</p></div>
      ) : (
        <div>
          {submissions.map((s, i) => (
            <div key={s.submission_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: i < submissions.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs truncate block" style={{ color: GREEN }}>{s.title}</span>
                <div className="flex gap-3 mt-0.5">
                  <span className="font-body text-xs" style={{ color: "#6B7280" }}>by {s.username}</span>
                  <span className="font-mono text-[10px]" style={{ color: "#9CA3AF" }}>{s.template_type}</span>
                  <span className="font-mono text-[10px]" style={{ color: "#9CA3AF" }}>{new Date(s.submitted_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => handleApprove(s.submission_id)} disabled={actionLoading === s.submission_id}
                  className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition-all"
                  style={{ background: "rgba(34,197,94,0.07)", color: GREEN, border: "1px solid rgba(34,197,94,0.15)", opacity: actionLoading === s.submission_id ? 0.4 : 1, cursor: actionLoading === s.submission_id ? "not-allowed" : "pointer" }}>
                  Approve
                </button>
                <button onClick={() => setConfirmReject(s.submission_id)} disabled={actionLoading === s.submission_id}
                  className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition-all"
                  style={{ background: "rgba(239,68,68,0.07)", color: RED, border: "1px solid rgba(239,68,68,0.15)", opacity: actionLoading === s.submission_id ? 0.4 : 1, cursor: actionLoading === s.submission_id ? "not-allowed" : "pointer" }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ background: "#F9FAFB", border: `1px solid ${RED}33` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: RED, boxShadow: `0 0 8px ${RED}` }} />
              <h3 className="font-display text-sm font-bold text-gray-900">Reject Submission</h3>
            </div>
            <p className="font-body text-xs mb-3" style={{ color: "#6B7280" }}>Provide a reason for rejection:</p>
            <input type="text" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border mb-4" style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setConfirmReject(null); setReason(""); }} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", color: CYAN, border: "1px solid rgba(59,130,246,0.15)" }}>Cancel</button>
              <button onClick={handleReject} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.15)", color: RED, border: "1px solid rgba(239,68,68,0.25)" }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SystemPanel() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleBreakdown, setRoleBreakdown] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, actRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRecentActivity(),
        adminAPI.getUsers(),
      ]);
      setStats(statsRes.data);
      setActivity(actRes.data);

      const users = usersRes.data;
      const roles = {};
      users.forEach((u) => { roles[u.role] = (roles[u.role] || 0) + 1; });
      setRoleBreakdown(
        Object.entries(roles)
          .map(([role, count]) => ({ role, count, pct: Math.round((count / users.length) * 100) }))
          .sort((a, b) => b.count - a.count)
      );
    } catch (err) {
      console.error("[Admin] Failed to load system data:", err.response?.data || err.message);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-xl p-8" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="grid grid-cols-2 gap-4">
            {Array(6).fill(null).map((_, i) => (
              <div key={i} className="p-5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <div className="h-2 w-16 rounded mb-3" style={{ background: "#F3F4F6" }} />
                <div className="h-8 w-12 rounded" style={{ background: "#E5E7EB" }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-8" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="h-2 w-24 rounded mb-4" style={{ background: "#F3F4F6" }} />
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-2 w-12 rounded" style={{ background: "#F3F4F6" }} />
              <div className="h-2 flex-1 rounded" style={{ background: "#E5E7EB" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <p className="font-mono text-xs mb-3" style={{ color: RED }}>{error}</p>
        <button onClick={load} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.07)", color: GREEN, border: "1px solid rgba(34,197,94,0.15)" }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={String(stats?.total_users || 0)} change={`${stats?.active_users || 0} active`} changePos color={GREEN} delay={0} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
          <StatCard label="Submissions" value={String(stats?.total_submissions || 0)} change={`${stats?.published_submissions || 0} published`} changePos color={PURPLE} delay={80} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>} />
          <StatCard label="Comments" value={String(stats?.total_comments || 0)} color={CYAN} delay={160} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.75"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>} />
          <StatCard label="Artifacts" value={String(stats?.total_artifacts || 0)} color={AMBER} delay={240} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.75"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>} />
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN, boxShadow: "0 0 6px rgba(34,197,94,0.7)" }} />
            <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">Role Distribution</span>
          </div>
          {roleBreakdown.map((r, i) => {
            const colors = { Administrator: RED, Moderator: PURPLE, Analyst: GREEN, Observer: CYAN };
            const c = colors[r.role] || "#6B7280";
            return (
              <div key={r.role} className="flex items-center gap-4 px-4 py-2.5" style={{ borderBottom: i < roleBreakdown.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <span className="font-mono text-xs w-32" style={{ color: c }}>{r.role}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: c }} />
                </div>
                <span className="font-mono text-[10px] w-12 text-right" style={{ color: "#6B7280" }}>{r.count} ({r.pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: RED, boxShadow: "0 0 6px rgba(239,68,68,0.7)" }} />
            <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">Activity</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>{activity.length}</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {activity.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-xs" style={{ color: "#9CA3AF" }}>No activity</p>
            </div>
          ) : (
            activity.map((a, i) => (
              <div key={a.notification_id} className="flex items-start gap-3 px-4 py-2.5" style={{ borderBottom: i < activity.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: a.is_read ? "#E5E7EB" : RED, boxShadow: a.is_read ? "none" : "0 0 4px rgba(239,68,68,0.5)" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs leading-relaxed" style={{ color: "#6B7280" }}>{a.message}</p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{a.target_username} — {new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("users");
  const tabs = [
    { id: "users", label: "Users" },
    { id: "posts", label: "Posts" },
    { id: "moderation", label: "Moderation" },
    { id: "system", label: "System" },
  ];

  return (
    <main className="flex-1 overflow-auto relative" style={{ background: "#FFFFFF" }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", width: "900px", height: "600px", top: "-200px", right: "-300px", background: "radial-gradient(ellipse, rgba(239,68,68,0.015) 0%, transparent 65%)", borderRadius: "50%" }} />
      </div>

      <div className="relative px-7 py-8 max-w-[1440px] mx-auto space-y-6" style={{ zIndex: 1 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: RED, boxShadow: `0 0 8px ${RED}` }} />
              <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: RED }}>Admin Access</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">Admin Nexus</h1>
            <p className="font-mono text-[10px] mt-1" style={{ color: "#9CA3AF" }}>System overlord panel — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex-shrink-0 mt-1">
            <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.07)", color: RED, border: "1px solid rgba(239,68,68,0.15)" }}>Critical Access</span>
          </div>
        </div>

        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all"
              style={{
                background: tab === t.id ? "rgba(239,68,68,0.07)" : "transparent",
                color: tab === t.id ? RED : "#6B7280",
                border: tab === t.id ? "1px solid rgba(239,68,68,0.15)" : "1px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "users" && <UsersPanel />}
        {tab === "posts" && <PostsPanel />}
        {tab === "moderation" && <PendingSubmissionsPanel />}
        {tab === "system" && <SystemPanel />}
      </div>
    </main>
  );
}
