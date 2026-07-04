"use client";

import { ViewTransitionProvider } from "@/components/ViewTransitionProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ViewTransitionProvider>{children}</ViewTransitionProvider>;
}
