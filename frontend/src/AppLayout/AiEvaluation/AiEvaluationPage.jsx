import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEvaluations, addEvaluation } from '../../services/aiEvaluationService';
import EvaluationTabs from './components/EvaluationTabs';
import EvaluationDisplay from './components/EvaluationDisplay';

function AiEvaluationPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const loadEvaluation = async (autoTrigger = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvaluations(submissionId);
      setEvaluation(data);
    } catch (err) {
      if (err.response?.status === 404 && autoTrigger) {
        // If not found, try to trigger a new evaluation once
        await handleTriggerEvaluation();
      } else {
        setError(err.response?.data?.error || "Failed to load neural report");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerEvaluation = async () => {
    try {
      setRetrying(true);
      setError(null);
      const data = await addEvaluation(submissionId);
      setEvaluation(data);
    } catch (err) {
      setError(err.response?.data?.error || "Neural analysis failed");
    } finally {
      setRetrying(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionId) {
      loadEvaluation(true);
    }
  }, [submissionId]);

   if (loading || retrying) {
     return (
       <div className="min-h-screen bg-gray-50 text-gray-900 px-6 py-12 md:px-12 lg:px-20">
         <div className="flex items-center justify-center h-[60vh]">
           <div className="text-center">
             <div className="w-12 h-12 rounded-full border-2 border-toxic border-t-transparent animate-spin mx-auto mb-4"></div>
             <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">
               {retrying ? "Initializing Neural Engine..." : "Analyzing Neural Trace..."}
             </p>
           </div>
         </div>
       </div>
     );
   }

   if (error) {
     return (
       <div className="min-h-screen bg-gray-50 text-gray-900 px-6 py-12 md:px-12 lg:px-20 text-center">
         <h3 className="text-red-500 font-black uppercase tracking-widest mb-4">Neural Analysis Error</h3>
         <p className="text-gray-600 text-sm font-mono mb-8">{error}</p>
         <div className="flex justify-center gap-4">
           <button 
             onClick={() => loadEvaluation()}
             className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-mono text-xs uppercase tracking-widest"
           >
             Retry Analysis
           </button>
          <button 
            onClick={() => navigate('/submissions')}
            className="px-6 py-2 bg-toxic/10 border border-toxic/20 text-toxic hover:bg-toxic/20 font-mono text-xs uppercase tracking-widest"
          >
            Return to Submissions
          </button>
        </div>
      </div>
    );
  }

   if (!evaluation) {
     return (
       <div className="min-h-screen bg-gray-50 text-gray-900 px-6 py-12 md:px-12 lg:px-20 text-center">
         <h3 className="text-red-500 font-black uppercase tracking-widest mb-4">Submission Not Found</h3>
        <button 
          onClick={() => navigate('/submissions')}
          className="text-toxic hover:underline font-mono text-sm"
        >
          Return to Submissions
        </button>
      </div>
    );
  }

   return (
     <div className="min-h-screen bg-gray-50 text-gray-900 px-6 py-12 md:px-12 lg:px-20">
       <div className="mb-8">
         <button 
           onClick={() => navigate('/submissions')}
           className="text-gray-600 hover:text-toxic transition-colors text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 mb-6"
         >
           ← Back to Intelligence
         </button>
         <div className="flex flex-row justify-between items-end pb-6 border-b border-phantom">
           <div className="space-y-1">
             <div className="flex items-center gap-2">
               <div className="w-1 h-6 bg-toxic shadow-[0_0_8px_#22C55E]"></div>
               <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Neural Report</h3>
             </div>
             <p className="text-gray-600 text-sm font-mono">{evaluation.submissionName || `Submission #${submissionId}`}</p>
           </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-toxic animate-pulse shadow-[0_0_8px_#22C55E]"></div>
            <span className="text-[10px] text-toxic font-mono font-bold uppercase tracking-widest">Active Analysis</span>
          </div>
        </div>
      </div>

      <EvaluationTabs evaluation={evaluation} />
      <EvaluationDisplay evaluation={evaluation} />
    </div>
  );
}

export default AiEvaluationPage;