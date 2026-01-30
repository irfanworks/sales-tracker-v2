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

  const displayName = profile?.display_name || profile?.full_name || profile?.email || user.email || "User";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden flex shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt="Enercon Indonesia"
              width={36}
              height={36}
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
            />
            <span className="hidden truncate text-base font-semibold text-slate-800 sm:inline sm:max-w-[180px] lg:max-w-none">
              Enercon Indonesia&apos;s Sales Tracker
            </span>
            <span className="truncate text-base font-semibold text-slate-800 sm:hidden">
              Sales Tracker
            </span>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden max-w-[120px] truncate text-sm text-slate-600 sm:flex sm:max-w-[180px] sm:items-center sm:gap-2 lg:max-w-none">
            <User className="h-4 w-4 shrink-0" />
            {displayName}
            {profile?.role && (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                {profile.role}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-secondary gap-1.5 py-1.5 text-slate-600 sm:gap-2 sm:py-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
