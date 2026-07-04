"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isInternalLink,
  isModifiedClick,
  startViewTransition,
} from "@/lib/viewTransition";

export function ViewTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || !isInternalLink(anchor)) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      event.preventDefault();
      startViewTransition(() => {
        router.push(href);
      });
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  return children;
}
