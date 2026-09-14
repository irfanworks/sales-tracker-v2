"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, MessageSquarePlus } from "lucide-react";
import type { ProjectUpdate } from "@/types/database";

interface ProjectUpdatesSectionProps {
  projectId: string;
}

async function getDisplayName(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const name =
    profile?.full_name?.trim() ||
    (user.user_metadata?.full_name as string)?.trim() ||
    "";
  return name || user.email || "";
}

export function ProjectUpdatesSection({ projectId }: ProjectUpdatesSectionProps) {
  const router = useRouter();
  const supabase = createClient();
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUpdate, setNewUpdate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("project_updates")
        .select("id, project_id, update_text, created_at, created_by_name")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setUpdates((data as ProjectUpdate[]) ?? []);
      setLoading(false);
    }
    load();
  }, [projectId]);

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault();
    const text = newUpdate.trim();
    if (!text) return;
    setError(null);
    setSubmitting(true);
    try {
      const displayName = await getDisplayName(supabase);
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from("project_updates").insert({
        project_id: projectId,
        update_text: text,
        created_by: user?.id ?? null,
        created_by_name: displayName || user?.email || null,
      });
      if (insertError) throw insertError;
      setNewUpdate("");
      router.refresh();
      const { data } = await supabase
        .from("project_updates")
        .select("id, project_id, update_text, created_at, created_by_name")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setUpdates((data as ProjectUpdate[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menambah update.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5" />
        Project Update
      </h3>
      <p className="text-sm text-slate-600">
        Sales bisa menambah update kapan saja. Manajemen bisa melacak progress dari waktu ke waktu.
      </p>

      <form onSubmit={handleAddUpdate} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}
        <textarea
          value={newUpdate}
          onChange={(e) => setNewUpdate(e.target.value)}
          rows={3}
          placeholder="Tulis update progress..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        />
        <button
          type="submit"
          disabled={submitting || !newUpdate.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary-700 text-white py-2 px-4 font-medium hover:bg-primary-800 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Tambah Update
        </button>
      </form>

      <div className="border-t border-slate-200 pt-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Riwayat Update</h4>
        {updates.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada update.</p>
        ) : (
          <ul className="space-y-3">
            {updates.map((u) => (
              <li
                key={u.id}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-sm"
              >
                <p className="text-slate-800 whitespace-pre-wrap">{u.update_text}</p>
                <p className="mt-2 text-slate-500 text-xs">
                  {u.created_by_name?.trim() || "—"} ·{" "}
                  {format(new Date(u.created_at), "d MMM yyyy, HH:mm", { locale: id })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
