import { createClient } from "@supabase/supabase-js";

/**
 * Accepted names for the service-role secret.
 * The second name matches the misspelling currently saved in Vercel.
 */
const SERVICE_ROLE_ENV_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABSE_SERVICE_ROLE_KEY",
] as const;

function readServerEnv(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string") return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

/** Service-role client — server-only. Never import from client components. */
export function createAdminClient() {
  const url = readServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = SERVICE_ROLE_ENV_NAMES.map(readServerEnv).find(Boolean) ?? "";
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in Vercel → Environment Variables (exact name), then Redeploy. Locally, add it to .env.local and restart the dev server."
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
