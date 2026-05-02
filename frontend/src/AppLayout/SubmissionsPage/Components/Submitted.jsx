import AiEvaluationScore from "./AiEvaluationScore";

function Submitted({ name, description, status, family, threatLevel, aiScorePercentage, reviewCount, date, hash, fileName, sandboxStatus, onOpenAiEval, gotoPost, onRunSandbox, onDelete, deleting }) {
  // Logic to determine threat color based on the design system
  const getThreatColor = (level) => {
    const l = level?.toLowerCase();
    if (l?.includes('high') || l?.includes('critical')) return 'text-red-500 border-red-900 bg-red-900/10';
    if (l?.includes('medium') || l?.includes('elevated')) return 'text-amber-500 border-amber-900 bg-amber-900/10';
    return 'text-cyan-400 border-cyan-900 bg-cyan-900/10';
  };

  return (
    <div className="bg-obsidian border border-phantom rounded-lg p-6 shadow-xl max-w-2xl transition-all hover:border-toxic/30 group">
      {/* Upper Part: Title and Status */}
      <div id="submittedUpperPart" className="mb-4">
        <div id="submittedTitleLine" className="flex justify-between items-start mb-1">
          <h2 id="submittedName" className="text-slate-100 text-2xl font-bold tracking-tight">
            {name}
          </h2>
          <p id="submittedStatus" className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-black pt-2">
            {status}
          </p>
        </div>
        <h3 id="submittedDescription" className="text-slate-400 text-sm font-medium leading-relaxed">
          {description}
        </h3>
      </div>

      {/* Tags Section */}
      <div id="submittedTags" className="flex gap-3 mb-6">
        <p id="submittedFamily" className="text-toxic bg-green-900/20 border border-green-900/50 px-3 py-1 rounded text-xs font-mono uppercase">
          {family}
        </p>
        <p id="submittedThreatLevel" className={`px-3 py-1 rounded text-xs font-mono uppercase border ${getThreatColor(threatLevel)}`}>
          THREAT: {threatLevel}
        </p>
        {sandboxStatus && (
          <p className="text-cyan-400 bg-cyan-900/10 border border-cyan-900/50 px-3 py-1 rounded text-xs font-mono uppercase">
            SANDBOX: {sandboxStatus}
          </p>
        )}
      </div>

      <div className="mb-6 rounded-md border border-phantom/50 bg-slate-dark/40 p-3">
        <p className="font-code text-[10px] uppercase tracking-widest text-slate-600">{fileName || 'No artifact linked'}</p>
        <p className="mt-1 break-all font-code text-[11px] text-toxic">{hash || 'Upload an artifact to enable sandbox execution'}</p>
      </div>

      {/* AI Evaluation Section */}
      <div className="mb-6 bg-slate-dark/50 p-4 rounded-md border border-phantom/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-toxic animate-pulse"></div>
            <span className="text-[10px] text-viral font-bold uppercase tracking-widest">Neural Analysis</span>
          </div>
          <button
            onClick={onOpenAiEval}
            className="text-[9px] text-toxic hover:underline font-mono uppercase tracking-tighter"
          >
            Launch Neural Summary
          </button>
        </div>
        <AiEvaluationScore percentage={aiScorePercentage} />
      </div>

      <hr className="border-phantom mb-4" />

      {/* Bottom Part: Metadata and CTA */}
      <div id="submittedBottomPart" className="flex justify-between items-center">
        <div id="submittiedBottomLeft" className="flex items-center gap-2 text-slate-500 text-xs font-medium">
          <p id="submittedReviewCount">{reviewCount} peer reviews</p>
          <p id="submittedDividingCircle" className="text-phantom">•</p>
          <p id="submittedDate" className="font-mono">{date}</p>
        </div>

        <div id="submittedBottomRightPart" className="flex gap-4">
          <button
            onClick={onDelete}
            disabled={deleting}
            className="bg-red-900/10 hover:bg-red-900/20 text-red-300 border border-red-900/40 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {deleting ? 'DELETING' : 'DELETE'}
          </button>
          {hash && (
            <button
              onClick={onRunSandbox}
              className="bg-cyan-900/10 hover:bg-cyan-900/20 text-cyan-300 border border-cyan-900/40 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all"
            >
              RUN SANDBOX
            </button>
          )}
          <button
            onClick={onOpenAiEval}
            className="bg-toxic/10 hover:bg-toxic/20 text-toxic border border-toxic/30 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all"
          >
            AI EVAL
          </button>
          <button
            id="submittedViewDetails"
            onClick={gotoPost}
            className="text-toxic hover:text-green-300 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 group-hover:translate-x-1 duration-200">
            View Details <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Submitted;
