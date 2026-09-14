"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isInternalLink,
  isModifiedClick,
  startViewTransition,
} from "@/lib/viewTransition";

/**
 * Progressive enhancement for same-origin navigations.
 * Disabled in development — View Transitions + Turbopack HMR has caused
 * browser freezes / high CPU on some machines.
 */
export function ViewTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || !isInternalLink(anchor)) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      try {
        const next = new URL(href, window.location.href);
        const current = new URL(window.location.href);
        if (next.pathname === current.pathname && next.search === current.search) {
          return;
        }
        // Only enhance in-app dashboard navigations
        if (!next.pathname.startsWith("/dashboard") && next.pathname !== "/") {
          return;
        }
      } catch {
        return;
      }

      event.preventDefault();
      startViewTransition(() => {
        router.push(href);
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [router, pathname]);

  return children;
}
