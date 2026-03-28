import React, { useState, useEffect } from "react";
import SearchBar from "./Components/SearchBar";
import Submitted from "./Components/Submitted";
import AiEvaluationModal from "./Components/AiEvaluationModal";
import { useNavigate } from "react-router-dom";
import PlusButton from "../Dashboard/Components/Buttons.jsx";
import axios from 'axios';

const backendURL = import.meta.env.backendURL;

const INITIAL_SUBMISSIONS = [
  { id: 1, name: "WannaCry Network Patterns", description: "Analysis of SMB exploitation.", status: "Under Review", family: "Ransomware", threatLevel: "Critical", aiScorePercentage: "98%", reviewCount: 2, date: "2024-02-13" },
  { id: 2, name: "Emotet Payload Delivery", description: "Investigation into VBA macros.", status: "Approved", family: "Trojan", threatLevel: "High", aiScorePercentage: "84%", reviewCount: 5, date: "2024-02-10" },
  { id: 3, name: "Stuxnet PLC Logic", description: "Deep dive into industrial control.", status: "Archived", family: "Worm", threatLevel: "Critical", aiScorePercentage: "100%", reviewCount: 12, date: "2024-01-25" },
  { id: 4, name: "Cobalt Strike Beacon", description: "Detecting memory-resident beacons.", status: "Under Review", family: "APT", threatLevel: "Elevated", aiScorePercentage: "72%", reviewCount: 1, date: "2024-02-15" },
];

function SubmissionsPage() {

  const getData = async () => {
    try {
      const res = await axios.get(backendURL + '/submissions/get/');
      console.log("Submissions Recieved: ", res);
    }
    catch (err) {
      console.log("Could not recieve submissions: ", err);
    }
  }

  getData();

  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    query: "",
    status: "all",
    family: "all"
  });

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    navigate(`/post/${submission.id}`);
  }

  const handleOpenEvaluation = (submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleViewFullReport = () => {
    if (selectedSubmission) {
      navigate(`/submissions/${selectedSubmission.id}/ai-evaluation`);
    }
    handleCloseModal();
  };

  const filteredSubmissions = INITIAL_SUBMISSIONS.filter(item => {
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
              onOpenAiEval={() => handleOpenEvaluation(item)}
              gotoPost={() => handleViewDetails(item)}
            />
          ))}

          {filteredSubmissions.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-phantom">
              <p className="text-slate-500 font-mono text-sm uppercase">No intelligence found matching current parameters.</p>
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
