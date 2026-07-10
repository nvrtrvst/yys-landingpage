import { FormSkeleton } from "@/components/Skeleton";

export default function PPDBLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-40 bg-primary-900" />
      <div className="container mx-auto max-w-3xl px-4 -mt-16 mb-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <FormSkeleton />
        </div>
      </div>
    </div>
  );
}
