import { useState, useEffect, useCallback } from "react";
import { moderationAPI } from "../../services/adminService";
import { StatusBadge } from "../Dashboard/Components/HooksAndBadges";
import { useCounter } from "../Dashboard/Components/HooksAndBadges";

const GREEN = "#22C55E";
const RED = "#EF4444";
const PURPLE = "#8B5CF6";
const CYAN = "#22D3EE";
const AMBER = "#F59E0B";

const StatCard = ({ label, value, color, delay = 0, loading = false }) => {
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
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{ background: "#F9FAFB", border: `1px solid ${hovered ? `rgba(${rgb}, 0.25)` : "#E5E7EB"}`, boxShadow: hovered ? `0 0 24px rgba(${rgb}, 0.06)` : "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ height: "2px", background: loading ? "#E5E7EB" : `linear-gradient(to right, ${color}, transparent)`, opacity: hovered ? 1 : 0.6 }} />
      <div className="p-5">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="font-display text-3xl font-bold tracking-tight" style={{ color: loading ? "#E5E7EB" : "#111827" }}>{displayValue}</span>
        </div>
        <p className="font-body text-xs" style={{ color: "#6B7280" }}>{label}</p>
      </div>
    </div>
  );
};

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
      console.error("[Moderation] Failed to load:", err.response?.data || err.message);
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
      console.error("[Moderation] Approve failed:", err.response?.data || err.message);
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
      console.error("[Moderation] Reject failed:", err.response?.data || err.message);
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
            <div className="space-y-1.5 flex-1">
              <div className="h-3 rounded" style={{ background: "#F3F4F6", width: "50%" }} />
              <div className="h-2 rounded" style={{ background: "#E5E7EB", width: "30%" }} />
            </div>
            <div className="flex gap-1.5">
              <div className="h-6 w-14 rounded" style={{ background: "#F3F4F6" }} />
              <div className="h-6 w-14 rounded" style={{ background: "#F3F4F6" }} />
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
        <div className="px-4 py-12 text-center">
          <p className="font-mono text-xs" style={{ color: "#9CA3AF" }}>No pending submissions</p>
        </div>
      ) : (
        <div>
          {submissions.map((s, i) => (
            <div
              key={s.submission_id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
              style={{ borderBottom: i < submissions.length - 1 ? "1px solid #F3F4F6" : "none" }}
            >
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs truncate block" style={{ color: GREEN }}>{s.title}</span>
                <div className="flex gap-3 mt-0.5">
                  <span className="font-body text-xs" style={{ color: "#6B7280" }}>by {s.username}</span>
                  <span className="font-mono text-[10px]" style={{ color: "#9CA3AF" }}>{s.template_type}</span>
                  <span className="font-mono text-[10px]" style={{ color: "#9CA3AF" }}>{new Date(s.submitted_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleApprove(s.submission_id)}
                  disabled={actionLoading === s.submission_id}
                  className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition-all"
                  style={{
                    background: "rgba(34,197,94,0.07)", color: GREEN, border: "1px solid rgba(34,197,94,0.15)",
                    opacity: actionLoading === s.submission_id ? 0.4 : 1, cursor: actionLoading === s.submission_id ? "not-allowed" : "pointer",
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => setConfirmReject(s.submission_id)}
                  disabled={actionLoading === s.submission_id}
                  className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition-all"
                  style={{
                    background: "rgba(239,68,68,0.07)", color: RED, border: "1px solid rgba(239,68,68,0.15)",
                    opacity: actionLoading === s.submission_id ? 0.4 : 1, cursor: actionLoading === s.submission_id ? "not-allowed" : "pointer",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsPanel() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await moderationAPI.getComments();
      setComments(res.data);
    } catch (err) {
      console.error("[Moderation] Failed to load comments:", err.response?.data || err.message);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (commentId) => {
    setActionLoading(commentId);
    try {
      await moderationAPI.deleteComment(commentId);
      await load();
    } catch (err) {
      console.error("[Moderation] Delete failed:", err.response?.data || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: CYAN, boxShadow: "0 0 6px rgba(34,211,238,0.7)" }} />
          <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">Comments</span>
        </div>
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="px-4 py-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <div className="space-y-1.5">
              <div className="h-3 rounded" style={{ background: "#F3F4F6", width: "80%" }} />
              <div className="h-2 rounded" style={{ background: "#E5E7EB", width: "40%" }} />
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
        <button onClick={load} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.07)", color: GREEN, border: "1px solid rgba(34,197,94,0.15)" }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: CYAN, boxShadow: "0 0 6px rgba(34,211,238,0.7)" }} />
          <span className="font-display text-[10px] font-bold tracking-widest uppercase text-gray-900">Comments</span>
        </div>
        <span className="font-mono text-[10px] tabular-nums px-2 py-0.5 rounded" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)", color: CYAN }}>{comments.length}</span>
      </div>

      {comments.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="font-mono text-xs" style={{ color: "#9CA3AF" }}>No comments found</p>
        </div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto">
          {comments.map((c, i) => (
            <div
              key={c.comment_id}
              className="flex items-start justify-between gap-3 px-4 py-3"
              style={{ borderBottom: i < comments.length - 1 ? "1px solid #F3F4F6" : "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#E5E7EB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div className="min-w-0 flex-1">
                <p className="font-body text-xs leading-relaxed" style={{ color: "#6B7280" }}>{c.content}</p>
                <div className="flex gap-3 mt-0.5">
                  <span className="font-mono text-[10px]" style={{ color: "#6B7280" }}>by {c.username}</span>
                  <span className="font-mono text-[10px] truncate max-w-[150px]" style={{ color: "#9CA3AF" }} title={c.submission_title}>{c.submission_title}</span>
                  <span className="font-mono text-[10px]" style={{ color: "#9CA3AF" }}>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(c.comment_id)}
                disabled={actionLoading === c.comment_id}
                className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-all flex-shrink-0"
                style={{
                  background: "rgba(239,68,68,0.07)", color: RED, border: "1px solid rgba(239,68,68,0.15)",
                  opacity: actionLoading === c.comment_id ? 0.4 : 1, cursor: actionLoading === c.comment_id ? "not-allowed" : "pointer",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModerationDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await moderationAPI.getStats();
        setStats(res.data);
      } catch (err) {
        console.error("[Moderation] Failed to load stats:", err.response?.data || err.message);
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleReject = async () => {
    if (!confirmReject) return;
    try {
      await moderationAPI.moderateSubmission(confirmReject, "reject", reason);
      setConfirmReject(null);
      setReason("");
      window.location.reload();
    } catch (err) {
      console.error("[Moderation] Reject failed:", err.response?.data || err.message);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-auto" style={{ background: "#FFFFFF" }}>
        <div className="px-7 py-8 max-w-[1440px] mx-auto space-y-6">
          <div className="space-y-1">
            <div className="h-2 w-20 rounded" style={{ background: "#F3F4F6" }} />
            <div className="h-8 w-40 rounded" style={{ background: "#E5E7EB" }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="p-5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <div className="h-8 w-12 rounded" style={{ background: "#E5E7EB" }} />
                <div className="h-2 w-16 rounded mt-3" style={{ background: "#F3F4F6" }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 overflow-auto" style={{ background: "#FFFFFF" }}>
        <div className="px-7 py-8 max-w-[1440px] mx-auto space-y-6">
          <div className="rounded-xl p-8 text-center" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <p className="font-mono text-xs mb-3" style={{ color: RED }}>{error}</p>
            <button onClick={() => window.location.reload()} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.07)", color: GREEN, border: "1px solid rgba(34,197,94,0.15)" }}>Retry</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto relative" style={{ background: "#FFFFFF" }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", width: "900px", height: "600px", top: "-200px", right: "-300px", background: "radial-gradient(ellipse, rgba(245,158,11,0.015) 0%, transparent 65%)", borderRadius: "50%" }} />
      </div>

      <div className="relative px-7 py-8 max-w-[1440px] mx-auto space-y-6" style={{ zIndex: 1 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER, boxShadow: `0 0 8px rgba(245,158,11,0.7)` }} />
              <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: AMBER }}>Moderation</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">Moderation Hub</h1>
            <p className="font-mono text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Content review & moderation — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Pending" value={String(stats?.pending_submissions || 0)} color={AMBER} delay={0} />
          <StatCard label="Rejected" value={String(stats?.rejected_submissions || 0)} color={RED} delay={80} />
          <StatCard label="Published" value={String(stats?.published_submissions || 0)} color={GREEN} delay={160} />
          <StatCard label="Comments" value={String(stats?.total_comments || 0)} color={CYAN} delay={240} />
        </div>

        <PendingSubmissionsPanel />
        <CommentsPanel />
      </div>

      {confirmReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ background: "#F9FAFB", border: `1px solid ${RED}33` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: RED, boxShadow: `0 0 8px ${RED}` }} />
              <h3 className="font-display text-sm font-bold text-gray-900">Reject Submission</h3>
            </div>
            <p className="font-body text-xs mb-3" style={{ color: "#6B7280" }}>Provide a reason for rejection:</p>
            <input
              type="text"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border mb-4"
              style={{ background: "#F9FAFB", borderColor: "#E5E7EB", color: "#111827" }}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setConfirmReject(null); setReason(""); }} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", color: CYAN, border: "1px solid rgba(59,130,246,0.15)" }}>Cancel</button>
              <button onClick={handleReject} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.15)", color: RED, border: "1px solid rgba(239,68,68,0.25)" }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
