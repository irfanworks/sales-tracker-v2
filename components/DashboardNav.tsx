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

type NavItem = { href: string; label: string; icon: LucideIcon; group?: "main" | "admin" };

const navItemsBase: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: FolderKanban, group: "main" },
  { href: "/dashboard/pipeline/new", label: "New Pipeline", icon: PlusCircle, group: "main" },
  { href: "/dashboard/prospects", label: "Prospect", icon: Target, group: "main" },
  { href: "/dashboard/prospects/new", label: "New Prospect", icon: PlusCircle, group: "main" },
  { href: "/dashboard/customers", label: "Customers", icon: Users, group: "main" },
  { href: "/dashboard/sales-activity", label: "Sales Activity", icon: Activity, group: "main" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, group: "main" },
];

function buildNavItems(isAdmin: boolean): NavItem[] {
  void isAdmin;
  return navItemsBase;
}

function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  // Avoid /dashboard/pipeline matching /dashboard/pipeline/new
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
      : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-cyan-50 text-cyan-800 shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`;

  return (
    <Link href={href} onClick={onNavigate} className={baseClass}>
      <Icon className={`h-5 w-5 shrink-0 ${isActive && variant === "sidebar" ? "text-cyan-400" : ""}`} />
      <span>{label}</span>
      {isActive && variant === "sidebar" && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden />
      )}
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
  const pathname = usePathname();
  const navItems = buildNavItems(role === "admin");
  const mainItems = navItems.filter((item) => item.group !== "admin");
  const adminItems = navItems.filter((item) => item.group === "admin");

  const renderGroup = (items: NavItem[], title?: string) => (
    <div className="space-y-1">
      {title && variant === "sidebar" && (
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {title}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map(({ href, label, icon }) => (
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
  );

  return (
    <nav className={variant === "sidebar" ? "flex h-full flex-col px-3 py-5" : "p-2"}>
      {variant === "sidebar" && (
        <div className="mb-6 px-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Navigation</p>
        </div>
      )}
      <div className="flex-1 space-y-6">
        {renderGroup(mainItems)}
        {adminItems.length > 0 && renderGroup(adminItems, "Admin")}
      </div>
      {variant === "sidebar" && (
        <div className="mt-auto border-t border-sidebar-border px-3 pt-4">
          <p className="text-[10px] font-medium text-slate-500">Enercon Indonesia</p>
          <p className="text-xs text-slate-600">Sales Pipeline</p>
        </div>
      )}
    </nav>
  );
}
