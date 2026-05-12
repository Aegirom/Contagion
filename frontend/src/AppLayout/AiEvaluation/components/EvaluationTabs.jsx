import React from 'react';

 function EvaluationTabs({ evaluation }) {
   return (
     <div className="flex gap-8 border-b border-phantom mb-8">
       <button className="pb-4 text-toxic border-b-2 border-toxic font-black uppercase tracking-widest text-[10px]">
         Overview
       </button>
       <button className="pb-4 text-gray-600 hover:text-gray-700 font-black uppercase tracking-widest text-[10px] transition-colors">
         Neural Trace
       </button>
       <button className="pb-4 text-gray-600 hover:text-gray-700 font-black uppercase tracking-widest text-[10px] transition-colors">
         Heuristics
       </button>
       <button className="pb-4 text-gray-600 hover:text-gray-700 font-black uppercase tracking-widest text-[10px] transition-colors">
         Mitigation
       </button>
     </div>
   );
 }

export default EvaluationTabs;
