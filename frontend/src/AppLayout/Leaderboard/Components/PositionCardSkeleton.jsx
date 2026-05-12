const PositionCardSkeleton = () => (
  <div className="relative w-full bg-obsidian border border-phantom rounded-md px-5 py-3 flex items-center justify-between animate-pulse">
    <div className="absolute left-0 top-0 h-full w-[3px] bg-gray-200" />

    <div className="flex items-center gap-4">
      <div className="w-8 h-4 rounded" style={{ background: "#E5E7EB" }} />
      <div
        className="w-10 h-10 rounded-full"
        style={{ background: "#E5E7EB" }}
      />
      <div className="h-4 w-32 rounded" style={{ background: "#E5E7EB" }} />
    </div>

    <div className="hidden md:flex items-center gap-8">
      <div className="h-4 w-24 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-4 w-20 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-4 w-20 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-4 w-20 rounded" style={{ background: "#E5E7EB" }} />
    </div>
  </div>
);

export default PositionCardSkeleton;
