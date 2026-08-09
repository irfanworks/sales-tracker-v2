import type { LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  if (href === "/dashboard/pipeline") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) && !pathname.startsWith(`${href}/new`))
    );
  }
  if (href === "/dashboard/prospects") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) && !pathname.startsWith(`${href}/new`))
    );
  }
  return pathname.startsWith(href);
}

/** Routes that belong under the More sheet (not a primary tab). */
export const mobileMoreRoutes = [
  "/dashboard/sales-activity",
  "/dashboard/pipeline/new",
  "/dashboard/prospects/new",
  "/dashboard/settings",
] as const;

export function isMobileMoreRoute(pathname: string): boolean {
  return mobileMoreRoutes.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  );
}
