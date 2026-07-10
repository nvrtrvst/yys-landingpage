import { Skeleton } from "@/components/Skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-20 bg-primary-900" />
      <div className="container mx-auto px-4 md:px-6 py-24 space-y-8">
        <Skeleton className="h-12 w-1/3 mx-auto" />
        <Skeleton className="h-6 w-2/3 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <Skeleton className="aspect-[16/10] rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
