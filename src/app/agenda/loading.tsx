import { Skeleton } from "@/components/Skeleton";

export default function AgendaLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-40 bg-primary-900" />
      <div className="container mx-auto max-w-4xl px-4 -mt-16 mb-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 space-y-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-6 pb-8 border-b border-gray-100">
              <Skeleton className="md:w-32 h-32 rounded-xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
