import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserSavedSubmissions,
  togglePostSave,
  importSubmission,
} from "../../services/api";
import { SeverityBadge } from "../Dashboard/Components/HooksAndBadges";
import VerifiedBadge from "../Dashboard/Components/VerifiedBadge";
import { useToast } from "../../context/ToastContext";
import SavedPostSkeleton from "./Components/SavedPostSkeleton";

const severityFromCategory = (category) => {
  if (["Ransomware", "APT", "Rootkit"].includes(category)) return "CRITICAL";
  if (["Trojan", "Worm", "Spyware"].includes(category)) return "HIGH";
  return "INFO";
};

const SavedPostsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importingId, setImportingId] = useState(null);

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      const response = await getUserSavedSubmissions();
      setSubmissions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error loading saved posts:", err);
      setError(err.response?.data?.error || "Failed to load saved posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const handleUnsave = async (postId, e) => {
    e.stopPropagation();
    try {
      await togglePostSave(postId);
      setSubmissions((prev) => prev.filter((s) => s.submission_id !== postId));
      addToast("Post removed from saved", "success");
    } catch (err) {
      addToast("Failed to remove post", "error");
    }
  };

  const handleImport = async (postId, e) => {
    e.stopPropagation();
    setImportingId(postId);
    try {
      const response = await importSubmission(postId);
      addToast("Analysis imported to your drafts", "success");
      navigate(`/create-post?draftId=${response.data.submission_id}`);
    } catch (err) {
      addToast(
        err.response?.data?.error || "Failed to import analysis",
        "error",
      );
    } finally {
      setImportingId(null);
    }
  };

  return (
    <main className="flex-1 overflow-auto relative z-10">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="flex flex-row justify-between items-end mb-10 pb-6 border-b border-phantom">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-toxic shadow-[0_0_8px_#22C55E]"></div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
                Saved Analyses
              </h3>
            </div>
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mt-2">
              Bookmarks & Imported Intelligence
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 font-code text-xs text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <SavedPostSkeleton />
              <SavedPostSkeleton />
              <SavedPostSkeleton />
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-phantom rounded-xl">
              <p className="text-gray-600 font-mono text-sm uppercase">
                Your saved archive is empty.
              </p>
              <button
                onClick={() => navigate("/feed")}
                className="mt-4 text-toxic font-code text-xs uppercase tracking-widest hover:underline"
              >
                Explore Feed
              </button>
            </div>
          ) : (
            submissions.map((post) => (
              <div
                key={post.submission_id}
                onClick={() => navigate(`/post/${post.submission_id}`)}
                className="group cursor-pointer rounded-xl p-6 border transition-all duration-300 hover:border-toxic/40 relative overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(229,231,235,0.8)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-code text-[10px] text-gray-600">
                        Posted by{" "}
                        <span className="text-gray-600">{post.username}</span>
                        <VerifiedBadge role={post.role} size={12} />
                      </span>
                      <span className="font-code text-[10px] text-gray-500">
                        {new Date(post.submitted_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold mb-2 text-gray-900">
                      {post.title}
                    </h3>

                    <p className="text-sm leading-relaxed mb-4 text-gray-600 line-clamp-2">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-3">
                      <SeverityBadge
                        level={severityFromCategory(post.malware_category)}
                      />
                      <span className="font-code text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-toxic/5 text-toxic border border-toxic/20">
                        {post.status}
                      </span>
                      <code className="font-code text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {post.sha256_hash?.substring(0, 16)}...
                      </code>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => handleUnsave(post.submission_id, e)}
                      className="p-2 rounded-lg bg-gray-100 text-orange-500 hover:bg-orange-50 transition-colors"
                      title="Remove from saved"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleImport(post.submission_id, e)}
                      disabled={importingId === post.submission_id}
                      className="p-2 rounded-lg bg-toxic/10 text-toxic hover:bg-toxic/20 transition-colors disabled:opacity-50"
                      title="Import to my database"
                    >
                      {importingId === post.submission_id ? (
                        <div className="w-[18px] h-[18px] border-2 border-toxic border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default SavedPostsPage;
