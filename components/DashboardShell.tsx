"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { DashboardNav } from "@/components/DashboardNav";
import type { User as AuthUser } from "@supabase/supabase-js";
import { X } from "lucide-react";

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
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (navOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && navOpen) setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="min-h-screen app-shell-bg">
      <Header user={user} profile={profile ?? undefined} onMenuClick={() => setNavOpen(true)} />

      <div className="flex">
        <aside className="hidden w-[var(--sidebar-width)] shrink-0 bg-sidebar lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:border-r lg:border-white/[0.06] scrollbar-thin xl:top-16 xl:h-[calc(100vh-4rem)]">
          <DashboardNav role={profile?.role ?? "sales"} variant="sidebar" />
        </aside>

        {navOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-[2px] animate-fade-in lg:hidden"
            aria-hidden
            onClick={() => setNavOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[min(17rem,88vw)] transform border-r border-slate-200/80 bg-white shadow-elevated transition-transform duration-200 ease-premium lg:hidden ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal={navOpen}
          aria-label="Navigation"
        >
          <div className="flex h-12 items-center justify-between border-b border-slate-200/80 px-3">
            <span className="text-[13px] font-semibold tracking-tight text-slate-800">Menu</span>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto p-2 scrollbar-thin">
            <DashboardNav
              role={profile?.role ?? "sales"}
              onNavigate={() => setNavOpen(false)}
              variant="drawer"
            />
          </div>
          <p className="absolute bottom-3 left-0 right-0 px-4 text-center text-[10px] text-slate-400">
            Press Esc to close
          </p>
        </aside>

        <main className="main-view-transition min-w-0 flex-1 overflow-x-clip">
          <div className="page-container px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
