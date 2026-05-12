const SavedPostSkeleton = () => (
  <div
    className="rounded-xl p-6 border animate-pulse"
    style={{
      background: "rgba(255,255,255,0.8)",
      border: "1px solid rgba(229,231,235,0.8)",
      backdropFilter: "blur(16px)",
    }}
  >
    <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-36 rounded" style={{ background: "#E5E7EB" }} />
          <div className="h-3 w-24 rounded" style={{ background: "#E5E7EB" }} />
        </div>

        <div className="h-6 w-3/4 rounded" style={{ background: "#E5E7EB" }} />

        <div className="space-y-2">
          <div
            className="h-4 w-full rounded"
            style={{ background: "#E5E7EB" }}
          />
          <div
            className="h-4 w-2/3 rounded"
            style={{ background: "#E5E7EB" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div
            className="h-5 w-20 rounded-full"
            style={{ background: "#E5E7EB" }}
          />
          <div className="h-5 w-16 rounded" style={{ background: "#E5E7EB" }} />
          <div className="h-5 w-28 rounded" style={{ background: "#E5E7EB" }} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="w-9 h-9 rounded-lg" style={{ background: "#E5E7EB" }} />
        <div className="w-9 h-9 rounded-lg" style={{ background: "#E5E7EB" }} />
      </div>
    </div>
  </div>
);

export default SavedPostSkeleton;
