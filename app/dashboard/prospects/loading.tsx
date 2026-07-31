import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function ProspectsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-24" />
      <TableSkeleton rows={8} />
    </div>
  );
}
