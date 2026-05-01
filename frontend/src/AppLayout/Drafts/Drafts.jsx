import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DraftCard from "./Components/DraftCard";
import PlusButton from "../Dashboard/Components/Buttons.jsx";
import axios from "axios";

const BACKEND_URL = import.meta.env.backendURL || "http://localhost:3000";

const INITIAL_DRAFTS = [
  {
    id: 1,
    title: "Emotet Variant Analysis",
    content: "Preliminary findings on the new Emotet campaign targeting...",
    version: "0.3",
    updatedAt: "2024-02-15",
  },
  {
    id: 2,
    title: "",
    content: "Initial notes on Cobalt Strike beacon patterns...",
    version: "0.1",
    updatedAt: "2024-02-10",
  },
];

function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState(INITIAL_DRAFTS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getDrafts = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/drafts/get/`);
        console.log("Drafts received");
        setDrafts(Array.isArray(res.data) ? res.data : INITIAL_DRAFTS);
      } catch (err) {
        console.log("Could not fetch drafts:", err);
      }
    };

    getDrafts();
  }, []);

  const handlePublish = async (draft) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/submissions/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, status: "PENDING" }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Published:", data.message);
        setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
        navigate("/feed");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      await axios.delete(`${BACKEND_URL}/drafts/delete/${id}`);
      console.log("Draft deleted");
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.log("Could not delete draft:", err);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
        <div className="col-span-full flex items-center gap-4 mb-2">
          <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
            Saved Drafts ({drafts.length})
          </span>
          <div className="h-[1px] flex-grow bg-phantom"></div>
        </div>

        {drafts.map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            onPublish={handlePublish}
            onDelete={handleDelete}
          />
        ))}

        {drafts.length === 0 && (
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
