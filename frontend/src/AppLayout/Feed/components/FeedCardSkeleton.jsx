const FeedCardSkeleton = () => (
  <div
    className="rounded-xl p-6 animate-pulse border"
    style={{
      background: "rgba(255,255,255,0.8)",
      border: "1px solid rgba(229,231,235,0.8)",
      backdropFilter: "blur(16px)",
      marginBottom: "1rem",
    }}
  >
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 rounded" style={{ background: "#E5E7EB" }} />
        <div className="w-4 h-3 rounded" style={{ background: "#E5E7EB" }} />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-40 rounded" style={{ background: "#E5E7EB" }} />
          <div className="h-3 w-24 rounded" style={{ background: "#E5E7EB" }} />
        </div>

        <div className="h-5 w-3/4 rounded" style={{ background: "#E5E7EB" }} />

        <div className="space-y-2">
          <div
            className="h-3 w-full rounded"
            style={{ background: "#E5E7EB" }}
          />
          <div
            className="h-3 w-5/6 rounded"
            style={{ background: "#E5E7EB" }}
          />
          <div
            className="h-3 w-2/3 rounded"
            style={{ background: "#E5E7EB" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div
            className="h-5 w-16 rounded-full"
            style={{ background: "#E5E7EB" }}
          />
          <div className="h-5 w-20 rounded" style={{ background: "#E5E7EB" }} />
          <div className="h-5 w-24 rounded" style={{ background: "#E5E7EB" }} />
        </div>
      </div>
    </div>

    <div
      className="flex items-center gap-4 ml-8 mt-3 pt-3"
      style={{ borderTop: "1px solid rgba(229,231,235,0.5)" }}
    >
      <div className="h-3 w-24 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-3 w-20 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-3 w-16 rounded" style={{ background: "#E5E7EB" }} />
    </div>
  </div>
);

export default FeedCardSkeleton;
