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

type NavItem = { href: string; label: string; icon: LucideIcon };

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

function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  if (href === "/dashboard/pipeline") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) && !pathname.startsWith(`${href}/new`))
    );
  }
  if (href === "/dashboard/prospects") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) && !pathname.startsWith(`${href}/new`))
    );
  }
  return pathname.startsWith(href);
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
  variant = "sidebar",
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onNavigate?: () => void;
  variant?: "sidebar" | "drawer";
}) {
  const baseClass =
    variant === "sidebar"
      ? `nav-link ${isActive ? "nav-link-active" : "nav-link-inactive"}`
      : `relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-150 ${
          isActive
            ? "bg-cyan-50 text-cyan-900"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`;

  return (
    <Link href={href} onClick={onNavigate} className={baseClass} aria-current={isActive ? "page" : undefined}>
      <Icon
        className={`h-4 w-4 shrink-0 ${
          isActive
            ? variant === "sidebar"
              ? "text-cyan-400"
              : "text-cyan-700"
            : "opacity-80"
        }`}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function DashboardNav({
  role,
  onNavigate,
  variant = "sidebar",
}: {
  role: string;
  onNavigate?: () => void;
  variant?: "sidebar" | "drawer";
}) {
  void role;
  const pathname = usePathname();

  return (
    <nav className={variant === "sidebar" ? "flex h-full flex-col px-2.5 py-4" : "p-2"}>
      <div className="flex-1 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <p
              className={`mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                variant === "sidebar" ? "text-slate-500" : "text-slate-400"
              }`}
            >
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
                    variant={variant}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {variant === "sidebar" && (
        <div className="mt-auto border-t border-white/[0.06] px-2.5 pt-4">
          <p className="text-[10px] font-medium tracking-wide text-slate-500">Enercon Indonesia</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Sales monitoring</p>
        </div>
      )}
    </nav>
  );
}
