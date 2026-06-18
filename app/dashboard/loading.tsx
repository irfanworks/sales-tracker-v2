export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-4 w-72 rounded bg-slate-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card h-80 bg-slate-100" />
        <div className="card h-80 bg-slate-100" />
      </div>
      <div className="card h-80 bg-slate-100" />
    </div>
  );
}
