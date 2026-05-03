import { useState } from "react";
import VerifiedBadge from "../../Dashboard/Components/VerifiedBadge";

const ACCENT = "#22C55E";
const PURPLE = "#8b5cf6";

const CATEGORIES = [
  {
    key: "technical_score",
    label: "Technical Depth",
    color: ACCENT,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    guide: [
      "No technical detail or code analysis",
      "Basic observations, minimal depth",
      "Some technical analysis present",
      "Good technical coverage with examples",
      "Deep technical analysis with evidence",
      "Exceptional analysis, novel techniques",
      "Thorough code/protocol analysis",
      "Comprehensive reverse engineering",
      "Expert-level with multiple vectors",
      "Industry-grade, publishable quality",
      "Groundbreaking analysis with new findings",
    ],
  },
  {
    key: "methodology_score",
    label: "Methodology",
    color: "#3b82f6",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    guide: [
      "No methodology described",
      "Unclear or ad-hoc approach",
      "Basic methodology outlined",
      "Structured approach with steps",
      "Clear reproducible methodology",
      "Well-documented process flow",
      "Multiple analysis techniques used",
      "Systematic and thorough approach",
      "Advanced multi-phase methodology",
      "Rigorously tested, reproducible pipeline",
      "Research-grade methodology with validation",
    ],
  },
  {
    key: "documentation_score",
    label: "Documentation",
    color: "#f59e0b",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    guide: [
      "No documentation or structure",
      "Barely readable, no organization",
      "Basic structure present",
      "Organized with headings",
      "Well-structured and readable",
      "Clear sections with summaries",
      "Professional documentation style",
      "Detailed with diagrams/screenshots",
      "Publication-quality documentation",
      "Exceptional clarity with visual aids",
      "Reference-grade, comprehensive guide",
    ],
  },
  {
    key: "insights_score",
    label: "Insights & Findings",
    color: PURPLE,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
    ),
    guide: [
      "No insights or conclusions",
      "Superficial observations only",
      "Basic findings stated",
      "Useful findings with some context",
      "Good insights with supporting evidence",
      "Actionable findings clearly stated",
      "Multiple valuable discoveries",
      "Novel findings with implications",
      "Significant new insights provided",
      "Groundbreaking findings for the community",
      "Paradigm-shifting analysis results",
    ],
  },
];

const ScoreSlider = ({ category, value, onChange }) => {
  const labelIdx = Math.min(Math.round(value), 10);
  const pct = (value / 10) * 100;

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color: category.color }}>
          {category.icon}
          <span className="font-code text-[11px] uppercase tracking-wider font-bold">
            {category.label}
          </span>
        </div>
        <div
          className="font-display text-xl font-black px-2 py-0.5 rounded transition-all duration-200"
          style={{
            color: category.color,
            background: `${category.color}12`,
            textShadow: `0 0 20px ${category.color}40`,
          }}
        >
          {value}
          <span className="text-[11px] font-normal text-slate-500 ml-0.5">/10</span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-12 group" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const raw = ((e.clientX - rect.left) / rect.width) * 10;
        onChange(Math.max(1, Math.min(10, Math.round(raw))));
      }}>
        {/* Background track */}
        <div className="absolute inset-y-4 left-0 right-0 rounded-full" style={{ background: "rgba(30,34,51,0.7)" }} />

        {/* Filled track */}
        <div
          className="absolute inset-y-4 left-0 rounded-full transition-all duration-200"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${category.color}40, ${category.color})`,
            boxShadow: `0 0 12px ${category.color}20`,
          }}
        />

        {/* Tick marks */}
        <div className="absolute inset-y-4 left-0 right-0 flex items-center justify-between px-0">
          {Array.from({ length: 10 }, (_, i) => {
            const v = i + 1;
            const isActive = v <= value;
            const isCurrent = v === value;
            return (
              <div
                key={v}
                className="absolute transition-all duration-200"
                style={{
                  left: `${(i / 9) * 100}%`,
                  transform: "translateX(-50%)",
                  width: isCurrent ? 18 : isActive ? 10 : 6,
                  height: isCurrent ? 18 : isActive ? 10 : 6,
                  borderRadius: "50%",
                  background: isCurrent
                    ? category.color
                    : isActive
                    ? `${category.color}CC`
                    : "rgba(30,34,51,0.5)",
                  border: isCurrent
                    ? `2px solid ${category.color}`
                    : isActive
                    ? "none"
                    : "1px solid rgba(60,65,85,0.5)",
                  boxShadow: isCurrent ? `0 0 12px ${category.color}50, 0 0 4px ${category.color}30` : "none",
                  zIndex: isCurrent ? 3 : isActive ? 2 : 1,
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(v);
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = `${category.color}50`;
                    e.currentTarget.style.transform = "translateX(-50%) scale(1.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(30,34,51,0.5)";
                    e.currentTarget.style.transform = "translateX(-50%) scale(1)";
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Score labels */}
      <div className="flex justify-between px-0.5">
        <span className="font-code text-[8px] text-slate-600">1</span>
        <span className="font-code text-[8px] text-slate-600">5</span>
        <span className="font-code text-[8px] text-slate-600">10</span>
      </div>

      {/* Guide text */}
      <p
        className="font-body text-[11px] italic px-3 py-2 rounded-lg transition-all duration-200"
        style={{
          background: `${category.color}06`,
          borderLeft: `2px solid ${category.color}40`,
          color: "#94A3B8",
        }}
      >
        {category.guide[labelIdx]}
      </p>
    </div>
  );
};

const ReviewScoreBar = ({ label, value, color, max = 10 }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="font-code text-[9px] uppercase tracking-wider" style={{ color: "#64748B" }}>
        {label}
      </span>
      <span className="font-display text-xs font-bold" style={{ color }}>
        {value}/{max}
      </span>
    </div>
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(30,34,51,0.6)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${(value / max) * 100}%`, background: color }}
      />
    </div>
  </div>
);

const ReviewQualityBadge = ({ avgScore }) => {
  let label, color, bg;
  if (avgScore >= 9) { label = "EXEMPLARY"; color = "#A78BFA"; bg = "rgba(139,92,246,0.1)"; }
  else if (avgScore >= 7) { label = "STRONG"; color = ACCENT; bg = "rgba(34,197,94,0.1)"; }
  else if (avgScore >= 5) { label = "ADEQUATE"; color = "#f59e0b"; bg = "rgba(245,158,11,0.1)"; }
  else { label = "NEEDS WORK"; color = "#EF4444"; bg = "rgba(239,68,68,0.1)"; }

  return (
    <span className="font-code text-[8px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: bg, color }}>
      {label}
    </span>
  );
};

const ReviewCard = ({ review }) => {
  const [expanded, setExpanded] = useState(false);
  const avgScore = (review.technical_score + review.methodology_score + review.documentation_score + review.insights_score) / 4;
  const isShort = review.comments.length < 100;

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-300"
      style={{
        background: "rgba(10,11,16,0.5)",
        border: "1px solid rgba(30,34,51,0.6)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(30,34,51,0.4)" }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-display text-xs font-bold flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}
        >
          {review.reviewer_username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-body text-sm font-semibold" style={{ color: "#F1F5F9" }}>
              {review.reviewer_username}
            </span><VerifiedBadge role={review.reviewer_role} size={14} />
            {review.reviewer_expertise && (
              <span className="font-code text-[8px] px-1.5 py-0.5 rounded" style={{
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.15)",
                color: "#A78BFA",
              }}>
                {review.reviewer_expertise}
              </span>
            )}
            <ReviewQualityBadge avgScore={avgScore} />
          </div>
          <span className="font-code text-[9px] text-slate-500">
            {new Date(review.reviewed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="text-center flex-shrink-0">
          <span className="font-display text-lg font-black" style={{ color: "#A78BFA" }}>
            {avgScore.toFixed(1)}
          </span>
          <span className="font-code text-[8px] text-slate-500 block">/10</span>
        </div>
      </div>

      {/* Score Bars */}
      <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2" style={{ background: "rgba(0,0,0,0.15)" }}>
        <ReviewScoreBar label="Technical" value={review.technical_score} color={ACCENT} />
        <ReviewScoreBar label="Methodology" value={review.methodology_score} color="#3b82f6" />
        <ReviewScoreBar label="Documentation" value={review.documentation_score} color="#f59e0b" />
        <ReviewScoreBar label="Insights" value={review.insights_score} color={PURPLE} />
      </div>

      {/* Comments */}
      <div className="px-4 py-3">
        <p className="font-body text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
          {!isShort && !expanded
            ? review.comments.substring(0, 120) + "..."
            : review.comments}
        </p>
        {!isShort && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 font-code text-[10px] uppercase tracking-wider transition-colors"
            style={{ color: PURPLE }}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </div>
  );
};

const PeerReviewForm = ({ onSubmit, onCancel, submitting }) => {
  const [scores, setScores] = useState({
    technical_score: 5,
    methodology_score: 5,
    documentation_score: 5,
    insights_score: 5,
  });
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");

  const handleScoreChange = (key, value) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comments.trim().length < 10) {
      setError("Review comments must be at least 10 characters");
      return;
    }
    onSubmit({ ...scores, comments: comments.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg overflow-hidden" style={{
      background: "rgba(10,11,16,0.8)",
      border: "1px solid rgba(139,92,246,0.2)",
    }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(30,34,51,0.5)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)", color: PURPLE }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold" style={{ color: "#F1F5F9" }}>Peer Review</h4>
            <p className="font-code text-[9px] text-slate-500">Score each dimension 1-10</p>
          </div>
        </div>
        <div className="text-center px-3 py-1.5 rounded-lg" style={{ background: "rgba(139,92,246,0.08)" }}>
          <span className="font-display text-xl font-black" style={{ color: "#A78BFA" }}>
            {avgScore.toFixed(1)}
          </span>
          <span className="font-code text-[8px] text-slate-500 block">avg</span>
        </div>
      </div>

      {/* Score Sliders */}
      <div className="p-5 space-y-5">
        {CATEGORIES.map((cat) => (
          <ScoreSlider
            key={cat.key}
            category={cat}
            value={scores[cat.key]}
            onChange={(v) => handleScoreChange(cat.key, v)}
          />
        ))}

        {/* Comments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-code text-[10px] uppercase tracking-wider" style={{ color: "#64748B" }}>
              Detailed Review
            </span>
            <span className={`font-code text-[10px] ${comments.trim().length >= 10 ? "text-slate-500" : "text-red-400"}`}>
              {comments.trim().length}/10 min
            </span>
          </div>
          <textarea
            value={comments}
            onChange={(e) => { setComments(e.target.value); setError(""); }}
            placeholder="Provide detailed feedback on the analysis quality, strengths, weaknesses, and suggestions for improvement..."
            rows="5"
            className="w-full px-4 py-3 rounded-lg font-body text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 resize-none transition-all"
            style={{ background: "rgba(10,11,16,0.8)", border: "1px solid rgba(30,34,51,0.8)", color: "#F1F5F9" }}
          />
          {error && <p className="font-code text-[10px] text-red-400 mt-1">{error}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(30,34,51,0.5)" }}>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg font-code text-xs uppercase tracking-wider transition-colors"
          style={{ color: "#64748B" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 rounded-lg font-code text-xs uppercase tracking-wider transition-all disabled:opacity-50"
          style={{ background: PURPLE, color: "#fff" }}
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
};

const PeerReviewSection = ({ reviews, aggregate, hasReviewed, userReview, isAuthor, isAuthenticated, onSubmit, submitting, success, error }) => {
  const [sortBy, setSortBy] = useState("newest");
  const [collapsed, setCollapsed] = useState(true);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "highest") {
      const avgA = (a.technical_score + a.methodology_score + a.documentation_score + a.insights_score) / 4;
      const avgB = (b.technical_score + b.methodology_score + b.documentation_score + b.insights_score) / 4;
      return avgB - avgA;
    }
    if (sortBy === "lowest") {
      const avgA = (a.technical_score + a.methodology_score + a.documentation_score + a.insights_score) / 4;
      const avgB = (b.technical_score + b.methodology_score + b.documentation_score + b.insights_score) / 4;
      return avgA - avgB;
    }
    return new Date(b.reviewed_at) - new Date(a.reviewed_at);
  });

  const canReview = isAuthenticated && !isAuthor && !hasReviewed;
  const hasReviews = reviews.length > 0;

  return (
    <div className="mt-8 pt-6 border-t border-[rgba(30,34,51,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "#F1F5F9" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Peer Reviews
          <span className="font-code text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA" }}>
            {reviews.length}
          </span>
        </h3>

        {!collapsed && reviews.length > 1 && (
          <div className="flex gap-1" style={{ background: "rgba(10,11,16,0.5)", borderRadius: "6px", padding: "2px" }}>
            {[
              { key: "newest", label: "Newest" },
              { key: "highest", label: "Highest" },
              { key: "lowest", label: "Lowest" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className="px-3 py-1 rounded font-code text-[9px] uppercase tracking-wider transition-all"
                style={{
                  background: sortBy === opt.key ? "rgba(139,92,246,0.15)" : "transparent",
                  color: sortBy === opt.key ? "#A78BFA" : "#64748B",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-code text-[10px] uppercase tracking-wider transition-all"
          style={{
            background: collapsed ? "rgba(139,92,246,0.1)" : "rgba(10,11,16,0.5)",
            border: `1px solid ${collapsed ? "rgba(139,92,246,0.2)" : "rgba(30,34,51,0.5)"}`,
            color: collapsed ? "#A78BFA" : "#64748B",
          }}
        >
          {collapsed ? "Show reviews" : "Hide reviews"}
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transition: "transform 0.2s ease", transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Success/Error */}
      {success && !collapsed && (
        <div className="mb-4 rounded-lg p-3 flex items-center gap-3" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: ACCENT }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          <span className="text-xs font-medium">Review submitted successfully. Thank you for contributing.</span>
        </div>
      )}
      {error && !collapsed && (
        <div className="mb-4 rounded-lg p-3 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" /></svg>
          <span className="text-xs font-medium">{error}</span>
        </div>
      )}

      {/* Collapsible Content */}
      {!collapsed && (
        <>

      {/* Aggregate Radar Summary */}
      {aggregate?.averageScores && (
        <div className="mb-6 p-5 rounded-lg" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)" }}>
          <div className="flex items-center gap-5 flex-wrap">
            {/* Overall Score Circle */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="rgba(139,92,246,0.1)" strokeWidth="6" fill="none" />
                <circle
                  cx="40" cy="40" r="34"
                  stroke="#A78BFA" strokeWidth="6" fill="none"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * aggregate.averageScores.overall) / 10}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-xl font-black" style={{ color: "#A78BFA" }}>
                  {aggregate.averageScores.overall}
                </span>
                <span className="font-code text-[7px] text-slate-500">/10</span>
              </div>
            </div>

            {/* Score Bars */}
            <div className="flex-1 min-w-[200px] grid grid-cols-2 gap-x-4 gap-y-2">
              <ReviewScoreBar label="Technical" value={aggregate.averageScores.technical} color={ACCENT} />
              <ReviewScoreBar label="Methodology" value={aggregate.averageScores.methodology} color="#3b82f6" />
              <ReviewScoreBar label="Documentation" value={aggregate.averageScores.documentation} color="#f59e0b" />
              <ReviewScoreBar label="Insights" value={aggregate.averageScores.insights} color={PURPLE} />
            </div>

            {/* Review Count */}
            <div className="text-center flex-shrink-0 px-4 py-2 rounded-lg" style={{ background: "rgba(10,11,16,0.4)" }}>
              <span className="font-display text-lg font-bold" style={{ color: "#F1F5F9" }}>
                {aggregate.reviewCount}
              </span>
              <span className="font-code text-[8px] text-slate-500 uppercase block">reviews</span>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {isAuthenticated && !isAuthor && !hasReviewed && (
        <div className="mb-5">
          <PeerReviewForm
            onSubmit={onSubmit}
            onCancel={() => {}}
            submitting={submitting}
          />
        </div>
      )}

      {/* Already Reviewed */}
      {isAuthenticated && !isAuthor && hasReviewed && userReview && (
        <div className="mb-5 rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", color: "#A78BFA" }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-xs font-medium">You've already reviewed this submission</span>
          <span className="ml-auto font-display text-sm font-bold">{((userReview.technical_score + userReview.methodology_score + userReview.documentation_score + userReview.insights_score) / 4).toFixed(1)}/10</span>
        </div>
      )}

      {/* Author view */}
      {isAuthor && reviews.length === 0 && (
        <div className="mb-5 rounded-lg p-6 text-center border border-dashed" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
          <p className="font-code text-xs" style={{ color: "#64748B" }}>Peer reviews from other analysts will appear here once published submissions receive community feedback.</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {sortedReviews.map((review) => (
          <ReviewCard key={review.review_id} review={review} />
        ))}
        {sortedReviews.length === 0 && !isAuthenticated && (
          <div className="py-8 text-center border border-dashed rounded-lg" style={{ borderColor: "rgba(30,34,51,0.5)" }}>
            <p className="font-code text-xs" style={{ color: "#64748B" }}>No peer reviews yet. Be the first to review this analysis.</p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default PeerReviewSection;
