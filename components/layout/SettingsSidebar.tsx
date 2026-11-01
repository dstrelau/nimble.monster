"use client";

import { FlaskConical, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SETTINGS_SECTIONS = [
  {
    href: "/my/settings/experiments",
    label: "Experimental Features",
    icon: FlaskConical,
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside>
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm lg:sticky lg:top-6">
        <span className="mb-5 flex items-center gap-2 font-slab text-xl font-bold">
          <Settings className="size-5 text-primary" />
          Settings
        </span>
        <nav aria-label="Settings sidebar">
          <ul className="space-y-0.5">
            {SETTINGS_SECTIONS.map((section) => {
              const active = pathname === section.href;
              return (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      active &&
                        "border-border bg-accent text-accent-foreground shadow-xs"
                    )}
                  >
                    <section.icon
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground group-hover:text-primary",
                        active && "text-primary"
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {section.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
