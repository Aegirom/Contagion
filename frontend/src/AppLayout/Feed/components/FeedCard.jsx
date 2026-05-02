import React from "react";
import { useNavigate } from "react-router-dom";
import { SeverityBadge } from "../../Dashboard/Components/HooksAndBadges";

const FeedCard = ({ post }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (post?.id) {
      navigate(`/post/${post.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer rounded-xl p-6 animate-fade-up border transition-all duration-300 hover:border-[#22C55E]/40"
      style={{
        background: "rgba(12,13,20,0.8)",
        border: "1px solid rgba(30,34,51,0.8)",
        backdropFilter: "blur(16px)",
        marginBottom: "1rem",
      }}
    >
      {/* Title and Meta */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <button className="transition-colors" style={{ color: "#475569" }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
          <span
            className="font-display text-sm font-bold"
            style={{ color: "#22C55E" }}
          >
            {post.score}
          </span>
          <button className="transition-colors" style={{ color: "#475569" }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
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
                background: "rgba(34,197,94,0.08)",
                color: "#22C55E",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              {post.status}
            </span>
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
        className="flex items-center gap-4 ml-12 mt-3 pt-3"
        style={{ borderTop: "1px solid rgba(30,34,51,0.5)" }}
      >
        <button
          className="flex items-center gap-2 font-code text-[10px] uppercase tracking-wider transition-colors"
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
        <button
          className="flex items-center gap-2 font-code text-[10px] uppercase tracking-wider transition-colors"
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
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
          Share
        </button>
        <button
          className="flex items-center gap-2 font-code text-[10px] uppercase tracking-wider transition-colors"
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
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          Save
        </button>
      </div>
    </div>
  );
};

export default FeedCard;
