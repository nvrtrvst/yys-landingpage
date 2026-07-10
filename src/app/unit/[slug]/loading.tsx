import { Skeleton } from "@/components/Skeleton";

export default function UnitDetailLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-32 bg-primary-900" />
      <div className="bg-primary-50 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12">
            <Skeleton className="w-full md:w-1/3 aspect-[4/3] rounded-2xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
