import { useNavigate } from "react-router-dom";

function DraftCard({ draft, onPublish, onDelete }) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/create-post?draftId=${draft.submission_id}`);
  };

  return (
    <div
      className="rounded-xl p-6 border transition-all hover:border-amber-500/30"
      style={{
        background: "rgba(12,13,20,0.8)",
        border: "1px solid rgba(30,34,51,0.8)",
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3
          className="font-display text-lg font-bold"
          style={{ color: "#F1F5F9" }}
        >
          {draft.title || "Untitled Draft"}
        </h3>
        <span
          className="font-code text-[10px] uppercase tracking-widest px-2 py-1 rounded"
          style={{
            background: "rgba(34,197,94,0.1)",
            color: "#22C55E",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          Draft
        </span>
      </div>

      <p className="text-sm mb-4 line-clamp-2" style={{ color: "#64748B" }}>
        {draft.content || "No content yet..."}
      </p>

      <div
        className="flex items-center gap-4 mb-6 text-xs"
        style={{ color: "#475569" }}
      >
        <span className="font-code">
          Last saved: {draft.updated_at ? new Date(draft.updated_at).toLocaleDateString() : "Unknown"}
        </span>
        <span className="font-code">v{draft.version || 1}</span>
        {draft.file_name && <span className="font-code">{draft.file_name}</span>}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleEdit}
          className="flex-1 py-3 rounded-lg font-display text-xs font-bold tracking-[0.2em] uppercase transition-all border"
          style={{
            background: "transparent",
            color: "#F1F5F9",
            borderColor: "rgba(30,34,51,0.8)",
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onPublish(draft)}
          className="flex-1 py-3 rounded-lg font-display text-xs font-bold tracking-[0.2em] uppercase transition-all"
          style={{ background: "#22C55E", color: "#0A0B10" }}
        >
          Publish
        </button>
        <button
          onClick={() => onDelete(draft.submission_id)}
          className="py-3 px-4 rounded-lg font-display text-xs font-bold tracking-[0.2em] uppercase transition-all border"
          style={{
            background: "transparent",
            color: "#EF4444",
            borderColor: "rgba(239,68,68,0.3)",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default DraftCard;
