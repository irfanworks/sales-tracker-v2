"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { DashboardNav } from "@/components/DashboardNav";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileMoreSheet } from "@/components/MobileMoreSheet";
import type { User as AuthUser } from "@supabase/supabase-js";

interface Profile {
  role: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
}

export function DashboardShell({
  user,
  profile,
  children,
}: {
  user: AuthUser;
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMoreOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const displayName =
    profile?.display_name || profile?.full_name || profile?.email || user.email || "User";

  return (
    <div className="min-h-screen app-shell-bg">
      <Header user={user} profile={profile ?? undefined} />

      <div className="flex">
        <aside className="hidden w-[var(--sidebar-width)] shrink-0 bg-sidebar lg:sticky lg:top-[calc(var(--header-height)+env(safe-area-inset-top,0px))] lg:block lg:h-[calc(100vh-var(--header-height)-env(safe-area-inset-top,0px))] lg:overflow-y-auto lg:border-r lg:border-white/[0.06] scrollbar-thin">
          <DashboardNav role={profile?.role ?? "sales"} />
        </aside>

        <main className="main-view-transition min-w-0 flex-1 overflow-x-clip pb-bottom-nav">
          <div className="page-container px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">{children}</div>
        </main>
      </div>

      <MobileBottomNav onMoreClick={() => setMoreOpen(true)} />
      <MobileMoreSheet
        open={moreOpen}
        onClose={closeMore}
        displayName={displayName}
        profile={profile}
      />
    </div>
  );
}
