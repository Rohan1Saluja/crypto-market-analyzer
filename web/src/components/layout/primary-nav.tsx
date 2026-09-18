"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const liveItems = [
  { label: "Markets", href: "/" },
  { label: "Research", href: "/research" },
];

const upcomingItems = [
  { label: "Exposure", phase: "Phase 3B" },
  { label: "Signals", phase: "Monitor phase" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/research") {
    return pathname === "/research" || pathname.startsWith("/coin/");
  }

  return pathname.startsWith(href);
}

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center rounded-xl border border-white/[0.06] bg-white/[0.022] p-1 md:flex"
      aria-label="Primary navigation"
    >
      {liveItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-lg bg-white/[0.075] px-3 py-1.5 text-[11px] font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.035] hover:text-foreground"
            }
          >
            {item.label}
          </Link>
        );
      })}

      {upcomingItems.map((item) => (
        <span
          key={item.label}
          aria-disabled="true"
          title={`${item.label} is planned for ${item.phase}`}
          className="cursor-not-allowed rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground/45"
        >
          {item.label}
        </span>
      ))}
    </nav>
  );
}
