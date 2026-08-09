"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  PlusCircle,
  Settings,
  Target,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { isNavActive, type NavItem } from "@/lib/nav";

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/sales-activity", label: "Sales Activity", icon: Activity },
    ],
  },
  {
    title: "Work",
    items: [
      { href: "/dashboard/pipeline", label: "Pipeline", icon: FolderKanban },
      { href: "/dashboard/pipeline/new", label: "New Pipeline", icon: PlusCircle },
      { href: "/dashboard/prospects", label: "Prospect", icon: Target },
      { href: "/dashboard/prospects/new", label: "New Prospect", icon: PlusCircle },
      { href: "/dashboard/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "System",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`nav-link ${isActive ? "nav-link-active" : "nav-link-inactive"}`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${isActive ? "text-cyan-400" : "opacity-80"}`}
        style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function DashboardNav({
  role,
  onNavigate,
}: {
  role: string;
  onNavigate?: () => void;
  /** @deprecated drawer removed — more sheet owns mobile secondary nav */
  variant?: "sidebar" | "drawer";
}) {
  void role;
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col px-2.5 py-4">
      <div className="flex-1 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon }) => (
                <li key={href}>
                  <NavLink
                    href={href}
                    label={label}
                    icon={icon}
                    isActive={isNavActive(pathname, href)}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-white/[0.06] px-2.5 pt-4">
        <p className="text-[10px] font-medium tracking-wide text-slate-500">Enercon Indonesia</p>
        <p className="mt-0.5 text-[11px] text-slate-400">Sales monitoring</p>
      </div>
    </nav>
  );
}
