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
    .select("role, full_name, display_name, email")
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
