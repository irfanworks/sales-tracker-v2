"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Users, PlusCircle, Settings, ClipboardList, BarChart3 } from "lucide-react";

const navItemsAll = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/projects/new", label: "New Project", icon: PlusCircle },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/bd-updates", label: "BD Updates", icon: ClipboardList },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const navItemsAdmin = [
  { href: "/dashboard/admin/bd-monitoring", label: "BD Monitoring", icon: BarChart3 },
];

export function DashboardNav({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isAdmin = role === "admin";
  const navItems = [...navItemsAll, ...(isAdmin ? navItemsAdmin : [])];

  return (
    <nav className="p-4">
      <ul className="space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-cyan-50 text-cyan-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
