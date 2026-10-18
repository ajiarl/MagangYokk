export default function Loading() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] antialiased">
      {/* Sticky Header Skeleton */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090a]/90 backdrop-blur-md">
        <div className="w-full px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 bg-white/[0.08] rounded animate-pulse" />
            <span className="text-[11px] font-mono text-[#8a8f98]">/</span>
            <div className="h-3.5 w-32 bg-white/[0.04] rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-20 bg-white/[0.04] rounded animate-pulse hidden sm:block" />
            <div className="w-6 h-6 rounded-full bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full px-6 py-5 space-y-4">
        {/* Search & Mode Bar Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
          <div className="h-9 w-full md:w-80 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-44 bg-white/[0.04] rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-white/[0.04] rounded-lg animate-pulse" />
            <div className="h-8 w-16 bg-white/[0.04] rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Tech Stack Strip Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="h-3 w-10 bg-white/[0.04] rounded shrink-0 animate-pulse" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 w-16 bg-white/[0.03] rounded-md shrink-0 animate-pulse" />
          ))}
        </div>

        {/* Status Filter Tabs Skeleton */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-white/[0.03] rounded-lg shrink-0 animate-pulse" />
          ))}
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-[#0b0c0d] border border-white/[0.06] p-4.5 space-y-3.5 flex flex-col justify-between min-h-[190px]"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-3/4 bg-white/[0.07] rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-9 bg-white/[0.05] rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-14 bg-white/[0.04] rounded animate-pulse" />
                  <div className="h-5 w-16 bg-white/[0.04] rounded animate-pulse" />
                  <div className="h-5 w-12 bg-white/[0.04] rounded animate-pulse ml-auto" />
                </div>
                <div className="space-y-1 pt-1">
                  <div className="h-3 w-full bg-white/[0.03] rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-white/[0.03] rounded animate-pulse" />
                </div>
              </div>

              {/* Card Footer Skeleton */}
              <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between gap-2">
                <div className="h-8 w-24 bg-white/[0.04] rounded-lg animate-pulse" />
                <div className="flex items-center gap-1.5">
                  <div className="h-8 w-8 bg-white/[0.04] rounded-lg animate-pulse" />
                  <div className="h-8 w-8 bg-white/[0.04] rounded-lg animate-pulse" />
                  <div className="h-8 w-8 bg-white/[0.04] rounded-lg animate-pulse" />
                  <div className="h-8 w-24 bg-white/[0.04] rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
