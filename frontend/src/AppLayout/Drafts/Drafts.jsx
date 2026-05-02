import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DraftCard from "./Components/DraftCard";
import PlusButton from "../Dashboard/Components/Buttons.jsx";
import { deleteSubmission, getUserDrafts, updateSubmission } from "../../services/api";

function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDrafts = async () => {
    setError("");
    try {
      const response = await getUserDrafts();
      setDrafts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Could not fetch drafts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handlePublish = async (draft) => {
    setError("");
    try {
      await updateSubmission(draft.submission_id, { status: "Pending" });
      setDrafts((prev) => prev.filter((item) => item.submission_id !== draft.submission_id));
      navigate("/submissions");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to publish draft");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this draft? This archives it and removes it from active lists.")) return;

    setError("");
    try {
      await deleteSubmission(id);
      setDrafts((prev) => prev.filter((draft) => draft.submission_id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete draft");
    }
  };

  return (
    <div className="min-h-screen bg-abyss text-slate-100 px-6 py-12 md:px-12 lg:px-20">
      <div className="flex flex-row justify-between items-end mb-10 pb-6 border-b border-phantom">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-toxic shadow-[0_0_8px_#22C55E]"></div>
            <h3 className="text-3xl font-black text-slate-100 tracking-tighter uppercase">
              My Drafts
            </h3>
          </div>
        </div>
        <PlusButton text={"New Draft"} />
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-900/40 bg-red-900/10 px-4 py-3 font-code text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
        <div className="col-span-full flex items-center gap-4 mb-2">
          <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
            Saved Drafts ({drafts.length})
          </span>
          <div className="h-[1px] flex-grow bg-phantom"></div>
        </div>

        {isLoading && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-toxic border-t-transparent mb-4"></div>
            <p className="text-slate-500 font-mono text-sm uppercase">Loading drafts...</p>
          </div>
        )}

        {!isLoading && drafts.map((draft) => (
          <DraftCard
            key={draft.submission_id}
            draft={draft}
            onPublish={handlePublish}
            onDelete={handleDelete}
          />
        ))}

        {!isLoading && drafts.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-phantom rounded-xl">
            <p className="text-slate-500 font-mono text-sm uppercase">
              No drafts saved yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Drafts;
