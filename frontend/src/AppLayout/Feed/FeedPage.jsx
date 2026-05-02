import React, { useEffect, useMemo, useState } from "react";
import { getAllSubmissions } from "../../services/api";
import FeedCard from "./components/FeedCard";

const severityFromCategory = (category) => {
  if (["Ransomware", "APT", "Rootkit"].includes(category)) return "CRITICAL";
  if (["Trojan", "Worm", "Spyware"].includes(category)) return "HIGH";
  return "INFO";
};

const toFeedPost = (submission) => ({
  id: submission?.submission_id || submission?.id,
  user: submission?.username || "Analyst",
  location: "Contagion Network",
  hash: submission?.sha256_hash || submission?.title || "No artifact",
  family: submission?.malware_family || submission?.malware_category || submission?.template_type || "Analysis",
  threat: severityFromCategory(submission?.malware_category || submission?.malware_family),
  status: submission?.sandbox_status || submission?.status,
  date: submission?.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : "Unknown",
  score: submission?.sandbox_status === "Completed" ? 100 : 0,
  comments: 0,
  caption: submission?.content || "No summary provided.",
});

const FeedPage = () => {
  const [sortBy, setSortBy] = useState("new");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const response = await getAllSubmissions();
        const data = Array.isArray(response.data) ? response.data : [];
        console.log("Feed - Submissions loaded:", data.length, "items");
        setSubmissions(data);
      } catch (err) {
        console.error("Feed - Error loading submissions:", err);
        setError(err.response?.data?.error || "Failed to load feed");
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, []);

  const posts = useMemo(() => {
    const rows = submissions.map(toFeedPost);
    if (sortBy === "top") return [...rows].sort((a, b) => b.score - a.score);
    if (sortBy === "hot") return [...rows].sort((a, b) => (b.comments + b.score) - (a.comments + a.score));
    return rows;
  }, [submissions, sortBy]);

  const sortOptions = [
    {
      key: "hot",
      label: "Hot",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      ),
    },
    {
      key: "new",
      label: "New",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key: "top",
      label: "Top",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
  ];

  return (
    <main className="flex-1 overflow-auto relative z-10">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div
          className="flex items-center gap-2 mb-6 p-2 rounded-xl"
          style={{
            background: "rgba(12,13,20,0.8)",
            border: "1px solid rgba(30,34,51,0.8)",
          }}
        >
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-code text-xs uppercase tracking-wider transition-all"
              style={{
                background:
                  sortBy === option.key ? "rgba(34,197,94,0.1)" : "transparent",
                color: sortBy === option.key ? "#22C55E" : "#64748B",
                border:
                  sortBy === option.key
                    ? "1px solid rgba(34,197,94,0.2)"
                    : "1px solid transparent",
              }}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded border border-red-900/40 bg-red-900/10 px-4 py-3 font-code text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {loading && (
            <div className="py-20 text-center font-code text-xs uppercase tracking-widest text-slate-500">
              Loading feed...
            </div>
          )}

          {!loading && posts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}

          {!loading && posts.length === 0 && (
            <div className="py-20 text-center border border-dashed border-phantom">
              <p className="font-code text-xs uppercase tracking-widest text-slate-500">No submissions in the feed yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default FeedPage;
