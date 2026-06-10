export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="animate-pulse bg-gray-200 rounded h-8 w-1/4" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-200 rounded-full animate-pulse" style={{ width: `${60 + i * 10}px` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-2">
            <div className="animate-pulse bg-gray-200 rounded h-4 w-1/2" />
            <div className="animate-pulse bg-gray-200 rounded h-8 w-2/3" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4 border-b border-gray-50 last:border-0">
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
