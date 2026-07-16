import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function BdUpdatesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-40" />
      <TableSkeleton rows={6} />
    </div>
  );
}
