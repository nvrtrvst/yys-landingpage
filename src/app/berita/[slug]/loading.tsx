import { Skeleton } from "@/components/Skeleton";

export default function BeritaDetailLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-32 bg-primary-900" />
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="aspect-[2/1] rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
