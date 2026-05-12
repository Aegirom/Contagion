const ProfileSkeleton = () => (
  <main
    className="flex-1 overflow-auto relative"
    style={{ background: "#FFFFFF" }}
  >
    <div className="px-7 py-8 max-w-[1440px] mx-auto space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-3 w-16 rounded" style={{ background: "#E5E7EB" }} />
          <div className="h-8 w-48 rounded" style={{ background: "#E5E7EB" }} />
          <div className="h-3 w-64 rounded" style={{ background: "#E5E7EB" }} />
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-24 rounded-lg"
            style={{ background: "#E5E7EB" }}
          />
          <div
            className="h-6 w-20 rounded-lg"
            style={{ background: "#E5E7EB" }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div
            className="h-3 w-28 rounded mb-4"
            style={{ background: "#E5E7EB" }}
          />
          <div className="flex items-center gap-6">
            <div
              className="w-20 h-20 rounded-full"
              style={{ background: "#E5E7EB" }}
            />
            <div className="space-y-2">
              <div
                className="h-4 w-36 rounded"
                style={{ background: "#E5E7EB" }}
              />
              <div
                className="h-3 w-48 rounded"
                style={{ background: "#E5E7EB" }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5">
              <div
                className="h-8 w-16 rounded mb-1"
                style={{ background: "#E5E7EB" }}
              />
              <div
                className="h-3 w-24 rounded"
                style={{ background: "#E5E7EB" }}
              />
            </div>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {[1, 2].map((i) => (
            <div key={i}>
              <div
                className="h-3 w-20 rounded mb-1.5"
                style={{ background: "#E5E7EB" }}
              />
              <div
                className="h-10 w-full rounded-lg"
                style={{ background: "#E5E7EB" }}
              />
            </div>
          ))}
          <div>
            <div
              className="h-3 w-28 rounded mb-1.5"
              style={{ background: "#E5E7EB" }}
            />
            <div className="flex gap-2">
              <div
                className="h-10 flex-1 rounded-lg"
                style={{ background: "#E5E7EB" }}
              />
              <div
                className="h-10 w-16 rounded-lg"
                style={{ background: "#E5E7EB" }}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="h-3 w-64 rounded" style={{ background: "#E5E7EB" }} />
          <div
            className="h-10 w-36 rounded-lg"
            style={{ background: "#E5E7EB" }}
          />
        </div>
      </div>
    </div>
  </main>
);

export default ProfileSkeleton;
