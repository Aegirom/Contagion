import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PeerReviewSection from './Components/PeerReviewSection';
import { SeverityBadge, StatusBadge } from '../Dashboard/Components/HooksAndBadges';
import { evaluateSandboxFile, getSubmissionById, getPostComments, addPostComment, deletePostComment, getPostLikes, getUserPostLike, togglePostLike, getPostShares, togglePostShare, getPostSaves, togglePostSave, getSubmissionReviews, getUserReview, getAggregateScores, submitPeerReview, updateSubmission } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const parseLogData = (log) => {
  try {
    return typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;
  } catch {
    return log.log_data;
  }
};

const summarizeLog = (log) => {
  const data = parseLogData(log);
  if (!data || typeof data !== 'object') return 'Raw behavioral data captured';

  const counts = Object.entries(data)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value.length}`)
    .slice(0, 3);

  return counts.length ? counts.join(' • ') : 'Structured telemetry captured';
};

const severityFromCategory = (category) => {
  if (['Ransomware', 'APT', 'Rootkit'].includes(category)) return 'CRITICAL';
  if (['Trojan', 'Worm', 'Spyware'].includes(category)) return 'HIGH';
  return 'INFO';
};

const Post = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState('');
  
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Peer review state
  const [reviews, setReviews] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const isAuthenticated = !!user;

  const loadPost = useCallback(async () => {
    setActionError('');
    setReviewError('');
    try {
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
      } catch (e) { console.log('Likes not available'); }
      
      try {
        if (isAuthenticated) {
          const likedRes = await getUserPostLike(postId);
          userLiked = likedRes.data?.isLiked || false;
        }
      } catch (e) { console.log('User like check not available'); }
      
      try {
        const sharesRes = await getPostShares(postId);
        sharesCount = sharesRes.data?.share_count || 0;
      } catch (e) { console.log('Shares not available'); }
      
      try {
        if (isAuthenticated) {
          const savedRes = await getUserPostSave(postId);
          userSaved = savedRes.data?.isSaved || false;
        }
      } catch (e) { console.log('User save check not available'); }
      
      try {
        const commentsRes = await getPostComments(postId);
        commentsData = commentsRes.data || [];
      } catch (e) { console.log('Comments not available'); }
      
      // Load peer review data
      try {
        const aggRes = await getAggregateScores(postId);
        setAggregate(aggRes.data);
      } catch (e) { console.log('Aggregate scores not available'); }

      try {
        const reviewsRes = await getSubmissionReviews(postId);
        setReviews(reviewsRes.data?.reviews || []);
      } catch (e) { console.log('Reviews not available'); }

      if (isAuthenticated) {
        try {
          const userReviewRes = await getUserReview(postId);
          setUserReview(userReviewRes.data?.review || null);
          setHasReviewed(userReviewRes.data?.hasReviewed || false);
        } catch (e) { console.log('User review check not available'); }
      }
      
      setLikes(likesCount);
      setIsLiked(userLiked);
      setShareCount(sharesCount);
      setIsShared(false);
      setIsSaved(userSaved);
      setComments(commentsData);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to load analysis report');
    } finally {
      setLoading(false);
    }
  }, [postId, isAuthenticated]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const logs = useMemo(() => post?.behavioral_logs || [], [post]);
  const score = post?.sandbox_status === 'Completed' ? 100 : logs.length ? 65 : 0;
  const threat = severityFromCategory(post?.malware_category);

  const handleRunSandbox = async () => {
    if (!post?.sha256_hash) return;
    setRunning(true);
    setActionError('');
    try {
      await evaluateSandboxFile({
        submission_id: post.submission_id,
        file_hash: post.sha256_hash,
        environment: 'Docker',
        os_profile: 'Windows10',
        network_enabled: false,
        timeout_seconds: 120,
      });
      await loadPost();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Sandbox evaluation failed');
    } finally {
      setRunning(false);
    }
  };

  const showLoginPrompt = () => {
    navigate('/login', { state: { from: `/post/${postId}` } });
  };

  const handleLike = async () => {
    if (!isAuthenticated) return showLoginPrompt();
    if (isPending) return;
    try {
      const response = await togglePostLike(postId);
      setIsLiked(response.data.isLiked);
      setLikes(response.data.like_count);
      
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
      if (response.data.isLiked) {
        likedPosts[postId] = response.data.like_count;
      } else {
        delete likedPosts[postId];
      }
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: `/post/${postId}` } });
      } else {
        console.error('Failed to toggle like:', err);
      }
    }
  };

  const handleShare = async () => {
    if (!isAuthenticated) return showLoginPrompt();
    if (isPending) return;
    try {
      const response = await togglePostShare(postId);
      setIsShared(response.data.isShared);
      setShareCount(response.data.share_count);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: `/post/${postId}` } });
      } else {
        console.error('Failed to toggle share:', err);
      }
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) return showLoginPrompt();
    if (isPending) return;
    try {
      const response = await togglePostSave(postId);
      setIsSaved(response.data.isSaved);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: `/post/${postId}` } });
      } else {
        console.error('Failed to toggle save:', err);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return showLoginPrompt();
    if (isPending) return;
    if (!newComment.trim()) return;
    
    try {
      const response = await addPostComment(postId, newComment.trim());
      setComments((prev) => [...prev, response.data]);
      setNewComment('');
      setShowCommentForm(false);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: `/post/${postId}` } });
      } else {
        console.error('Failed to add comment:', err);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deletePostComment(commentId);
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await submitPeerReview(postId, reviewData);
      setReviewSuccess(true);
      await loadPost();
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handlePublishToggle = async () => {
    setPublishing(true);
    setActionError('');
    try {
      if (post?.status === 'Published') {
        await updateSubmission(postId, { status: 'Draft' });
      } else {
        await updateSubmission(postId, { status: 'Published' });
      }
      await loadPost();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update submission status');
    } finally {
      setPublishing(false);
    }
  };

  const isAuthor = user?.user_id === post?.author_id || user?.id === post?.author_id;
  const isPending = post?.status === 'Pending';
  const isPublished = post?.status === 'Published';

  if (loading) {
    return (
      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-4xl mx-auto py-20 px-4 text-center font-code text-xs uppercase tracking-widest text-slate-500">
          Loading analysis report...
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-4xl mx-auto py-20 px-4 text-center">
          <p className="font-code text-sm text-red-400">{actionError || 'Analysis report not found'}</p>
          <button onClick={() => navigate('/submissions')} className="mt-4 font-code text-xs uppercase tracking-widest text-toxic">
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
          style={{ color: '#475569' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#22C55E')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div className="mb-6 rounded-lg border px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
            <svg className="w-4 h-4 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 3l9.5 17H2.5L12 3z" /></svg>
            <span className="text-xs">This analysis is pending review. Run sandbox or click Publish to make it public.</span>
            {isAuthor && (
              <button
                onClick={handlePublishToggle}
                disabled={publishing}
                className="ml-auto font-code text-[10px] uppercase tracking-wider px-3 py-1 rounded bg-[#22C55E] text-[#0A0B10] disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Publish Now'}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              className="rounded-xl p-6 border animate-fade-up"
              style={{
                background: 'rgba(12,13,20,0.8)',
                border: '1px solid rgba(30,34,51,0.8)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold" style={{ color: '#F1F5F9' }}>
                    {post.title}
                  </h2>
                  <p className="font-code text-xs mt-2" style={{ color: '#475569' }}>
                    SUBMITTED BY <span style={{ color: '#22C55E' }}>{post.username}</span> • {new Date(post.submitted_at).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={handleLike}
                      disabled={isPending}
                      className="flex items-center gap-2 font-code text-xs transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ color: isLiked ? '#EF4444' : '#475569' }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isLiked ? '#EF4444' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="transition-transform hover:rotate-12"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span>{likes}</span>
                    </button>
                    <button
                      onClick={() => setShowCommentForm(!showCommentForm)}
                      disabled={isPending}
                      className="flex items-center gap-2 font-code text-xs transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ color: '#475569' }}
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
                      disabled={isPending}
                      className="flex items-center gap-2 font-code text-xs transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ color: isShared ? '#22C55E' : '#475569' }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isShared ? '#22C55E' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                      </svg>
                      <span>{shareCount}</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isPending}
                      className="flex items-center gap-2 font-code text-xs transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ color: isSaved ? '#F59E0B' : '#475569' }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isSaved ? '#F59E0B' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
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
                  <StatusBadge status={post.sandbox_status || post.status} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0A0B10] border border-white/5">
                  <span className="font-code text-[10px] uppercase tracking-widest block mb-2" style={{ color: '#475569' }}>SHA-256 HASH</span>
                  <code className="font-code text-xs break-all" style={{ color: '#22C55E' }}>
                    {post.sha256_hash || 'No artifact linked'}
                  </code>
                </div>
                <p className="font-body text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#94A3B8' }}>
                  {post.content}
                </p>

                {/* Comments Section */}
                <div className="mt-8 pt-6 border-t border-[rgba(30,34,51,0.5)]">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#F1F5F9' }}>
                    Comments ({comments.length})
                  </h3>
                  
                  {/* Comment Form */}
                  {showCommentForm && !isPending && (
                    <form onSubmit={handleAddComment} className="mb-6">
                      <div className="relative">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write your insight..."
                          className="w-full px-4 py-3 rounded-lg font-body text-sm bg-[#0A0B10] border border-[rgba(30,34,51,0.8)] text-[#F1F5F9] placeholder-slate-500 focus:outline-none focus:border-toxic focus:ring-1 focus:ring-toxic/20 resize-none"
                          rows="3"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setShowCommentForm(false)}
                            className="px-4 py-2 rounded-lg font-code text-xs uppercase tracking-wider transition-colors"
                            style={{ color: '#64748B' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-4 py-2 rounded-lg font-code text-xs uppercase tracking-wider transition-all bg-[#22C55E] text-[#0A0B10] disabled:opacity-50 hover:bg-[#4ADE80]"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Comments List */}
                  {isPending ? (
                    <p className="text-center font-code text-xs py-4" style={{ color: '#475569' }}>
                      Comments will be available once this analysis is published.
                    </p>
                  ) : (
                    <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.comment_id}
                        className="p-4 rounded-lg"
                        style={{
                          background: 'rgba(10,11,16,0.6)',
                          border: '1px solid rgba(30,34,51,0.6)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center font-display text-[10px] font-bold"
                            style={{ background: 'rgba(34,197,94,0.2)', color: '#22C55E' }}
                          >
                            {comment.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-body text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                            {comment.username}
                          </span>
                          <span className="font-code text-[10px]" style={{ color: '#475569' }}>
                            • {new Date(comment.created_at).toLocaleString()}
                          </span>
                          {user?.user_id === comment.user_id && (
                            <button
                              onClick={() => handleDeleteComment(comment.comment_id)}
                              className="ml-auto font-code text-[10px] text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="font-body text-sm pl-8" style={{ color: '#94A3B8' }}>
                          {comment.content}
                        </p>
                      </div>
                    ))}
                    
                    {comments.length === 0 && (
                      <p className="text-center font-code text-xs" style={{ color: '#475569' }}>
                        No comments yet. Be the first to share your insights.
                      </p>
                    )}
                    </div>
                  )}
                </div>
              </div>

              {(isAuthor || !isPending) && (
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
                    disabled={running}
                    className="rounded-lg bg-[#22C55E] px-5 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-[#0A0B10] disabled:opacity-50"
                  >
                    {running ? 'Running Sandbox...' : 'Run Sandbox'}
                  </button>
                )}
                {isAuthor && (
                  <button
                    onClick={handlePublishToggle}
                    disabled={publishing}
                    className={`rounded-lg px-5 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-50 transition-all ${
                      post.status === 'Published'
                        ? 'bg-[#1E2233] text-[#64748B] hover:bg-[#252B3D]'
                        : 'bg-[#22C55E] text-[#0A0B10] hover:bg-[#4ADE80]'
                    }`}
                  >
                    {publishing
                      ? 'Updating...'
                      : post.status === 'Published'
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                )}
              </div>
            </div>

            <div
              className="rounded-xl overflow-hidden border animate-fade-up"
              style={{
                background: 'rgba(12,13,20,0.8)',
                border: '1px solid rgba(30,34,51,0.8)',
                backdropFilter: 'blur(16px)',
                animationDelay: '100ms',
              }}
            >
              <div className="px-6 py-4 border-b border-[rgba(30,34,51,0.5)] bg-white/5">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: '#F1F5F9' }}>
                  Behavioral Indicators
                </h3>
              </div>
              <div className="divide-y divide-[rgba(30,34,51,0.3)]">
                {logs.map((log) => (
                  <div key={log.log_id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                    <div>
                      <span className="font-code text-[10px] text-[#22C55E] uppercase tracking-widest block mb-1">{log.log_type}</span>
                      <p className="font-body text-sm" style={{ color: '#F1F5F9' }}>{summarizeLog(log)}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded font-code text-[9px] tracking-widest border border-red-500/20 bg-red-500/10 text-red-400">
                      CAPTURED
                    </span>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="px-6 py-12 text-center font-code text-xs uppercase tracking-widest text-slate-600">
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
                background: 'rgba(12,13,20,0.8)',
                border: '1px solid rgba(30,34,51,0.8)',
                backdropFilter: 'blur(16px)',
                animationDelay: '200ms',
              }}
            >
              <h3 className="font-display text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#475569' }}>
                Sandbox Score
              </h3>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={364.42}
                      strokeDashoffset={364.42 - (364.42 * score) / 100}
                      className={score >= 80 ? 'text-[#EF4444]' : 'text-[#22C55E]'}
                      style={{ filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.4))' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-display text-3xl font-bold" style={{ color: '#F1F5F9' }}>{score}</span>
                    <span className="font-code text-[10px] text-[#475569]">/ 100</span>
                  </div>
                </div>
                <p className="mt-4 font-code text-[10px] text-center" style={{ color: '#22C55E' }}>
                  {post.sandbox_status || 'NOT QUEUED'}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-6 border animate-fade-up"
              style={{
                background: 'rgba(12,13,20,0.8)',
                border: '1px solid rgba(30,34,51,0.8)',
                backdropFilter: 'blur(16px)',
                animationDelay: '300ms',
              }}
            >
              <h3 className="font-display text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>
                Artifact Metadata
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'File Name', value: post.file_name || 'None' },
                  { label: 'File Type', value: post.file_type || 'Unknown' },
                  { label: 'File Size', value: formatBytes(post.file_size) },
                  { label: 'Category', value: post.malware_category || 'Other' },
                  { label: 'Quarantined', value: post.is_quarantined ? 'Yes' : 'No' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center gap-4">
                    <span className="font-code text-[10px]" style={{ color: '#475569' }}>{item.label}</span>
                    <span className="font-code text-xs text-right break-all" style={{ color: '#F1F5F9' }}>{item.value}</span>
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
