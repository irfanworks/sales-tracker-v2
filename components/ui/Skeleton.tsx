export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-xl ${className}`} aria-hidden />;
}

export function ChartSkeleton() {
  return (
    <div className="card space-y-4 p-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-shell divide-y divide-slate-100">
      <div className="flex gap-4 px-4 py-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
          <Skeleton className="h-4 w-full max-w-[180px]" />
          <Skeleton className="h-4 w-full max-w-[80px]" />
        </div>
      ))}
    </div>
  );
}
