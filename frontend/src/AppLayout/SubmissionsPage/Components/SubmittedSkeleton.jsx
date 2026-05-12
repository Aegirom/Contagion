const SubmittedSkeleton = () => (
  <div className="bg-obsidian border border-phantom rounded-lg p-6 shadow-xl animate-pulse">
    <div className="mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="h-7 w-3/5 rounded" style={{ background: "#E5E7EB" }} />
        <div className="h-4 w-16 rounded" style={{ background: "#E5E7EB" }} />
      </div>
      <div
        className="h-4 w-full rounded mt-2"
        style={{ background: "#E5E7EB" }}
      />
      <div
        className="h-4 w-4/5 rounded mt-1"
        style={{ background: "#E5E7EB" }}
      />
    </div>

    <div className="flex gap-2 mb-5 flex-wrap">
      <div className="h-6 w-24 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-6 w-28 rounded" style={{ background: "#E5E7EB" }} />
    </div>

    <div className="mb-5 rounded-md border border-phantom/50 bg-gray-100/40 px-4 py-3">
      <div className="h-3 w-2/3 rounded" style={{ background: "#E5E7EB" }} />
      <div
        className="h-3 w-1/2 rounded mt-2"
        style={{ background: "#E5E7EB" }}
      />
    </div>

    <div className="mb-5 bg-gray-100/50 px-4 py-3 rounded-md border border-phantom/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#E5E7EB" }}
          />
          <div className="h-3 w-24 rounded" style={{ background: "#E5E7EB" }} />
        </div>
        <div className="h-3 w-28 rounded" style={{ background: "#E5E7EB" }} />
      </div>
      <div
        className="h-2 w-full rounded-full"
        style={{ background: "#E5E7EB" }}
      />
    </div>

    <hr className="border-phantom mb-4" />

    <div className="flex items-center mb-4">
      <div className="h-3 w-40 rounded" style={{ background: "#E5E7EB" }} />
    </div>

    <div className="flex items-center gap-2">
      <div
        className="h-9 flex-[1.5] rounded"
        style={{ background: "#E5E7EB" }}
      />
      <div className="h-9 flex-1 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-9 flex-1 rounded" style={{ background: "#E5E7EB" }} />
      <div className="h-9 w-10 rounded" style={{ background: "#E5E7EB" }} />
    </div>
  </div>
);

export default SubmittedSkeleton;
