import { CardSkeleton } from "@/components/Skeleton";

export default function BeritaLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-40 bg-primary-900" />
      <div className="container mx-auto px-4 md:px-6 -mt-16 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
