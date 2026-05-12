import React from 'react';

 function EvaluationTabs({ evaluation, activeTab, setActiveTab }) {
   const tabs = ['Overview', 'Neural Trace', 'Heuristics', 'Mitigation'];

   return (
     <div className="flex gap-8 border-b border-phantom mb-8">
       {tabs.map((tab) => (
         <button
           key={tab}
           onClick={() => setActiveTab(tab)}
           className={`pb-4 font-black uppercase tracking-widest text-[10px] transition-colors border-b-2 ${
             activeTab === tab
               ? 'text-toxic border-toxic'
               : 'text-gray-600 hover:text-gray-700 border-transparent'
           }`}
         >
           {tab}
         </button>
       ))}
     </div>
   );
 }

export default EvaluationTabs;
