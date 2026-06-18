export default function ProjectsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-4 w-56 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-36 rounded bg-slate-200" />
      </div>
      <div className="card h-24 bg-slate-100" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card h-28 bg-slate-100" />
        <div className="card h-28 bg-slate-100" />
        <div className="card h-28 bg-slate-100" />
      </div>
      <div className="card h-96 bg-slate-100" />
    </div>
  );
}
