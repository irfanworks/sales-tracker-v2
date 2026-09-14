import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
};

/**
 * Refresh the Auth session and forward Set-Cookie (+ cache headers) on the response.
 * Never force httpOnly on every cookie — @supabase/ssr sets per-cookie flags.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const applyNoStore = () => {
    Object.entries(NO_STORE_HEADERS).forEach(([key, value]) => {
      supabaseResponse.headers.set(key, value);
    });
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
          headers?: Record<string, string>
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          // Apply library-provided cache headers on token refresh (ssr >= 0.10)
          Object.entries(headers ?? NO_STORE_HEADERS).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    }
  );

  // Always refresh session so Server Actions / browser stay in sync
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Gate dashboard + API at the edge (defense in depth; layouts/routes still check)
  if (!user && path.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url);
    Object.entries(NO_STORE_HEADERS).forEach(([key, value]) => {
      redirect.headers.set(key, value);
    });
    return redirect;
  }

  if (!user && path.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    Object.entries(NO_STORE_HEADERS).forEach(([key, value]) => {
      redirect.headers.set(key, value);
    });
    return redirect;
  }

  // Dashboard + login must never be CDN/browser-cached with stale auth cookies
  if (
    path.startsWith("/dashboard") ||
    path === "/login" ||
    path.startsWith("/api/")
  ) {
    applyNoStore();
  }

  return supabaseResponse;
}
