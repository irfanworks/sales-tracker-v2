import "server-only";

/**
 * Read a server env var at request time.
 * Avoid `process.env.SOME_KEY` (static access): Next.js inlines that at
 * build time, and Vercel Sensitive variables are blank during build.
 */
export function runtimeEnv(name: string): string {
  const fromGlobal = globalThis.process?.env?.[name];
  const fromProcess = process.env[name];
  const value = fromGlobal ?? fromProcess ?? "";
  return String(value).trim().replace(/^["']|["']$/g, "");
}
