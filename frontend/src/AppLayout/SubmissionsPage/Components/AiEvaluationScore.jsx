function AiEvaluationScore({ percentage }) {
  const numericValue = parseInt(percentage) || 0;
  
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-[10px] font-mono">
        <span className="text-gray-600 uppercase">Confidence Level</span>
        <span className="text-toxic font-bold">{percentage}</span>
      </div>
      <div className="h-1.5 w-full bg-phantom rounded-full overflow-hidden border border-phantom/30">
        <div 
          className="h-full bg-toxic shadow-[0_0_8px_#22C55E]" 
          style={{ width: `${numericValue}%` }}
        />
      </div>
    </div>
  )
}

export default AiEvaluationScore;
