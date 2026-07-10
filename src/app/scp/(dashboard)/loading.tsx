import { TableSkeleton } from "@/components/Skeleton";

export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 flex-1 space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <TableSkeleton rows={8} cols={5} />
      </div>
    </div>
  );
}
