"use client";

import { ChevronDown, Library } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { MyLibraryCounts } from "@/lib/db/my-library";
import { MY_LIBRARY_GROUPS } from "@/lib/types/entity-links";
import { cn } from "@/lib/utils";

interface MyLibrarySidebarProps {
  counts: MyLibraryCounts;
  profileHref?: string;
  title?: string | null;
}

interface LibraryNavigationProps extends MyLibrarySidebarProps {
  onNavigate?: () => void;
}

function LibraryNavigation({
  counts,
  profileHref,
  onNavigate,
}: LibraryNavigationProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      {MY_LIBRARY_GROUPS.map((group, index) => (
        <section
          key={group.label ?? "collections"}
          className={cn(index > 0 && !group.label && "border-t pt-5")}
        >
          {group.label && (
            <h2 className="mb-1.5 px-2 font-condensed text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </h2>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = profileHref
                ? `${profileHref}/${item.key}`
                : item.href;
              const active = profileHref
                ? pathname === href
                : pathname === item.href;

              return (
                <li key={item.key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      active &&
                        "border-border bg-accent text-accent-foreground shadow-xs"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground group-hover:text-primary",
                        active && "text-primary"
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {counts[item.key]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function MyLibrarySidebar({
  counts,
  profileHref,
  title = "My Library",
}: MyLibrarySidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeItem = MY_LIBRARY_GROUPS.flatMap((group) => group.items).find(
    (item) =>
      profileHref
        ? pathname === `${profileHref}/${item.key}`
        : item.href === pathname
  );
  const navigationLabel = profileHref
    ? "Public library sidebar"
    : "My library sidebar";

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          {title && (
            <div className="mb-5">
              <span className="flex items-center gap-2 font-slab text-xl font-bold">
                <Library className="size-5 text-primary" />
                {title}
              </span>
            </div>
          )}
          <nav aria-label={navigationLabel}>
            <LibraryNavigation counts={counts} profileHref={profileHref} />
          </nav>
        </div>
      </aside>

      <Collapsible
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        className="lg:hidden"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="group h-auto w-full justify-start bg-card px-4 py-3 text-left"
          >
            <Library className="size-5 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block font-slab font-bold">
                {title ?? activeItem?.label ?? "Library"}
              </span>
              {title && activeItem && (
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {activeItem.label}
                </span>
              )}
            </span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <nav
            aria-label={profileHref ? "Public library menu" : "My library menu"}
            className="mt-2 rounded-lg border bg-card p-4 shadow-sm"
          >
            <LibraryNavigation
              counts={counts}
              profileHref={profileHref}
              onNavigate={() => setMobileOpen(false)}
            />
          </nav>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
