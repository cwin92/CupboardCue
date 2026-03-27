"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, ListChecks, ScrollText, Settings } from "lucide-react";

import { cx } from "@/lib/utils";

const links = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/library", label: "Library", icon: ScrollText },
  { href: "/app/shopping-list", label: "List", icon: ListChecks },
  { href: "/app/planner", label: "Plan", icon: CalendarDays },
  { href: "/app/settings", label: "Settings", icon: Settings }
];

export function BottomNav({ pathname }: { pathname: string }) {
  const currentPath = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {links.map((link) => {
        const Icon = link.icon;
        const resolvedPath = currentPath || pathname;
        const active = resolvedPath === link.href || (link.href !== "/app" && resolvedPath.startsWith(link.href));

        return (
          <Link key={link.href} href={link.href} className={cx("bottom-nav-link", active && "active")}>
            <Icon size={22} strokeWidth={1.75} />
            <span className="bottom-nav-label">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
