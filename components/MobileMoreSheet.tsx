"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  LogOut,
  PlusCircle,
  Settings,
  User,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isNavActive } from "@/lib/nav";

interface Profile {
  role: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function MobileMoreSheet({
  open,
  onClose,
  displayName,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  displayName: string;
  profile?: Profile | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/");
    router.refresh();
  }

  if (!mounted || !open) return null;

  const createItems = [
    { href: "/dashboard/pipeline/new", label: "New Pipeline", icon: PlusCircle },
    { href: "/dashboard/prospects/new", label: "New Prospect", icon: PlusCircle },
  ];

  const otherItems = [
    { href: "/dashboard/sales-activity", label: "Sales Activity", icon: Activity },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden" data-more-sheet="true">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] animate-fade-in"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="More"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-elevated animate-slide-up safe-pb"
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-slate-200" aria-hidden />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 icon-btn"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-4 pb-5 pt-1">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              {initials(displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                {displayName}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                {profile?.role && (
                  <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {profile.role}
                  </span>
                )}
                {(profile?.email || displayName) && (
                  <span className="truncate text-xs text-slate-500">
                    {profile?.email ?? ""}
                  </span>
                )}
              </div>
            </div>
            <User className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          </div>

          <div>
            <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Create
            </p>
            <ul className="space-y-0.5">
              {createItems.map(({ href, label, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className="more-sheet-row"
                      data-active={active ? "true" : "false"}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-cyan-700" strokeWidth={1.75} />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Activity &amp; system
            </p>
            <ul className="space-y-0.5">
              {otherItems.map(({ href, label, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className="more-sheet-row"
                      data-active={active ? "true" : "false"}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 ${active ? "text-cyan-700" : "text-slate-500"}`}
                        strokeWidth={1.75}
                      />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="more-sheet-row text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
