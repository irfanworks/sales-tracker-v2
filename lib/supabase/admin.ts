import "server-only";
import { createClient } from "@supabase/supabase-js";
import {
  getServiceRoleKey,
  runtimeEnv,
  supabaseRelatedEnvNames,
} from "@/lib/serverEnv";

/** Service-role client — server-only. Never import from client components. */
export function createAdminClient() {
  const url = runtimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getServiceRoleKey();

  if (!url || !key) {
    const seen = supabaseRelatedEnvNames().join(", ") || "none";
    throw new Error(
      `Missing ${
        !key ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_URL"
      } at Node runtime (url ${url ? "ok" : "missing"}, service role ${
        key ? "ok" : "missing"
      }; supabase env names: ${seen}). Open the Vercel project that owns sales.enercon.id → Settings → Environment Variables, add SUPABASE_SERVICE_ROLE_KEY (Sensitive OFF, Production), then Redeploy.`
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
