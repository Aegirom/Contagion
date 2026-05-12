import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PeerReviewSection from "./Components/PeerReviewSection";
import {
  SeverityBadge,
  StatusBadge,
} from "../Dashboard/Components/HooksAndBadges";
import VerifiedBadge from "../Dashboard/Components/VerifiedBadge";
import {
  getSubmissionById,
  getPostComments,
  addPostComment,
  deletePostComment,
  getPostLikes,
  getUserPostLike,
  togglePostLike,
  getPostShares,
  togglePostShare,
  getPostSaves,
  togglePostSave,
  getSubmissionReviews,
  getUserReview,
  getAggregateScores,
  submitPeerReview,
  updateSubmission,
} from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const parseLogData = (log) => {
  try {
    return typeof log.log_data === "string"
      ? JSON.parse(log.log_data)
      : log.log_data;
  } catch {
    return log.log_data;
  }
};

const summarizeLog = (log) => {
  const data = parseLogData(log);
  if (!data || typeof data !== "object") return "Raw behavioral data captured";

  const counts = Object.entries(data)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${value.length}`)
    .slice(0, 3);

  return counts.length ? counts.join(" • ") : "Structured telemetry captured";
};

const severityFromCategory = (category) => {
  if (["Ransomware", "APT", "Rootkit"].includes(category)) return "CRITICAL";
  if (["Trojan", "Worm", "Spyware"].includes(category)) return "HIGH";
  return "INFO";
};

const Post = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);
  const { addToast } = useToast();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [actionError, setActionError] = useState("");

  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Peer review state
  const [reviews, setReviews] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const isAuthenticated = !!user;

  const loadPost = useCallback(async () => {
    try {
      setActionError("");
      setReviewError("");

      const postRes = await getSubmissionById(postId);
      setPost(postRes.data);

      let likesCount = 0;
      let userLiked = false;
      let sharesCount = 0;
      let userSaved = false;
      let commentsData = [];

      try {
        const likesRes = await getPostLikes(postId);
        likesCount = likesRes.data?.like_count || 0;
      } catch (e) {
        console.log("Likes not available");
      }

      try {
        if (isAuthenticated) {
          const likedRes = await getUserPostLike(postId);
          userLiked = likedRes.data?.isLiked || false;
        }
      } catch (e) {
        console.log("User like check not available");
      }

      try {
        const sharesRes = await getPostShares(postId);
        sharesCount = sharesRes.data?.share_count || 0;
      } catch (e) {
        console.log("Shares not available");
      }

      try {
        if (isAuthenticated) {
          const savedRes = await getUserPostSave(postId);
          userSaved = savedRes.data?.isSaved || false;
        }
      } catch (e) {
        console.log("User save check not available");
      }

      try {
        const commentsRes = await getPostComments(postId);
        commentsData = commentsRes.data || [];
      } catch (e) {
        console.log("Comments not available");
      }

      // Load peer review data
      try {
        const aggRes = await getAggregateScores(postId);
        setAggregate(aggRes.data);
      } catch (e) {
        console.log("Aggregate scores not available");
      }

      try {
        const reviewsRes = await getSubmissionReviews(postId);
        setReviews(reviewsRes.data?.reviews || []);
      } catch (e) {
        console.log("Reviews not available");
      }

      if (isAuthenticated) {
        try {
          const userReviewRes = await getUserReview(postId);
          setUserReview(userReviewRes.data?.review || null);
          setHasReviewed(userReviewRes.data?.hasReviewed || false);
        } catch (e) {
          console.log("User review check not available");
        }
      }

      setLikes(likesCount);
      setIsLiked(userLiked);
      setShareCount(sharesCount);
      setIsShared(false);
      setIsSaved(userSaved);
      setComments(commentsData);
    } catch (err) {
      if (!post) {
        setActionError(err.response?.data?.error || "Failed to load analysis report");
      }
    } finally {
      setLoading(false);
    }
  }, [postId, isAuthenticated, post]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const logs = useMemo(() => post?.behavioral_logs || [], [post]);
  const score =
    post?.sandbox_status === "Completed" ? 100 : logs.length ? 65 : 0;
  const threat = severityFromCategory(post?.malware_category);

  const handleRunSandbox = () => {
    if (!post?.submission_id) return;
    navigate(`/sandbox?submission=${post.submission_id}`);
  };

  const showLoginPrompt = () => {
    navigate("/login", { state: { from: `/post/${postId}` } });
  };

  const handleLike = async () => {
    if (!isAuthenticated) return showLoginPrompt();
    if (isNonInteractive) return;
    try {
      const response = await togglePostLike(postId);
      setIsLiked(response.data.isLiked);
      setLikes(response.data.like_count);

      if (response.data.isLiked && response.data.xp_gained) {
        addToast(`+${response.data.xp_gained} XP for engaging`, "xp");
      }

      const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "{}");
      if (response.data.isLiked) {
        likedPosts[postId] = response.data.like_count;
      } else {
        delete likedPosts[postId];
      }
      localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { state: { from: `/post/${postId}` } });
      } else {
        console.error("Failed to toggle like:", err);
      }
    }
  };

  const handleShare = async () => {
    if (!isAuthenticated) return showLoginPrompt();
    if (isNonInteractive) return;
    try {
      const response = await togglePostShare(postId);
      setIsShared(response.data.isShared);
      setShareCount(response.data.share_count);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { state: { from: `/post/${postId}` } });
      } else {
        console.error("Failed to toggle share:", err);
      }
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) return showLoginPrompt();
    if (isNonInteractive) return;
    try {
      const response = await togglePostSave(postId);
      setIsSaved(response.data.isSaved);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { state: { from: `/post/${postId}` } });
      } else {
        console.error("Failed to toggle save:", err);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return showLoginPrompt();
    if (isNonInteractive) return;
    if (!newComment.trim()) return;

    try {
      const response = await addPostComment(postId, newComment.trim());
      setComments((prev) => [...prev, response.data]);
      setNewComment("");
      if (response.data.xp_gained) {
        addToast(`+${response.data.xp_gained} XP for commenting`, "xp");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { state: { from: `/post/${postId}` } });
      } else {
        console.error("Failed to add comment:", err);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deletePostComment(commentId);
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const response = await submitPeerReview(postId, reviewData);
      setReviewSuccess(true);
      setHasReviewed(true);
      const newReview = {
        technical_score: reviewData.technical_score,
        methodology_score: reviewData.methodology_score,
        documentation_score: reviewData.documentation_score,
        insights_score: reviewData.insights_score,
        comments: reviewData.comments,
        reviewed_at: response.data.reviewed_at,
        review_id: response.data.review_id,
        reviewer_id: user?.user_id || user?.id,
        reviewer_username: user?.username,
        reviewer_role: user?.role,
        reviewer_expertise: user?.expertise_level,
      };
      setUserReview(newReview);
      setReviews(prev => [...prev, newReview]);
      if (response.data.xp_gained) {
        addToast(`+${response.data.xp_gained} XP for peer review`, "xp");
      }
      await loadPost();
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      setReviewError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handlePublishToggle = async () => {
    setPublishing(true);
    setActionError("");
    try {
      if (post?.status === "Published") {
        await updateSubmission(postId, { status: "Draft" });
      } else {
        await updateSubmission(postId, { status: "Published" });
      }
      await loadPost();
    } catch (err) {
      setActionError(
        err.response?.data?.error || "Failed to update submission status",
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    setActionError("");
    try {
      await updateSubmission(postId, { status: "Archived" });
      await loadPost();
    } catch (err) {
      setActionError(
        err.response?.data?.error || "Failed to archive submission",
      );
    } finally {
      setArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    setArchiving(true);
    setActionError("");
    try {
      await updateSubmission(postId, { status: "Draft" });
      await loadPost();
    } catch (err) {
      setActionError(
        err.response?.data?.error || "Failed to unarchive submission",
      );
    } finally {
      setArchiving(false);
    }
  };

  const isAuthor =
    user?.user_id === post?.author_id || user?.id === post?.author_id;
  const isPending = post?.status === "Pending";
  const isPublished = post?.status === "Published";
  const isArchived = post?.status === "Archived";
  const isNonInteractive = isPending || isArchived;

  if (loading) {
    return (
      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-4xl mx-auto py-20 px-4 text-center font-code text-xs uppercase tracking-widest text-gray-600">
          Loading analysis report...
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-4xl mx-auto py-20 px-4 text-center">
          <p className="font-code text-sm text-red-400">
            {actionError || "Analysis report not found"}
          </p>
          <button
            onClick={() => navigate("/submissions")}
            className="mt-4 font-code text-xs uppercase tracking-widest text-toxic"
          >
            Return to submissions
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto relative z-10">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 font-code text-xs transition-colors"
          style={{ color: "#4B5563" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#22C55E")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          RETURN
        </button>

        {actionError && (
          <div className="mb-6 rounded border border-red-900/40 bg-red-900/10 px-4 py-3 font-code text-xs text-red-300">
            {actionError}
          </div>
        )}

        {isPending && (
          <div
            className="mb-6 rounded-lg border px-4 py-3 flex items-center gap-3"
            style={{
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.2)",
              color: "#F59E0B",
            }}
          >
            <svg
              className="w-4 h-4 flex-shrink-0 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01M12 3l9.5 17H2.5L12 3z"
              />
            </svg>
            <span className="text-xs">
              This analysis is pending review. Run sandbox or click Publish to
              make it public.
            </span>
            {isAuthor && (
              <button
                onClick={handlePublishToggle}
                disabled={publishing}
                className="ml-auto font-code text-[10px] uppercase tracking-wider px-3 py-1 rounded bg-[#22C55E] text-[#F9FAFB] disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Publish Now"}
              </button>
            )}
          </div>
        )}

        {isArchived && (
          <div
            className="mb-6 rounded-lg border px-4 py-3 flex items-center gap-3"
            style={{
              background: "rgba(107,114,128,0.06)",
              border: "1px solid rgba(107,114,128,0.2)",
              color: "#374151",
            }}
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="text-xs">
              This analysis has been archived. It will not appear in the feed.
            </span>
            {isAuthor && (
              <button
                onClick={handleUnarchive}
                disabled={archiving}
                className="ml-auto font-code text-[10px] uppercase tracking-wider px-3 py-1 rounded bg-[#22C55E] text-[#F9FAFB] disabled:opacity-50"
              >
                {archiving ? "Unarchiving..." : "Unarchive"}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              className="rounded-xl p-6 border animate-fade-up"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(229,231,235,0.8)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h2
                    className="font-display text-2xl font-bold"
                    style={{ color: "#111827" }}
                  >
                    {post.title}
                  </h2>
                  <p
                    className="font-code text-xs mt-2"
                    style={{ color: "#4B5563" }}
                  >
                    SUBMITTED BY{" "}
                    <span style={{ color: "#22C55E" }}>{post.username}</span>
                    <VerifiedBadge role={post.role} size={12} /> •{" "}
                    {new Date(post.submitted_at).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={handleLike}
                      disabled={isNonInteractive}
                      className="flex items-center gap-2 font-code text-xs transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ color: isLiked ? "#EF4444" : "#4B5563" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isLiked ? "#EF4444" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="transition-transform hover:rotate-12"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span>{likes}</span>
                    </button>
                    <button
                      disabled={isNonInteractive}
                      className="flex items-center gap-2 font-code text-xs transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ color: "#4B5563" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{comments.length}</span>
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={isNonInteractive}
                      className="flex items-center gap-2 font-code text-xs transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ color: isShared ? "#22C55E" : "#4B5563" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isShared ? "#22C55E" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                      </svg>
                      <span>{shareCount}</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isNonInteractive}
                      className="flex items-center gap-2 font-code text-xs transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ color: isSaved ? "#F59E0B" : "#4B5563" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isSaved ? "#F59E0B" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{isSaved ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <SeverityBadge level={threat} />
                  {isPending && (
                    <span className="px-2 py-0.5 rounded font-code text-[9px] tracking-widest border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
                      PENDING
                    </span>
                  )}
                  {isArchived && (
                    <span className="px-2 py-0.5 rounded font-code text-[9px] tracking-widest border border-gray-300 bg-gray-100 text-gray-600">
                      ARCHIVED
                    </span>
                  )}
                  <StatusBadge status={post.sandbox_status || post.status} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#F9FAFB] border border-gray-200">
                  <span
                    className="font-code text-[10px] uppercase tracking-widest block mb-2"
                    style={{ color: "#4B5563" }}
                  >
                    SHA-256 HASH
                  </span>
                  <code
                    className="font-code text-xs break-all"
                    style={{ color: "#22C55E" }}
                  >
                    {post.sha256_hash || "No artifact linked"}
                  </code>
                </div>
                <p
                  className="font-body text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: "#374151" }}
                >
                  {post.content}
                </p>

                {/* Comments Section */}
                <div className="mt-8 pt-6 border-t border-[rgba(229,231,235,0.5)]">
                  {/* Comment Form - Always Visible */}
                  {!isNonInteractive && (
                    <form onSubmit={handleAddComment} className="mb-6">
                      <div className="relative">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write your insight..."
                          className="w-full px-4 py-3 rounded-lg font-body text-sm bg-[#F9FAFB] border border-[rgba(229,231,235,0.8)] text-[#111827] placeholder-gray-500 focus:outline-none focus:border-toxic focus:ring-1 focus:ring-toxic/20 resize-none"
                          rows="3"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-4 py-2 rounded-lg font-code text-xs uppercase tracking-wider transition-all bg-[#22C55E] text-[#F9FAFB] disabled:opacity-50 hover:bg-[#4ADE80]"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <h3
                    className="font-display text-sm font-bold uppercase tracking-wider mb-4"
                    style={{ color: "#111827" }}
                  >
                    Comments ({comments.length})
                  </h3>

                  {/* Comments List */}
                  {isNonInteractive ? (
                    <p
                      className="text-center font-code text-xs py-4"
                      style={{ color: "#4B5563" }}
                    >
                      {isArchived
                        ? "This analysis is archived. Comments are disabled."
                        : "Comments will be available once this analysis is published."}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.comment_id}
                          className="p-4 rounded-lg"
                          style={{
                            background: "rgba(249,250,251,0.6)",
                            border: "1px solid rgba(229,231,235,0.6)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center font-display text-[10px] font-bold"
                              style={{
                                background: "rgba(34,197,94,0.2)",
                                color: "#22C55E",
                              }}
                            >
                              {comment.username?.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className="font-body text-sm font-semibold"
                              style={{ color: "#111827" }}
                            >
                              {comment.username}
                            </span>
                            <VerifiedBadge role={comment.role} size={14} />
                            <span
                              className="font-code text-[10px]"
                              style={{ color: "#4B5563" }}
                            >
                              • {new Date(comment.created_at).toLocaleString()}
                            </span>
                            {user?.user_id === comment.user_id && (
                              <button
                                onClick={() =>
                                  handleDeleteComment(comment.comment_id)
                                }
                                className="ml-auto font-code text-[10px] text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p
                            className="font-body text-sm pl-8"
                            style={{ color: "#374151" }}
                          >
                            {comment.content}
                          </p>
                        </div>
                      ))}

                      {comments.length === 0 && (
                        <p
                          className="text-center font-code text-xs"
                          style={{ color: "#4B5563" }}
                        >
                          No comments yet. Be the first to share your insights.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {(isAuthor || !isNonInteractive) && (
                <PeerReviewSection
                  reviews={reviews}
                  aggregate={aggregate}
                  hasReviewed={hasReviewed}
                  userReview={userReview}
                  isAuthor={isAuthor}
                  isAuthenticated={isAuthenticated}
                  onSubmit={handleReviewSubmit}
                  submitting={reviewSubmitting}
                  success={reviewSuccess}
                  error={reviewError}
                />
              )}

              <div className="mt-6 flex items-center gap-3">
                {post.sha256_hash && (
                  <button
                    onClick={handleRunSandbox}
                    disabled={isArchived}
                    className="rounded-lg bg-[#22C55E] px-5 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Run Sandbox
                  </button>
                )}
                {isAuthor && !isArchived && (
                  <button
                    onClick={handlePublishToggle}
                    disabled={publishing}
                    className={`rounded-lg px-5 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-50 transition-all ${
                      post.status === "Published"
                        ? "bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB]"
                        : "bg-[#22C55E] text-[#F9FAFB] hover:bg-[#4ADE80]"
                    }`}
                  >
                    {publishing
                      ? "Updating..."
                      : post.status === "Published"
                        ? "Unpublish"
                        : "Publish"}
                  </button>
                )}
                {isAuthor && (
                  <button
                    onClick={isArchived ? handleUnarchive : handleArchive}
                    disabled={archiving}
                    className={`rounded-lg px-5 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      isArchived
                        ? "bg-[#22C55E] text-[#F9FAFB] hover:bg-[#4ADE80]"
                        : "bg-[#3F1216] text-[#EF4444] hover:bg-[#4A1519]"
                    }`}
                  >
                    {archiving
                      ? isArchived
                        ? "Unarchiving..."
                        : "Archiving..."
                      : isArchived
                        ? "Unarchive"
                        : "Archive"}
                  </button>
                )}
              </div>
            </div>

            <div
              className="rounded-xl overflow-hidden border animate-fade-up"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(229,231,235,0.8)",
                backdropFilter: "blur(16px)",
                animationDelay: "100ms",
              }}
            >
              <div className="px-6 py-4 border-b border-[rgba(229,231,235,0.5)] bg-gray-50 flex items-center justify-between">
                <h3
                  className="font-display text-sm font-bold uppercase tracking-wider"
                  style={{ color: "#111827" }}
                >
                  Behavioral Indicators
                </h3>
                <span className="font-code text-[10px] text-gray-600">
                  {logs.length} entries
                </span>
              </div>
              <div className="divide-y divide-[rgba(229,231,235,0.3)] max-h-[280px] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.log_id}
                    className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-code text-[10px] text-[#22C55E] uppercase tracking-widest block mb-0.5">
                        {log.log_type}
                      </span>
                      <p
                        className="font-body text-xs truncate"
                        style={{ color: "#374151" }}
                      >
                        {summarizeLog(log)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 px-2 py-0.5 rounded font-code text-[8px] tracking-widest border border-red-500/20 bg-red-500/10 text-red-400">
                      CAPTURED
                    </span>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="px-6 py-10 text-center font-code text-xs uppercase tracking-widest text-gray-500">
                    No behavioral logs captured yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div
              className="rounded-xl p-6 border animate-fade-up"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(229,231,235,0.8)",
                backdropFilter: "blur(16px)",
                animationDelay: "200ms",
              }}
            >
              <h3
                className="font-display text-xs font-bold uppercase tracking-widest mb-6"
                style={{ color: "#4B5563" }}
              >
                Sandbox Score
              </h3>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={364.42}
                      strokeDashoffset={364.42 - (364.42 * score) / 100}
                      className={
                        score >= 80 ? "text-[#EF4444]" : "text-[#22C55E]"
                      }
                      style={{
                        filter: "drop-shadow(0 0 8px rgba(34,197,94,0.4))",
                      }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span
                      className="font-display text-3xl font-bold"
                      style={{ color: "#111827" }}
                    >
                      {score}
                    </span>
                    <span className="font-code text-[10px] text-[#4B5563]">
                      / 100
                    </span>
                  </div>
                </div>
                <p
                  className="mt-4 font-code text-[10px] text-center"
                  style={{ color: "#22C55E" }}
                >
                  {post.sandbox_status || "NOT QUEUED"}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-6 border animate-fade-up"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(229,231,235,0.8)",
                backdropFilter: "blur(16px)",
                animationDelay: "300ms",
              }}
            >
              <h3
                className="font-display text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: "#4B5563" }}
              >
                Artifact Metadata
              </h3>
              <div className="space-y-3">
                {[
                  { label: "File Name", value: post.file_name || "None" },
                  { label: "File Type", value: post.file_type || "Unknown" },
                  { label: "File Size", value: formatBytes(post.file_size) },
                  {
                    label: "Category",
                    value: post.malware_category || "Other",
                  },
                  {
                    label: "Quarantined",
                    value: post.is_quarantined ? "Yes" : "No",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center gap-4"
                  >
                    <span
                      className="font-code text-[10px]"
                      style={{ color: "#4B5563" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="font-code text-xs text-right break-all"
                      style={{ color: "#111827" }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Post;
