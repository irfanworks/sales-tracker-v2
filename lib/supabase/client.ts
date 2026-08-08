import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. createBrowserClient already singletons internally;
 * keep this thin so cookie storage stays consistent across the app.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
