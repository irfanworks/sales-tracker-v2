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
    const handler = () => setNavOpen(false);
    window.addEventListener("resize", handler);
    if (window.innerWidth >= 1024) setNavOpen(false);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} profile={profile ?? undefined} onMenuClick={() => setNavOpen(true)} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white lg:block">
          <DashboardNav role={profile?.role ?? "sales"} />
        </aside>

        {/* Mobile drawer overlay */}
        {navOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
            aria-hidden
            onClick={() => setNavOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-end border-b border-slate-200 px-4">
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="rounded p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto p-4">
            <DashboardNav role={profile?.role ?? "sales"} onNavigate={() => setNavOpen(false)} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
