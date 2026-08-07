import { Suspense } from "react";
import { getAuthUser, getProfile, getSalesOptions, getSupabase } from "@/lib/auth";
import { SalesActivityFilters } from "@/components/SalesActivityFilters";
import { SalesActivityFeed } from "@/components/SalesActivityFeed";
import { PageHeader } from "@/components/ui/PageHeader";
import { Activity } from "lucide-react";
import {
  jakartaDateKey,
  jakartaDayBoundsUtc,
  daysAgoJakarta,
} from "@/lib/timezone";

function parseDateOnly(value: string | undefined): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

export default async function SalesActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; sales_id?: string }>;
}) {
  const raw = await searchParams;
  const user = await getAuthUser();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const defaultFrom = daysAgoJakarta(13);
  const defaultTo = jakartaDateKey(new Date());

  const from = parseDateOnly(raw.from) ?? defaultFrom;
  const to = parseDateOnly(raw.to) ?? defaultTo;
  const salesId = isAdmin ? raw.sales_id : user?.id;

  const { startIso } = jakartaDayBoundsUtc(from);
  const { endIso } = jakartaDayBoundsUtc(to);

  const supabase = await getSupabase();
  let query = supabase
    .from("sales_activity_log")
    .select(
      "id, created_at, actor_id, action_type, entity_type, entity_id, entity_label, summary, details"
    )
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(300);

  if (salesId) query = query.eq("actor_id", salesId);

  const [salesOptions, listResult] = await Promise.all([getSalesOptions(), query]);
  const { data: rows, error } = listResult;

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading sales activity: {error.message}</p>
        <p className="mt-2 text-sm text-slate-500">
          Run migration{" "}
          <code className="rounded bg-slate-100 px-1">028_prospect_pic_and_sales_activity.sql</code>{" "}
          in Supabase if the table does not exist yet.
        </p>
      </div>
    );
  }

  const activities = rows ?? [];
  const actorIds = [...new Set(activities.map((a) => a.actor_id))];
  const actorNames: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, full_name")
      .in("id", actorIds);
    (profiles ?? []).forEach((p) => {
      actorNames[p.id] = p.display_name ?? p.full_name ?? "Unknown";
    });
  }

  const feed = activities.map((a) => ({
    ...a,
    actor_name: actorNames[a.actor_id] ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="Sales Activity"
        description={
          isAdmin
            ? "Weekly review feed for Direksi — only real creates and changes (empty saves are ignored). Times in GMT+7 (WIB)."
            : "Your activity log — only when you add or change data. Times in GMT+7 (WIB)."
        }
      />
      <Suspense fallback={<div className="card shimmer h-24 rounded-2xl" />}>
        <SalesActivityFilters
          from={from}
          to={to}
          salesId={isAdmin ? raw.sales_id : undefined}
          salesOptions={salesOptions}
          showSalesFilter={isAdmin}
        />
      </Suspense>
      <p className="text-sm text-slate-500">
        Reviewing{" "}
        <span className="font-semibold text-slate-800">{from}</span>
        {" → "}
        <span className="font-semibold text-slate-800">{to}</span>
        {" · GMT+7"}
        {!isAdmin ? " · your actions only" : ""}.
      </p>
      <SalesActivityFeed activities={feed} />
    </div>
  );
}
