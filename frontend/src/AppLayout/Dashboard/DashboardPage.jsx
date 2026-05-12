import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  getUserSubmissions,
  getUserStats,
  getDashboardActivity,
  getAnalystReputation,
} from "../../services/api";
import StatCard from "./Components/StatCard";
import ActivityFeed from "./Components/ActivityFeed";
import SubmissionsTable from "./Components/SubmissionsTable";
import RankPanel from "./Components/RankPanel";
import PlusButton from "./Components/Buttons";
import VerifiedBadge from "./Components/VerifiedBadge";

const EMPTY_STATS = {
  total_submissions: 0,
  published_submissions: 0,
  pending_submissions: 0,
};

const EmptySubmissions = () => (
  <div
    className="rounded-xl flex flex-col items-center justify-center gap-4 p-16 text-center"
    style={{
      border: "1px dashed #E5E7EB",
      background: "rgba(249,250,251,0.5)",
    }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center"
      style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9CA3AF"
        strokeWidth="1.5"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
    <div>
      <p className="font-display text-sm font-bold text-gray-900 mb-1">
        No submissions yet
      </p>
      <p className="font-body text-xs" style={{ color: "#9CA3AF" }}>
        Start your first analysis to build your portfolio.
      </p>
    </div>
    <PlusButton text="Create Analysis" />
  </div>
);

const DashboardPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);

  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activityItems, setActivity] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.user_id && !user?.id) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    Promise.all([
      getUserStats().then((r) => r.data),
      getUserSubmissions(7).then((r) => r.data),
      getDashboardActivity()
        .then((r) => r.data)
        .catch(() => ({ items: [] })),
      getAnalystReputation()
        .then((r) => r.data)
        .catch(() => null),
    ])
      .then(([statsData, subsData, actData, repData]) => {
        setStats(statsData);
        setSubmissions(Array.isArray(subsData) ? subsData : []);
        setActivity(actData?.items ?? []);
        setReputation(repData);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (error) {
    return (
      <main
        className="flex-1 flex items-center justify-center"
        style={{ background: "#FFFFFF" }}
      >
        <p className="font-mono text-xs" style={{ color: "#EF4444" }}>
          Failed to load dashboard.
        </p>
      </main>
    );
  }

  const sd = stats ?? EMPTY_STATS;
  const reputationScore =
    reputation?.reputation_score ?? user?.reputation_score ?? 0;

  const tableRows = submissions.slice(0, 7).map((s) => ({
    id: s.submission_id,
    hash: s.sha256_hash || s.title || "N/A",
    family:
      s.malware_family || s.malware_category || s.template_type || "Unknown",
    status:
      s.sandbox_status || (s.status === "Published" ? "Completed" : s.status),
    date: new Date(s.submitted_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: s.sandbox_status === "Completed" ? 100 : 0,
  }));

  const feedItems =
    activityItems.length > 0
      ? activityItems
      : [{ msg: "No recent activity", time: "—", color: "#E5E7EB" }];

  return (
    <main
      className="flex-1 overflow-auto relative"
      style={{ background: "#FFFFFF" }}
    >
      {/* Subtle ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: "absolute",
            width: "900px",
            height: "600px",
            top: "-200px",
            left: "-300px",
            background:
              "radial-gradient(ellipse, rgba(34,197,94,0.025) 0%, transparent 65%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "700px",
            height: "700px",
            bottom: "-250px",
            right: "-150px",
            background:
              "radial-gradient(ellipse, rgba(109,40,217,0.015) 0%, transparent 65%)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Page content */}
      <div
        className="relative px-7 py-8 max-w-[1440px] mx-auto space-y-6 animate-fade-up"
        style={{ zIndex: 1 }}
      >
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#22C55E",
                  boxShadow: "0 0 8px rgba(34,197,94,0.8)",
                }}
              />
              <span
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "#22C55E" }}
              >
                System Online
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-6 w-24 rounded animate-pulse"
                    style={{ background: "#E5E7EB", display: "inline-block" }}
                  />
                  <span
                    className="h-6 w-32 rounded animate-pulse"
                    style={{ background: "#E5E7EB", display: "inline-block" }}
                  />
                </span>
              ) : (
                <>
                  Welcome back,{" "}
                  <span style={{ color: "#22C55E" }}>
                    {user?.username ?? "Analyst"}
                  </span>
                  <VerifiedBadge role={user?.role} size={14} />
                </>
              )}
            </h1>
            <p
              className="font-mono text-[10px] mt-1"
              style={{ color: "#9CA3AF" }}
            >
              Threat intelligence overview —{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex-shrink-0 mt-1">
            <PlusButton text="New Analysis" />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Analyses"
            value={String(sd.total_submissions)}
            change="+14%"
            changePos
            color="#22C55E"
            delay={0}
            loading={loading}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22C55E"
                strokeWidth="1.75"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />
          <StatCard
            label="Published"
            value={String(sd.published_submissions)}
            change={sd.published_submissions > 0 ? "Active" : "None"}
            changePos={sd.published_submissions > 0}
            color="#8B5CF6"
            delay={80}
            loading={loading}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="1.75"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
                <polyline points="15 2 15 7 20 7" />
                <line x1="16" y1="11" x2="8" y2="11" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            }
          />
          <StatCard
            label="Reputation XP"
            value={String(reputationScore)}
            suffix="xp"
            change={reputationScore > 0 ? "+180" : "N/A"}
            changePos={reputationScore > 0}
            color="#F59E0B"
            delay={160}
            loading={loading}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.75"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
          />
          <StatCard
            label="Pending Reviews"
            value={String(sd.pending_submissions)}
            change={sd.pending_submissions > 0 ? "Live" : "Clear"}
            changePos
            color="#22D3EE"
            delay={240}
            loading={loading}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="1.75"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Submissions — 2 cols */}
          <div className="xl:col-span-2">
            {!loading && tableRows.length === 0 ? (
              <EmptySubmissions />
            ) : (
              <SubmissionsTable submissions={tableRows} loading={loading} />
            )}
          </div>

          {/* Activity Feed — fills remaining space */}
          <div>
            <ActivityFeed items={feedItems} loading={loading} />
          </div>
        </div>

        {/* Rank Panel */}
        <RankPanel loading={loading} reputation={reputation} />
      </div>
    </main>
  );
};

export default DashboardPage;
