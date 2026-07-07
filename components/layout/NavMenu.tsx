"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export interface NavMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface NavMenuProps {
  label: string;
  items: NavMenuItem[];
}

interface SubNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: React.ReactNode;
  active?: boolean;
}

export function SubNavItem({
  href,
  label,
  icon: Icon,
  count,
  active,
}: SubNavItemProps) {
  return (
    <li>
      <NavigationMenuLink
        asChild
        className={cn(
          "flex flex-row items-center gap-3 px-4 py-2.5 border-l-2 border-transparent rounded-none text-popover-foreground hover:text-popover-foreground focus:text-popover-foreground hover:border-flame",
          active && "border-hp"
        )}
      >
        <Link href={href}>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center border-0 rounded-xl bg-muted text-muted-foreground",
              active && "text-hp"
            )}
          >
            <Icon className="size-4" />
          </span>
          <span
            className={cn(
              "flex-1 font-slab",
              active ? "font-extrabold" : "font-bold"
            )}
          >
            {label}
          </span>
          {count !== undefined && (
            <span className="font-slab font-bold text-sm text-muted-foreground">
              {count}
            </span>
          )}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function NavMenu({ label, items }: NavMenuProps) {
  const pathname = usePathname();
  const isActive = items.some((item) => item.href === pathname);

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn(
          "h-16 gap-1.5 rounded-none border-b-2 border-transparent px-3 text-base text-header-foreground hover:text-header-foreground focus:text-header-foreground",
          !isActive && "focus:border-transparent",
          isActive && "border-hp"
        )}
      >
        <span className="font-slab font-bold">{label}</span>
        <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </NavigationMenuTrigger>
      <NavigationMenuContent className="w-80 p-0">
        <ul className="py-1">
          {items.map((item) => (
            <SubNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              count={item.count ?? "–"}
              active={pathname === item.href}
            />
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
