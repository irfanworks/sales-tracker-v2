import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only auth-sensitive routes — skip marketing static cost and random paths
  matcher: ["/", "/login", "/dashboard/:path*", "/api/:path*"],
};
