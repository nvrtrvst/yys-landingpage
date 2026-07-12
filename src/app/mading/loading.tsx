export default function MadingLoading() {
  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-64" />)}
        </div>
      </div>
    </div>
  );
}
