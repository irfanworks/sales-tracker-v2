
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

interface Update {
  id: string;
  content: string;
  created_at: string;
  created_by?: string | null;
}

export function ProjectUpdateHistory({ updates }: { updates: Update[] }) {
  if (updates.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-500">No updates yet. Add one above.</p>
    );
  }

  return (
    <ul className="mt-4 space-y-4">
      {updates.map((u) => (
        <li
          key={u.id}
          className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
        >
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{u.content}</p>
              <p className="mt-2 text-xs text-slate-500">
                {format(new Date(u.created_at), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
