import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createSubmission,
  evaluateSandboxFile,
  getSubmissionById,
  updateSubmission,
} from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useArtifactStore } from "../../stores/artifactStore";
import ArtifactUploader from "./ArtifactUploader";

const CreatePost = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draftId");
  const { user } = useContext(AuthContext);
  const {
    selectedFile,
    uploadedArtifact,
    uploadSelectedArtifact,
    clearUpload,
  } = useArtifactStore();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "Draft",
    version: 1,
    template_type: "MALWARE_ANALYSIS",
    malware_category: "Other",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(draftId));
  const [runSandbox, setRunSandbox] = useState(true);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!draftId) return;

    const loadDraft = async () => {
      try {
        const response = await getSubmissionById(draftId);
        const draft = response.data;
        setFormData({
          title: draft.title || "",
          content: draft.content || "",
          status: draft.status || "Draft",
          version: draft.version || 1,
          template_type: draft.template_type || "MALWARE_ANALYSIS",
          malware_category: draft.malware_category || "Other",
        });
      } catch (error) {
        setSubmitError(error.response?.data?.error || "Failed to load draft");
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadDraft();
  }, [draftId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitStatus = e.nativeEvent.submitter?.value || formData.status;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      let artifact = uploadedArtifact;
      if (selectedFile && !artifact) {
        artifact = await uploadSelectedArtifact({
          malwareFamily: formData.title,
          malwareCategory: formData.malware_category,
        });
      }

      const payload = {
        artifact_id: artifact?.artifact_id || null,
        title: formData.title,
        content: formData.content,
        status: submitStatus,
        version: formData.version,
        template_type: formData.template_type,
      };

      const response = draftId
        ? await updateSubmission(draftId, payload)
        : await createSubmission(payload);
      const submissionId =
        response.data.submission_id ||
        response.data.submission?.submission_id ||
        draftId;

      if (
        runSandbox &&
        submitStatus !== "Draft" &&
        artifact?.sha256_hash &&
        submissionId
      ) {
        try {
          await evaluateSandboxFile({
            submission_id: Number(submissionId),
            file_hash: artifact.sha256_hash,
            environment: "Docker",
            os_profile: "Windows10",
            network_enabled: false,
            timeout_seconds: 120,
          });
        } catch (sandboxError) {
          console.warn("Sandbox evaluation did not complete:", sandboxError);
        }
      }

      clearUpload();
      navigate(submitStatus === "Draft" ? "/drafts" : `/post/${submissionId}`);
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError(
        error.message ||
          error.response?.data?.error ||
          "Failed to submit analysis.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-auto relative z-10">
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="mb-8">
          <h2
            className="font-display text-2xl font-bold"
            style={{ color: "#F1F5F9" }}
          >
            {draftId ? "Edit" : "New"}{" "}
            <span style={{ color: "#22C55E" }}>Analysis Report</span>
          </h2>
        </div>

        {isLoadingDraft ? (
          <div className="py-20 text-center font-code text-xs uppercase tracking-widest text-slate-500">
            Loading draft...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className="rounded-xl p-8 border space-y-6"
              style={{
                background: "rgba(12,13,20,0.8)",
                border: "1px solid rgba(30,34,51,0.8)",
              }}
            >
              {/* Title Field (Maps to title in DB) */}
              <div className="space-y-2">
                <label
                  className="font-code text-[10px] uppercase tracking-widest block"
                  style={{ color: "#475569" }}
                >
                  Report Title (Malware Family)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. LockBit 3.0 Analysis"
                  className="w-full px-4 py-3 rounded-lg bg-[#0A0B10] border border-white/5 text-sm focus:outline-none focus:border-[#22C55E]/40"
                  style={{ color: "#F1F5F9" }}
                  required
                />
              </div>

              <ArtifactUploader />

              <div className="space-y-2">
                <label
                  className="font-code text-[10px] uppercase tracking-widest block"
                  style={{ color: "#475569" }}
                >
                  Malware Category
                </label>
                <select
                  name="malware_category"
                  value={formData.malware_category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-[#0A0B10] border border-white/5 text-sm focus:outline-none focus:border-[#22C55E]/40"
                  style={{ color: "#F1F5F9" }}
                >
                  <option>Ransomware</option>
                  <option>Trojan</option>
                  <option>Worm</option>
                  <option>APT</option>
                  <option>Rootkit</option>
                  <option>Spyware</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Analysis Summary (Maps to content in DB) */}
              <div className="space-y-2">
                <label
                  className="font-code text-[10px] uppercase tracking-widest block"
                  style={{ color: "#475569" }}
                >
                  Analysis Summary (Content)
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Describe your findings..."
                  rows="6"
                  className="w-full px-4 py-3 rounded-lg bg-[#0A0B10] border border-white/5 text-sm focus:outline-none focus:border-[#22C55E]/40 resize-none"
                  style={{ color: "#F1F5F9" }}
                  required
                />
              </div>

              <label className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0A0B10] px-4 py-3">
                <span>
                  <span
                    className="block font-code text-[10px] uppercase tracking-widest"
                    style={{ color: "#F1F5F9" }}
                  >
                    Run sandbox after submit
                  </span>
                  <span className="text-xs" style={{ color: "#64748B" }}>
                    Uses the uploaded artifact hash for automated evaluation.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={runSandbox}
                  onChange={(event) => setRunSandbox(event.target.checked)}
                  className="h-5 w-5 accent-[#22C55E]"
                />
              </label>

              {submitError && (
                <div className="rounded border border-red-900/40 bg-red-900/10 p-3 font-code text-xs text-red-300">
                  {submitError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  name="status"
                  value="Draft"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-xs font-mono uppercase tracking-wider border border-phantom bg-transparent text-slate-100 rounded-lg transition-colors duration-200 hover:bg-phantom/50"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  name="status"
                  value="Pending"
                  disabled={isSubmitting || !user}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-xs font-mono uppercase tracking-wider bg-toxic text-void border border-phantom rounded-lg transition-colors duration-200 hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Analysis"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default CreatePost;
