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
    const handler = () => {
      if (window.innerWidth >= 1024) setNavOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="min-h-screen app-shell-bg">
      <Header user={user} profile={profile ?? undefined} onMenuClick={() => setNavOpen(true)} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 bg-sidebar lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-r lg:border-sidebar-border scrollbar-thin">
          <DashboardNav role={profile?.role ?? "sales"} variant="sidebar" />
        </aside>

        {/* Mobile drawer overlay */}
        {navOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm animate-fade-in lg:hidden"
            aria-hidden
            onClick={() => setNavOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[min(18rem,85vw)] transform border-r border-slate-200 bg-white shadow-elevated transition-transform duration-300 ease-out lg:hidden ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
            <span className="text-sm font-semibold text-slate-800">Menu</span>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto p-3 scrollbar-thin">
            <DashboardNav
              role={profile?.role ?? "sales"}
              onNavigate={() => setNavOpen(false)}
              variant="drawer"
            />
          </div>
        </aside>

        <main className="main-view-transition min-w-0 flex-1">
          <div className="page-container p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
