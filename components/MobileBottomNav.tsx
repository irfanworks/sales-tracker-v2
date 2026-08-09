"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Target,
  MoreHorizontal,
} from "lucide-react";
import { isMobileMoreRoute, isNavActive } from "@/lib/nav";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: FolderKanban },
  { href: "/dashboard/prospects", label: "Prospects", icon: Target },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
] as const;

export function MobileBottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname() ?? "";
  const moreActive = isMobileMoreRoute(pathname);

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav__inner">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className="bottom-nav__tab"
              data-active={active ? "true" : "false"}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="bottom-nav__icon" strokeWidth={active ? 2.25 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="bottom-nav__tab"
          data-active={moreActive ? "true" : "false"}
          aria-haspopup="dialog"
          onClick={onMoreClick}
        >
          <MoreHorizontal className="bottom-nav__icon" strokeWidth={moreActive ? 2.25 : 1.75} />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
