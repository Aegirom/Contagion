import React, { useState, useEffect, useContext } from "react";
import SearchBar from "./Components/SearchBar";
import Submitted from "./Components/Submitted";
import AiEvaluationModal from "./Components/AiEvaluationModal";
import { useNavigate } from "react-router-dom";
import PlusButton from "../Dashboard/Components/Buttons.jsx";
import { AuthContext } from "../../context/AuthContext";
import { deleteSubmission, evaluateSandboxFile, getUserSubmissions } from "../../services/api";

function SubmissionsPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [filters, setFilters] = useState({
    query: "",
    status: "all",
    family: "all"
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [runningSandboxId, setRunningSandboxId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await getUserSubmissions();
        console.log("User submissions Received");
        setSubmissions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.log("Could not receive submissions: ", err);
      } finally {
        setDataLoading(false);
      }
    };

    if (authLoading) {
      return;
    }

    if (user?.user_id || user?.id) {
      getData();
    } else {
      setDataLoading(false);
    }
  }, [user, authLoading]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    navigate(`/post/${submission.submission_id || submission.id}`);
  };

  const handleOpenEvaluation = (submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const refreshSubmissions = async () => {
    const res = await getUserSubmissions();
    setSubmissions(Array.isArray(res.data) ? res.data : []);
  };

  const handleRunSandbox = async (submission) => {
    if (!submission.hash) return;
    setActionError("");
    setRunningSandboxId(submission.id);
    try {
      await evaluateSandboxFile({
        submission_id: submission.id,
        file_hash: submission.hash,
        environment: "Docker",
        os_profile: "Windows10",
        network_enabled: false,
        timeout_seconds: 120,
      });
      await refreshSubmissions();
    } catch (err) {
      setActionError(err.response?.data?.error || "Sandbox evaluation failed");
    } finally {
      setRunningSandboxId(null);
    }
  };

  const handleDeleteSubmission = async (submission) => {
    const confirmed = window.confirm(`Delete "${submission.name}"? This archives the submission and removes it from active lists.`);
    if (!confirmed) return;

    setActionError("");
    setDeletingId(submission.id);
    try {
      await deleteSubmission(submission.id);
      setSubmissions((prev) => prev.filter((item) => item.submission_id !== submission.id));
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to delete submission");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleViewFullReport = () => {
    if (selectedSubmission) {
      navigate(`/submissions/${selectedSubmission.submission_id || selectedSubmission.id}/ai-evaluation`);
    }
    handleCloseModal();
  };

  // Transform API data to match component format
  const transformedSubmissions = submissions.map(sub => ({
    id: sub.submission_id,
    name: sub.title || 'Untitled',
    description: sub.content?.substring(0, 100) || '',
    status: sub.status,
    family: sub.malware_family || sub.malware_category || sub.template_type || 'General',
    threatLevel: sub.malware_category || 'Unknown',
    aiScorePercentage: sub.sandbox_status === 'Completed' ? '100%' : '0%',
    reviewCount: 0,
    date: sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Unknown',
    artifactId: sub.artifact_id,
    hash: sub.sha256_hash,
    fileName: sub.file_name,
    sandboxStatus: sub.sandbox_status || 'Not queued',
  }));

  // Filter submissions
  const filteredSubmissions = transformedSubmissions.filter(item => {
    const matchesQuery = item.name.toLowerCase().includes(filters.query.toLowerCase()) ||
      item.description.toLowerCase().includes(filters.query.toLowerCase());

    const matchesStatus = filters.status === "all" || item.status === filters.status;
    const matchesFamily = filters.family === "all" || item.family === filters.family;

    return matchesQuery && matchesStatus && matchesFamily;
  });

  return (
    <>
      <div className="min-h-screen bg-abyss text-slate-100 px-6 py-12 md:px-12 lg:px-20">
        <div className="flex flex-row justify-between items-end mb-10 pb-6 border-b border-phantom">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-toxic shadow-[0_0_8px_#22C55E]"></div>
              <h3 className="text-3xl font-black text-slate-100 tracking-tighter uppercase">My Submissions</h3>
            </div>
          </div>
          <PlusButton text={"New Submission"} />
        </div>

        <div className="mb-12">
          <SearchBar filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {actionError && (
          <div className="mb-6 rounded border border-red-900/40 bg-red-900/10 px-4 py-3 font-code text-xs text-red-300">
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          <div className="col-span-full flex items-center gap-4 mb-2">
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
              Query Results ({filteredSubmissions.length})
            </span>
            <div className="h-[1px] flex-grow bg-phantom"></div>
          </div>

          {filteredSubmissions.map((item) => (
            <Submitted
              key={item.id}
              {...item}
              aiScorePercentage={runningSandboxId === item.id ? '...' : item.aiScorePercentage}
              onOpenAiEval={() => handleOpenEvaluation(item)}
              gotoPost={() => handleViewDetails(item)}
              onRunSandbox={() => handleRunSandbox(item)}
              onDelete={() => handleDeleteSubmission(item)}
              deleting={deletingId === item.id}
            />
          ))}

          {filteredSubmissions.length === 0 && !dataLoading && (
            <div className="col-span-full py-20 text-center border border-dashed border-phantom">
              <p className="text-slate-500 font-mono text-sm uppercase">No intelligence found matching current parameters.</p>
            </div>
          )}

          {dataLoading && filteredSubmissions.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-toxic border-t-transparent mb-4"></div>
              <p className="text-slate-500 font-mono text-sm uppercase">Loading submissions...</p>
            </div>
          )}
        </div>
      </div>

      {selectedSubmission && (
        <AiEvaluationModal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          evaluationResult={
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Summary for <span className="text-toxic">{selectedSubmission.name}</span></p>
              <div className="bg-void p-4 border border-phantom rounded">
                <p className="text-xs font-mono text-slate-300">
                  Automated analysis confirms <span className="text-red-500">{selectedSubmission.threatLevel}</span> threat level
                  with a neural confidence of <span className="text-toxic">{selectedSubmission.aiScorePercentage}</span>.
                  Recommended action: Immediate quarantine and further deep-dive analysis.
                </p>
              </div>
              <button
                onClick={handleViewFullReport}
                className="w-full bg-toxic text-void font-black py-2 rounded-sm uppercase tracking-widest text-[10px] hover:bg-toxic/80 transition-all"
              >
                View Full Neural Report
              </button>
            </div>
          }
        />
      )}
    </>
  );
}

export default SubmissionsPage;
