import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SeverityBadge } from "../../Dashboard/Components/HooksAndBadges";
import { togglePostLike, togglePostShare } from "../../../services/api";

const ShareMenu = ({ isOpen, onClose, postId, onShare }) => {
  if (!isOpen) return null;

  const shareOptions = [
    { id: "copy", label: "Copy Link", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
    { id: "whatsapp", label: "WhatsApp", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> },
    { id: "twitter", label: "Twitter", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.054 2.25H8.92l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { id: "reddit", label: "Reddit", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.754 4.577-8.42 4.577-4.42 0-8.42-2.884-8.42-4.577 0-.295.01-.582.032-.863.214-.4.864-.933 1.513-1.186a1.54 1.54 0 0 1 1.053.231l.116.097c-.216-.24-.24-.48-.24-.697 0-.968.786-1.754 1.754-1.754.495 0 .927.234 1.416.62.284-.158.646-.235 1.016-.235.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.754 4.577-8.42 4.577-4.42 0-8.42-2.884-8.42-4.577 0-.078.009-.155.025-.228.326-.485.913-.93 1.795-1.337a2.72 2.72 0 0 1-.006-.02c-.155-.446-.677-.747-1.372-.747-.374 0-.752.16-1.045.465a2.088 2.088 0 0 0-.393.786l-.012-.018c.143-.197.371-.404.656-.595a5.67 5.67 0 0 1 3.715-2.256l.84-3.802-2.59-.546c-.79-.166-1.593-.207-1.38-.558.368-.608.75-1.23 1.123-1.831.21-.34.42-.68.624-1.008l.007-.011a1.94 1.94 0 0 1-.205-.577c.057-.278.188-.572.423-.833l.026-.029c.097-.105.221-.173.36-.185.016-.001.032-.003.048-.004.26-.016.525.055.77.2.29.17.51.45.597.77.066.242.097.494.097.747 0 .968-.786 1.754-1.754 1.754z"/></svg> },
    { id: "linkedin", label: "LinkedIn", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.658-.675-2.795-2.162-2.795-1.386 0-2.016.928-2.016 2.065v4.986H7.047V9.016h3.414v1.426h.034c.473-.893 1.623-1.838 3.399-1.838 3.074 0 3.635 2.06 3.635 4.464v5.378zM4.447 7.016a2.06 2.06 0 1 1-4.102-.001 2.06 2.06 0 0 1 4.102 0zm2.228 7.702h3.55v9.734h-3.55V14.718z"/></svg> },
    { id: "email", label: "Gmail", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  ];

  const handleShare = async (platform) => {
    const url = `${window.location.origin}/post/${postId}`;
    const title = "Check out this cybersecurity analysis on Contagion";
    
    switch (platform) {
      case "copy":
        navigator.clipboard.writeText(url);
        break;
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank");
        break;
      case "reddit":
        window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
        break;
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`, "_blank");
        break;
      default:
        break;
    }
    
    onShare(platform);
    onClose();
  };

  return (
    <div 
      className="absolute bottom-full left-0 mb-2 z-50 rounded-lg shadow-xl border overflow-hidden animate-fade-up"
      style={{ 
        background: 'rgba(12,13,20,0.98)', 
        border: '1px solid rgba(34,197,94,0.2)',
        minWidth: '190px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(34,197,94,0.1)'
      }}
    >
      {shareOptions.map((option) => (
        <button
          key={option.id}
          onClick={(e) => { e.stopPropagation(); handleShare(option.id); }}
          className="flex items-center gap-3 w-full px-4 py-2.5 font-code text-xs transition-colors hover:bg-white/5"
          style={{ color: '#F1F5F9' }}
        >
          <span style={{ color: '#22C55E' }}>{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
};

const FeedCard = ({ post, onInteract }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.score || 0);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikeCount(post.score || 0);
  }, [post.isLiked, post.score]);

  const isInteractive = post.submissionStatus === "Published";

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    if (post?.id) {
      navigate(`/post/${post.id}`);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const response = await togglePostLike(post.id);
      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.like_count);
      
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
      if (response.data.isLiked) {
        likedPosts[post.id] = response.data.like_count;
      } else {
        delete likedPosts[post.id];
      }
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
      
      onInteract?.();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: `/feed` } });
      }
    }
  };

  const toggleShareMenu = (e) => {
    e.stopPropagation();
    setShowShareMenu(prev => !prev);
  };

  const handleShare = async (platform) => {
    try {
      await togglePostShare(post.id);
      onInteract?.();
    } catch (err) {
      // Continue even if unauthenticated
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer rounded-xl p-6 animate-fade-up border transition-all duration-300 hover:border-[#22C55E]/40 relative overflow-hidden"
      style={{
        background: "rgba(12,13,20,0.8)",
        border: "1px solid rgba(30,34,51,0.8)",
        backdropFilter: "blur(16px)",
        marginBottom: "1rem",
        opacity: isInteractive ? 1 : 0.7,
      }}
    >
      {!isInteractive && (
        <div className="absolute top-3 right-3 font-code text-[9px] uppercase tracking-widest px-2 py-0.5 rounded" style={{
          background: post.submissionStatus === "Pending" ? "rgba(245,158,11,0.15)" : post.submissionStatus === "Archived" ? "rgba(100,116,139,0.15)" : "rgba(100,116,139,0.10)",
          color: post.submissionStatus === "Pending" ? "#F59E0B" : post.submissionStatus === "Archived" ? "#94A3B8" : "#64748B",
          border: `1px solid ${post.submissionStatus === "Pending" ? "rgba(245,158,11,0.3)" : post.submissionStatus === "Archived" ? "rgba(100,116,139,0.3)" : "rgba(100,116,139,0.2)"}`,
        }}>
          {post.submissionStatus === "Pending" ? "Sandbox Running" : post.submissionStatus === "Archived" ? "Archived" : "Draft"}
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={isInteractive ? handleLike : undefined}
            disabled={!isInteractive}
            className="transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{ color: isLiked ? '#EF4444' : '#475569' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isLiked ? '#EF4444' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              className={isLiked ? "animate-pulse" : ""}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <span
            className="font-display text-sm font-bold"
            style={{ color: isLiked ? '#EF4444' : '#22C55E' }}
          >
            {likeCount}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-code text-[10px]"
              style={{ color: "#475569" }}
            >
              Posted by <span style={{ color: "#94A3B8" }}>{post.user}</span>
            </span>
            <span
              className="font-code text-[10px]"
              style={{ color: "#475569" }}
            >
              {post.date}
            </span>
          </div>

          <h3
            className="font-display text-lg font-bold mb-2"
            style={{ color: "#F1F5F9" }}
          >
            {post.family} — {post.hash}
          </h3>

          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: "#94A3B8" }}
          >
            {post.caption}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <SeverityBadge level={post.threat} />
            <span
              className="font-code text-[10px] uppercase tracking-widest px-2 py-1 rounded"
              style={{
                background: post.submissionStatus === "Published"
                  ? "rgba(34,197,94,0.08)"
                  : post.submissionStatus === "Pending"
                  ? "rgba(245,158,11,0.08)"
                  : "rgba(100,116,139,0.08)",
                color: post.submissionStatus === "Published"
                  ? "#22C55E"
                  : post.submissionStatus === "Pending"
                  ? "#F59E0B"
                  : "#64748B",
                border: post.submissionStatus === "Published"
                  ? "1px solid rgba(34,197,94,0.2)"
                  : post.submissionStatus === "Pending"
                  ? "1px solid rgba(245,158,11,0.2)"
                  : "1px solid rgba(100,116,139,0.2)",
              }}
            >
              {post.submissionStatus}
            </span>
            {post.sandboxStatus && (
              <span
                className="font-code text-[10px] uppercase tracking-widest px-2 py-1 rounded"
                style={{
                  background: "rgba(30,34,51,0.5)",
                  color: "#94A3B8",
                  border: "1px solid rgba(30,34,51,0.5)",
                }}
              >
                {post.sandboxStatus}
              </span>
            )}
            <code
              className="font-code text-[10px] px-2 py-1 rounded"
              style={{ background: "rgba(30,34,51,0.5)", color: "#475569" }}
            >
              {post.location || "GLOBAL NETWORK"}
            </code>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div
        className="flex items-center gap-4 ml-8 mt-3 pt-3"
        style={{ borderTop: "1px solid rgba(30,34,51,0.5)" }}
      >
        <button
          onClick={() => isInteractive ? navigate(`/post/${post.id}`) : undefined}
          disabled={!isInteractive}
          className="flex items-center gap-2 font-code text-[10px] uppercase tracking-wider transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ color: "#64748B" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {post.comments} Comments
        </button>
        
        <div className="relative">
          <button
            onClick={isInteractive ? toggleShareMenu : undefined}
            disabled={!isInteractive}
            className="flex items-center gap-2 font-code text-[10px] uppercase tracking-wider transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            style={{ color: showShareMenu ? '#22C55E' : '#64748B' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={showShareMenu ? '#22C55E' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
            {post.shares || 0} Share
          </button>
          <ShareMenu 
            isOpen={showShareMenu} 
            onClose={() => setShowShareMenu(false)}
            postId={post.id}
            onShare={handleShare}
          />
        </div>
      </div>
    </div>
  );
};

export default FeedCard;