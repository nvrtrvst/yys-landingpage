export default function MadingLoading() {
  return (
    <div className="flex-1 bg-gradient-to-br from-stone-100 via-amber-50 to-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-8">
          {/* Hero skeleton */}
          <div className="mx-auto max-w-2xl rounded-2xl bg-white/80 p-8 shadow-xl ring-1 ring-black/5 backdrop-blur">
            <div className="mx-auto mb-4 h-5 w-48 rounded-full bg-gray-200" />
            <div className="mx-auto mb-3 h-10 w-3/4 rounded bg-gray-200" />
            <div className="mx-auto mb-6 h-10 w-2/3 rounded bg-gray-200" />
            <div className="mx-auto h-4 w-96 rounded bg-gray-200" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/80 p-5 shadow-lg ring-1 ring-black/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-6 w-12 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
                <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gray-200" />
                <div className="mx-auto mb-2 h-4 w-24 rounded bg-gray-200" />
                <div className="mx-auto h-3 w-32 rounded bg-gray-200" />
              </div>
            ))}
          </div>

          {/* Posts skeleton */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5">
                <div className="mb-3 h-3 w-16 rounded-full bg-gray-200" />
                <div className="mb-2 h-5 w-full rounded bg-gray-200" />
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
                <div className="mb-3 h-4 w-full rounded bg-gray-200" />
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
