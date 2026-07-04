"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Clock,
  Loader2,
  MessageSquarePlus,
  ScrollText,
  Sparkles,
  User,
} from "lucide-react";

export type ProjectUpdateEntry = {
  id: string;
  content: string;
  created_at: string;
  created_by?: string | null;
  author_name?: string | null;
};

export function ProjectUpdatesSection({
  projectId,
  updates: initialUpdates,
  projectCreatedAt,
}: {
  projectId: string;
  updates: ProjectUpdateEntry[];
  projectCreatedAt: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...initialUpdates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const oldestId =
    initialUpdates.length > 0
      ? [...initialUpdates].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0]?.id
      : null;

  const lastUpdated = sorted[0]?.created_at ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const trimmed = content.trim();
    const { error: insertError } = await supabase.from("project_updates").insert({
      project_id: projectId,
      content: trimmed,
      created_by: user?.id ?? null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await supabase.from("projects").update({ weekly_update: trimmed }).eq("id", projectId);

    setContent("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="card-elevated overflow-hidden">
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-cyan-50/40 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              <ScrollText className="h-5 w-5 text-cyan-700" />
              Project updates
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete audit trail for management monitoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80">
              <ScrollText className="h-3.5 w-3.5 text-slate-400" />
              {initialUpdates.length} {initialUpdates.length === 1 ? "entry" : "entries"}
            </span>
            {lastUpdated && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Last {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="project-update-content" className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <MessageSquarePlus className="h-4 w-4 text-cyan-600" />
            Add progress update
          </label>
          <textarea
            id="project-update-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field min-h-[100px] resize-y"
            placeholder="Describe progress, blockers, next steps, or management notes..."
            rows={4}
            disabled={loading}
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary gap-2" disabled={loading || !content.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
            Publish update
          </button>
        </form>
      </div>

      <div className="p-4 sm:p-6">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <ScrollText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No updates documented yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Initial notes from project creation and all follow-ups appear here permanently.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-0">
            {sorted.map((update, index) => {
              const isInitial = update.id === oldestId;
              const isLatest = index === 0;
              const author = update.author_name ?? "Unknown user";

              return (
                <li key={update.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {index < sorted.length - 1 && (
                    <span
                      className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-slate-200"
                      aria-hidden
                    />
                  )}
                  <div
                    className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isLatest
                        ? "bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-md shadow-cyan-900/20"
                        : "bg-slate-100 text-slate-600 ring-2 ring-white"
                    }`}
                  >
                    {sorted.length - index}
                  </div>
                  <article className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {author}
                        </span>
                        {isInitial && (
                          <span className="badge border border-violet-200 bg-violet-50 text-violet-800">
                            <Sparkles className="mr-1 inline h-3 w-3" />
                            Initial update
                          </span>
                        )}
                        {isLatest && !isInitial && (
                          <span className="badge border border-cyan-200 bg-cyan-50 text-cyan-800">
                            Latest
                          </span>
                        )}
                      </div>
                      <time
                        className="text-xs tabular-nums text-slate-500"
                        dateTime={update.created_at}
                        title={format(new Date(update.created_at), "dd MMM yyyy, HH:mm")}
                      >
                        {format(new Date(update.created_at), "dd MMM yyyy · HH:mm")}
                      </time>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {update.content}
                    </p>
                    {isInitial &&
                      Math.abs(
                        new Date(update.created_at).getTime() - new Date(projectCreatedAt).getTime()
                      ) < 120000 && (
                        <p className="mt-2 text-xs text-slate-400">Recorded at project creation</p>
                      )}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
