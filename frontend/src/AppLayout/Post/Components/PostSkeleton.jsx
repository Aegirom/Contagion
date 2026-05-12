const PostSkeleton = () => (
  <main className="flex-1 overflow-auto relative z-10">
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 animate-pulse">
      <div
        className="h-4 w-20 rounded mb-6"
        style={{ background: "#E5E7EB" }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-xl p-6 border"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(229,231,235,0.8)",
            }}
          >
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="flex-1 space-y-3">
                <div
                  className="h-7 w-3/4 rounded"
                  style={{ background: "#E5E7EB" }}
                />
                <div
                  className="h-4 w-1/2 rounded"
                  style={{ background: "#E5E7EB" }}
                />
                <div className="flex items-center gap-4">
                  <div
                    className="h-5 w-16 rounded"
                    style={{ background: "#E5E7EB" }}
                  />
                  <div
                    className="h-5 w-16 rounded"
                    style={{ background: "#E5E7EB" }}
                  />
                  <div
                    className="h-5 w-16 rounded"
                    style={{ background: "#E5E7EB" }}
                  />
                  <div
                    className="h-5 w-16 rounded"
                    style={{ background: "#E5E7EB" }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div
                  className="h-6 w-20 rounded-full"
                  style={{ background: "#E5E7EB" }}
                />
                <div
                  className="h-5 w-16 rounded"
                  style={{ background: "#E5E7EB" }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
              >
                <div
                  className="h-3 w-24 rounded mb-2"
                  style={{ background: "#E5E7EB" }}
                />
                <div
                  className="h-4 w-3/4 rounded"
                  style={{ background: "#E5E7EB" }}
                />
              </div>

              <div className="space-y-2">
                <div
                  className="h-4 w-full rounded"
                  style={{ background: "#E5E7EB" }}
                />
                <div
                  className="h-4 w-full rounded"
                  style={{ background: "#E5E7EB" }}
                />
                <div
                  className="h-4 w-5/6 rounded"
                  style={{ background: "#E5E7EB" }}
                />
                <div
                  className="h-4 w-4/5 rounded"
                  style={{ background: "#E5E7EB" }}
                />
                <div
                  className="h-4 w-3/4 rounded"
                  style={{ background: "#E5E7EB" }}
                />
              </div>
            </div>
          </div>

          <div
            className="rounded-xl overflow-hidden border"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(229,231,235,0.8)",
            }}
          >
            <div
              className="px-6 py-4 border-b border-[rgba(229,231,235,0.5)]"
              style={{ background: "#F9FAFB" }}
            >
              <div
                className="h-4 w-40 rounded"
                style={{ background: "#E5E7EB" }}
              />
            </div>
            <div className="divide-y divide-[rgba(229,231,235,0.3)]">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="px-6 py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 space-y-1">
                    <div
                      className="h-3 w-24 rounded"
                      style={{ background: "#E5E7EB" }}
                    />
                    <div
                      className="h-3 w-3/4 rounded"
                      style={{ background: "#E5E7EB" }}
                    />
                  </div>
                  <div
                    className="h-5 w-20 rounded"
                    style={{ background: "#E5E7EB" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="rounded-xl p-6 border"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(229,231,235,0.8)",
            }}
          >
            <div
              className="h-3 w-28 rounded mb-6"
              style={{ background: "#E5E7EB" }}
            />
            <div className="flex flex-col items-center">
              <div
                className="w-32 h-32 rounded-full"
                style={{ background: "#E5E7EB" }}
              />
              <div
                className="h-3 w-24 rounded mt-4"
                style={{ background: "#E5E7EB" }}
              />
            </div>
          </div>

          <div
            className="rounded-xl p-6 border"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(229,231,235,0.8)",
            }}
          >
            <div
              className="h-3 w-32 rounded mb-4"
              style={{ background: "#E5E7EB" }}
            />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <div
                    className="h-3 w-24 rounded"
                    style={{ background: "#E5E7EB" }}
                  />
                  <div
                    className="h-3 w-20 rounded"
                    style={{ background: "#E5E7EB" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
);

export default PostSkeleton;
