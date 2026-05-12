import React from 'react';
import AiEvaluationScore from '../../SubmissionsPage/Components/AiEvaluationScore';

 function EvaluationDisplay({ evaluation }) {
   return (
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-8">
         <section className="bg-white border border-phantom p-6 rounded-sm">
           <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-4">Neural Analysis Summary</h4>
           <p className="text-gray-600 text-sm leading-relaxed font-mono">
             {evaluation.summary || "No automated summary available for this submission. The neural network is still processing the behavioral patterns."}
           </p>
         </section>

         <section className="bg-white border border-phantom p-6 rounded-sm">
           <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-4">Detected Behavioral Patterns</h4>
           <div className="space-y-3">
             {[
               "Entropy analysis shows high potential for obfuscation.",
               "API hooking detected in standard kernel libraries.",
               "Unusual network traffic patterns (C2 beaconing)."
             ].map((pattern, i) => (
               <div key={i} className="flex items-start gap-3 text-[10px] font-mono border-l-2 border-toxic pl-4 py-1">
                 <span className="text-toxic font-black">[MATCH]</span>
                 <span className="text-gray-700">{pattern}</span>
               </div>
             ))}
           </div>
         </section>
       </div>

       <div className="space-y-8">
         <section className="bg-white border border-phantom p-6 rounded-sm">
           <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-6">Neural Confidence Score</h4>
           <AiEvaluationScore percentage={evaluation.aiScorePercentage || "0%"} />
           
           <div className="mt-8 grid grid-cols-2 gap-4">
             <div className="bg-gray-100 p-3 border border-phantom rounded-sm">
               <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Evasion Capability</p>
               <p className="text-toxic font-mono text-lg font-black">{evaluation.evasionScore || "N/A"}</p>
             </div>
             <div className="bg-gray-100 p-3 border border-phantom rounded-sm">
               <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Potential Impact</p>
               <p className="text-red-500 font-mono text-lg font-black">{evaluation.impactScore || "N/A"}</p>
             </div>
           </div>
         </section>

         <section className="bg-white border border-phantom p-6 rounded-sm">
           <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-4">Threat Intel Metadata</h4>
           <div className="space-y-4">
             <div>
               <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Assigned Family</p>
               <p className="text-toxic font-mono text-xs">{evaluation.family || "Unknown"}</p>
             </div>
             <div>
               <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Threat Classification</p>
               <p className="text-red-500 font-mono text-xs uppercase">{evaluation.threatLevel || "Normal"}</p>
             </div>
             <div>
               <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Analysis Date</p>
               <p className="text-gray-700 font-mono text-xs">{evaluation.date || "N/A"}</p>
             </div>
           </div>
         </section>
       </div>
     </div>
   );
 }

export default EvaluationDisplay;
