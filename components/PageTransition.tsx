"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supportsViewTransitions } from "@/lib/viewTransition";

/**
 * Fallback stagger only when the browser lacks View Transitions —
 * avoids double-animating (VT + remount stagger) on modern Chrome/Safari.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [useStagger, setUseStagger] = useState(false);

  useEffect(() => {
    setUseStagger(!supportsViewTransitions());
  }, []);

  if (!useStagger) {
    return <div className="page-transition-root">{children}</div>;
  }

  return (
    <div key={pathname} className="page-transition-root">
      <div className="page-stagger">{children}</div>
    </div>
  );
}
