import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getSupabase = cache(createClient);

export const getAuthUser = cache(async () => {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("role, full_name, display_name, email, annual_sales_target")
    .eq("id", user.id)
    .single();

  return data;
});

export const getSalesOptions = cache(async () => {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, full_name")
    .in("role", ["admin", "sales"])
    .order("display_name");

  return (data ?? []).map((s) => ({
    id: s.id,
    display_name: s.display_name ?? s.full_name ?? s.id.slice(0, 8),
  }));
});

/** Profiles with annual targets (admin+sales). Used for Settings team targets & company sum. */
export const getTeamTargetProfiles = cache(async () => {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, full_name, role, annual_sales_target")
    .in("role", ["admin", "sales"])
    .order("display_name");

  return (data ?? []).map((s) => ({
    id: s.id,
    email: s.email ?? "",
    display_name: s.display_name ?? s.full_name ?? s.id.slice(0, 8),
    role: s.role as "admin" | "sales",
    annual_sales_target:
      s.annual_sales_target != null ? Number(s.annual_sales_target) : null,
  }));
});

/** Sum of all user annual sales targets (company-wide target). */
export function sumCompanyAnnualTarget(
  profiles: Array<{ annual_sales_target: number | null }>
): number | null {
  const total = profiles.reduce((sum, p) => sum + (p.annual_sales_target ?? 0), 0);
  return total > 0 ? total : null;
}
