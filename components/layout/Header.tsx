"use client";

import { useQuery } from "@tanstack/react-query";
import { Dices, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getNavCountsAction } from "@/app/actions/nav";
import { CountedNavMenu } from "@/components/layout/CountedNavMenu";
import { Logo } from "@/components/layout/Logo";
import { MobileMenuDropdown } from "@/components/layout/MobileMenuDropdown";
import { NavItem } from "@/components/layout/NavItem";
import {
  MobileSubNavItem,
  type NavMenuItem,
} from "@/components/layout/NavMenu";
import { UserNavItem } from "@/components/layout/UserNavItem";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import type {
  AdventureCounts,
  BestiaryCounts,
  CharacterOptionCounts,
  GearCounts,
  RuleCounts,
} from "@/lib/db";
import {
  ENTITY_TYPE_ICONS,
  SITE_NAVIGATION_GROUPS,
  type SiteNavigationItemKey,
} from "@/lib/types/entity-links";

export type AllNavCounts = BestiaryCounts &
  CharacterOptionCounts &
  GearCounts &
  AdventureCounts &
  RuleCounts;

interface HeaderProps {
  initialCounts: AllNavCounts;
}

const HEADER_ITEM_CONFIG: Record<
  SiteNavigationItemKey,
  { href: string; countKey?: keyof AllNavCounts }
> = {
  monsters: { href: "/monsters", countKey: "monsters" },
  hazards: { href: "/hazards", countKey: "hazards" },
  companions: { href: "/companions", countKey: "companions" },
  ancestries: { href: "/ancestries", countKey: "ancestries" },
  backgrounds: { href: "/backgrounds", countKey: "backgrounds" },
  classes: { href: "/classes", countKey: "classes" },
  subclasses: { href: "/subclasses", countKey: "subclasses" },
  "spell-schools": { href: "/spell-schools", countKey: "spellSchools" },
  items: { href: "/items", countKey: "items" },
  adventures: { href: "/adventures", countKey: "adventures" },
  encounters: { href: "/encounters", countKey: "encounters" },
  rules: { href: "/rules", countKey: "rules" },
};

const UTILITY_ITEMS: NavMenuItem[] = [
  {
    href: "/collections",
    label: "Collections",
    icon: ENTITY_TYPE_ICONS.collection,
  },
];

const NAV_GROUPS: {
  label: string;
  items: (Omit<NavMenuItem, "count"> & { countKey?: keyof AllNavCounts })[];
}[] = SITE_NAVIGATION_GROUPS.map((group) => ({
  label: group.label,
  items: [
    ...group.items.map((item) => ({
      ...item,
      ...HEADER_ITEM_CONFIG[item.key],
    })),
    ...(group.label === "Play"
      ? [{ href: "/roll", label: "Dice Roller", icon: Dices }]
      : []),
  ],
}));

const Header = ({ initialCounts }: HeaderProps) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { data: counts } = useQuery({
    queryKey: ["nav-counts"],
    queryFn: getNavCountsAction,
    initialData: initialCounts,
    staleTime: 60_000,
  });

  return (
    <nav className="relative p-0 shadow-sm bg-header text-header-foreground print:hidden">
      <div className="mx-auto max-w-7xl w-full px-4 flex justify-between items-center h-16">
        {/* Mobile left menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            setAccountMenuOpen(false);
          }}
        >
          {mobileMenuOpen ? (
            <X className="h-8 w-8" strokeWidth={4} />
          ) : (
            <Menu className="h-8 w-8" strokeWidth={4} />
          )}
        </Button>

        {/* Desktop logo (left) */}
        <Logo showText={true} className="hidden md:flex" />
        {/* Mobile logo (center) */}
        <Logo showText={false} className="md:hidden" />

        {/* Desktop navigation (center) */}
        <div className="hidden md:flex items-center h-full gap-6">
          <NavigationMenu viewport={false} className="max-w-none flex-none">
            <NavigationMenuList className="gap-2">
              {NAV_GROUPS.map((group) => (
                <CountedNavMenu
                  key={group.label}
                  label={group.label}
                  items={group.items}
                  queryKey="nav-counts"
                  queryFn={getNavCountsAction}
                />
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="h-1/2">
            <Separator orientation="vertical" className="bg-icon h-full" />
          </div>

          <div className="flex items-center h-full">
            {UTILITY_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href}
              />
            ))}
          </div>
        </div>

        <UserNavItem
          open={accountMenuOpen}
          onOpenChange={(open) => {
            setAccountMenuOpen(open);
            if (open) setMobileMenuOpen(false);
          }}
        />
      </div>

      {/* Mobile navigation drawer */}
      <MobileMenuDropdown isOpen={mobileMenuOpen}>
        <div className="space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-1 pb-1.5 font-condensed font-bold text-sm uppercase tracking-wide text-muted-foreground">
                {group.label}
              </div>
              <ul className="rounded-md border border-border bg-popover overflow-hidden">
                {group.items.map((item) => (
                  <MobileSubNavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    count={
                      item.countKey
                        ? (counts?.[item.countKey] ?? "–")
                        : undefined
                    }
                    active={pathname === item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </ul>
            </div>
          ))}
          <ul className="rounded-md border border-border bg-popover overflow-hidden">
            {UTILITY_ITEMS.map((item) => (
              <MobileSubNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
          </ul>
        </div>
      </MobileMenuDropdown>
    </nav>
  );
};

export default Header;
