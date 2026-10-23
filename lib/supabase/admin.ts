import "server-only";
import { createClient } from "@supabase/supabase-js";

function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

/** Service-role client — server-only. Never import from client components. */
export function createAdminClient() {
  // Next.js only inlines env vars that are referenced as static member access.
  // Dynamic process.env[name] is undefined in production even when Vercel has the key.
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key =
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    // Fallback: misspelled name that was saved in Vercel (SUPABASE → SUPABSE).
    cleanEnv(process.env.SUPABSE_SERVICE_ROLE_KEY);

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY at runtime. Confirm the variable name in Vercel (Production), then Redeploy the latest deployment."
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
