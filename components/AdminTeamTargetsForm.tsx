"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatNumberAsThousands, formatThousandsInput, parseThousandsInput } from "@/lib/formatThousands";

type TeamMember = {
  id: string;
  display_name: string;
  role: "admin" | "sales";
  annual_sales_target: number | null;
};

export function AdminTeamTargetsForm({ members }: { members: TeamMember[] }) {
  const router = useRouter();
  const [targets, setTargets] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((m) => [m.id, formatNumberAsThousands(m.annual_sales_target)]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const companyTotal = useMemo(() => {
    return members.reduce((sum, m) => {
      const n = parseThousandsInput(targets[m.id] ?? "");
      return sum + (n ?? 0);
    }, 0);
  }, [members, targets]);

  function setTarget(id: string, raw: string) {
    setTargets((prev) => ({ ...prev, [id]: formatThousandsInput(raw) }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const updates: { id: string; annual_sales_target: number | null }[] = [];
    for (const m of members) {
      const display = targets[m.id] ?? "";
      if (display.trim()) {
        const n = parseThousandsInput(display);
        if (n == null || n < 0) {
          setLoading(false);
          setError(`Invalid target for ${m.display_name}.`);
          return;
        }
        updates.push({ id: m.id, annual_sales_target: n });
      } else {
        updates.push({ id: m.id, annual_sales_target: null });
      }
    }

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_update_annual_sales_targets", {
      p_updates: updates,
    });

    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">
        Set each user&apos;s annual sales target (IDR). The company target on Dashboard (All users)
        is the sum of every user&apos;s target.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Annual sales target (IDR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id} className="bg-white">
                <td className="px-4 py-3 font-medium text-slate-800">{m.display_name}</td>
                <td className="px-4 py-3 capitalize text-slate-500">{m.role}</td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targets[m.id] ?? ""}
                    onChange={(e) => setTarget(m.id, e.target.value)}
                    className="input-field max-w-xs tabular-nums"
                    placeholder="e.g. 5,000,000,000"
                    aria-label={`Annual target for ${m.display_name}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-slate-800">
                Company total
              </td>
              <td className="px-4 py-3 text-sm font-bold tabular-nums text-cyan-800">
                {formatNumberAsThousands(companyTotal) || "0"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Team targets saved successfully.</p>}

      <button type="submit" className="btn-primary gap-2" disabled={loading || members.length === 0}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save team targets
      </button>
    </form>
  );
}
