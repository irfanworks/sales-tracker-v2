import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-48" />
      <TableSkeleton rows={6} />
    </div>
  );
}
