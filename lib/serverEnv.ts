import "server-only";
import { env as nodeEnv } from "node:process";

/**
 * Read from Node's real process.env.
 * Next/Turbopack rewrites `process.env.SOME_KEY` at build time; Vercel
 * Sensitive values are empty then, so those lookups compile to "".
 */
export function runtimeEnv(name: string): string {
  const value = nodeEnv[name];
  if (typeof value !== "string") return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

const SERVICE_ROLE_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABSE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_KEY",
] as const;

export function getServiceRoleKey(): string {
  for (const name of SERVICE_ROLE_NAMES) {
    const value = runtimeEnv(name);
    if (value) return value;
  }

  for (const [name, value] of Object.entries(nodeEnv)) {
    if (!value) continue;
    const normalized = name.toUpperCase().replace(/-/g, "_");
    if (
      normalized.includes("SERVICE_ROLE") ||
      normalized === "SUPABASE_SECRET_KEY" ||
      normalized === "SUPABASE_SERVICE_KEY"
    ) {
      return String(value).trim().replace(/^["']|["']$/g, "");
    }
  }

  return "";
}

/** Env key names only (never values) for admin diagnostics. */
export function supabaseRelatedEnvNames(): string[] {
  return Object.keys(nodeEnv)
    .filter((name) => /supabase|service_role/i.test(name))
    .sort();
}
