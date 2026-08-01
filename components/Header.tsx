"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogOut, User, Menu } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";

interface Profile {
  role: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
}

interface HeaderProps {
  user: AuthUser;
  profile?: Profile;
  onMenuClick?: () => void;
}

export function Header({ user, profile, onMenuClick }: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const displayName =
    profile?.display_name || profile?.full_name || profile?.email || user.email || "User";

  return (
    <header className="glass-header sticky top-0 z-20">
      <div className="flex h-14 items-center justify-between gap-3 px-3 sm:h-16 sm:px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="flex shrink-0 rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
            <Image
              src="/logo.png"
              alt="Enercon Indonesia"
              width={40}
              height={40}
              className="h-8 w-8 object-contain sm:h-9 sm:w-9"
              priority
            />
            <div className="min-w-0 leading-tight">
              <span className="hidden truncate text-sm font-bold tracking-tight text-slate-900 sm:block lg:text-base">
                Enercon Sales Tracker
              </span>
              <span className="truncate text-sm font-bold tracking-tight text-slate-900 sm:hidden">
                Sales Tracker
              </span>
            </div>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200/70 bg-white/80 px-2.5 py-1 sm:flex">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white">
              <User className="h-3 w-3" />
            </div>
            <span className="max-w-[140px] truncate text-[13px] font-medium tracking-tight text-slate-700 lg:max-w-[200px]">
              {displayName}
            </span>
            {profile?.role && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {profile.role}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-ghost gap-1.5 text-slate-600 sm:border sm:border-slate-200 sm:bg-white sm:shadow-sm sm:hover:bg-slate-50"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
