import "server-only";
import { createClient } from "@supabase/supabase-js";
import { runtimeEnv } from "@/lib/serverEnv";

/** Service-role client — server-only. Never import from client components. */
export function createAdminClient() {
  const url = runtimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    runtimeEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    runtimeEnv("SUPABSE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error(
      `Missing ${
        !key ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_URL"
      } in this Vercel project (url ${url ? "ok" : "missing"}, service role ${
        key ? "ok" : "missing"
      }). Add the key to BOTH projects (sales-tracker and sales-tracker-v2.1), turn Sensitive OFF, environment Production, then Redeploy.`
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
