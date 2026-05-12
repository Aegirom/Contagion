import AiEvaluationScore from "./AiEvaluationScore";

function Submitted({ name, description, status, family, threatLevel, aiScorePercentage, reviewCount, date, hash, fileName, sandboxStatus, onOpenAiEval, gotoPost, onRunSandbox, onDelete, deleting }) {
  const getThreatColor = (level) => {
    const l = level?.toLowerCase();
    if (l?.includes('high') || l?.includes('critical')) return 'text-red-500 border-red-200 bg-red-50';
    if (l?.includes('medium') || l?.includes('elevated')) return 'text-amber-500 border-amber-200 bg-amber-50';
    return 'text-amber-500 border-amber-200 bg-amber-50';
  };

  return (
    <div className="bg-obsidian border border-phantom rounded-lg p-6 shadow-xl transition-all hover:border-toxic/30 group">
      {/* Upper Part: Title and Status */}
      <div id="submittedUpperPart" className="mb-4">
        <div id="submittedTitleLine" className="flex justify-between items-start mb-2">
          <h2 id="submittedName" className="text-gray-900 text-2xl font-bold tracking-tight truncate mr-3">
            {name}
          </h2>
          <p id="submittedStatus" className="text-gray-500 text-[10px] uppercase tracking-[0.2em] font-black pt-1 whitespace-nowrap">
            {status}
          </p>
        </div>
        <h3 id="submittedDescription" className="text-gray-600 text-sm leading-relaxed line-clamp-2">
          {description}
        </h3>
      </div>

      {/* Tags Section */}
      <div id="submittedTags" className="flex gap-2 mb-5 flex-wrap">
        <p id="submittedFamily" className="text-toxic bg-green-50 border border-green-200 px-3 py-1 rounded text-xs font-mono uppercase">
          {family}
        </p>
        <p id="submittedThreatLevel" className={`px-3 py-1 rounded text-xs font-mono uppercase border whitespace-nowrap ${getThreatColor(threatLevel)}`}>
          THREAT: {threatLevel}
        </p>
        {sandboxStatus && (
          <p className="text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded text-xs font-mono uppercase">
            SANDBOX: {sandboxStatus}
          </p>
        )}
      </div>

      <div className="mb-5 rounded-md border border-phantom/50 bg-gray-100/40 px-4 py-3">
        <p className="font-code text-[10px] uppercase tracking-widest text-gray-500 truncate">{fileName || 'No artifact linked'}</p>
        <p className="mt-1 truncate font-code text-[11px] text-toxic">{hash || 'Upload an artifact to enable sandbox execution'}</p>
      </div>

      {/* AI Evaluation Section */}
      <div className="mb-5 bg-gray-100/50 px-4 py-3 rounded-md border border-phantom/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-toxic animate-pulse"></div>
            <span className="text-[10px] text-viral font-bold uppercase tracking-widest">Neural Analysis</span>
          </div>
          <button
            onClick={onOpenAiEval}
            className="text-[10px] text-toxic/70 hover:text-toxic font-mono uppercase tracking-tighter"
          >
            Launch Neural Summary
          </button>
        </div>
        <AiEvaluationScore percentage={aiScorePercentage} />
      </div>

      <hr className="border-phantom mb-4" />

      {/* Bottom Part: Metadata */}
      <div id="submittedBottomPart" className="flex items-center mb-4">
        <div className="flex items-center gap-2 text-gray-600 text-xs font-medium">
          <p>{reviewCount} peer reviews</p>
          <p className="text-phantom">•</p>
          <p className="font-mono">{date}</p>
        </div>
      </div>

      {/* Action buttons - all in one line */}
      <div className="flex items-center gap-2">
        <button
          onClick={gotoPost}
          className="flex-[1.5] bg-toxic/10 hover:bg-toxic/20 text-toxic border border-toxic/30 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all text-center whitespace-nowrap"
        >
          View Details
        </button>
        {hash && (
          <button
            onClick={onRunSandbox}
            className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all text-center whitespace-nowrap"
          >
            Run Sandbox
          </button>
        )}
        <button
          onClick={onOpenAiEval}
          className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all text-center whitespace-nowrap"
        >
          AI Eval
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="w-10 h-9 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded transition-all disabled:opacity-50 flex items-center justify-center flex-shrink-0"
          title="Delete"
        >
          {deleting ? (
            <div className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default Submitted;
