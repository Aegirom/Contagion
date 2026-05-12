const DraftCardSkeleton = () => (
  <div
    className="rounded-xl p-6 border animate-pulse"
    style={{
      background: "rgba(255,255,255,0.8)",
      border: "1px solid rgba(229,231,235,0.8)",
    }}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="h-6 w-2/3 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-5 w-14 rounded" style={{ background: "#E5E7EB" }} />
    </div>

    <div className="space-y-2 mb-4">
      <div className="h-4 w-full rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-4 w-3/4 rounded" style={{ background: "#E5E7EB" }} />
    </div>

    <div className="flex items-center gap-4 mb-6">
      <div className="h-3 w-36 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-3 w-10 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-3 w-24 rounded" style={{ background: "#E5E7EB" }} />
    </div>

    <div className="flex gap-3">
      <div
        className="h-11 flex-1 rounded-lg"
        style={{ background: "#E5E7EB" }}
      />
      <div
        className="h-11 flex-1 rounded-lg"
        style={{ background: "#E5E7EB" }}
      />
      <div className="h-11 w-20 rounded-lg" style={{ background: "#E5E7EB" }} />
    </div>
  </div>
);

export default DraftCardSkeleton;
