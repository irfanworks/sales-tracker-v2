"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  FolderPlus,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/types/database";

interface DashboardNavProps {
  userEmail: string;
  userDisplayName?: string | null;
  role: UserRole;
}

export function DashboardNav({ userEmail, userDisplayName, role }: DashboardNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-slate-800 hover:text-primary-700"
          >
            Sales Tracker
          </Link>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <nav
            className={`absolute md:static top-14 left-0 right-0 bg-white md:bg-transparent border-b md:border-0 border-slate-200 md:flex items-center gap-1 ${
              menuOpen ? "block" : "hidden md:flex"
            }`}
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-3 md:py-2 md:px-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-4 py-3 md:py-2 md:px-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              <FolderPlus className="h-4 w-4" />
              Project Baru
            </Link>
            <Link
              href="/customers"
              className="flex items-center gap-2 px-4 py-3 md:py-2 md:px-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              <Users className="h-4 w-4" />
              Customers
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-3 md:py-2 md:px-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Pengaturan
            </Link>
            <div className="md:ml-4 md:pl-4 md:border-l border-slate-200 flex flex-col md:flex-row md:items-center gap-2 px-4 py-3 md:py-0">
              <span className="text-sm text-slate-500 md:mr-2">
                {userDisplayName?.trim() || userEmail}
                <span className="ml-1.5 text-primary-600 font-medium">
                  ({role})
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 font-medium text-left"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
