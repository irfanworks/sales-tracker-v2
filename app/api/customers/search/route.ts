import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getSupabase } from "@/lib/auth";

function sanitize(raw: string | null) {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Authenticated customer typeahead — keeps new pipeline/prospect forms off the
 * full master-customer payload.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = sanitize(request.nextUrl.searchParams.get("q"));
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));
  const id = request.nextUrl.searchParams.get("id")?.trim() || null;

  const supabase = await getSupabase();

  if (id) {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, slug, sector")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[customers-search]", error.message);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
    return NextResponse.json(
      { customers: data ? [data] : [] },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  if (q.length < 1) {
    return NextResponse.json(
      { customers: [] },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, slug, sector")
    .ilike("name", `%${q}%`)
    .order("name")
    .limit(limit);

  if (error) {
    console.error("[customers-search]", error.message);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  return NextResponse.json(
    { customers: data ?? [] },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
