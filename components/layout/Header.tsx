"use client";

import { BookOpen, Menu, Swords } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getNavCountsAction } from "@/app/actions/nav";
import { CountedNavMenu } from "@/components/layout/CountedNavMenu";
import { Logo } from "@/components/layout/Logo";
import { MobileMenuDropdown } from "@/components/layout/MobileMenuDropdown";
import { NavItem } from "@/components/layout/NavItem";
import type { NavMenuItem } from "@/components/layout/NavMenu";
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
} from "@/lib/db";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

const BESTIARY_ITEMS: (Omit<NavMenuItem, "count"> & {
  countKey: keyof BestiaryCounts;
})[] = [
  {
    href: "/monsters",
    label: "Monsters",
    icon: ENTITY_TYPE_ICONS.monster,
    countKey: "monsters",
  },
  {
    href: "/companions",
    label: "Companions",
    icon: ENTITY_TYPE_ICONS.companion,
    countKey: "companions",
  },
];

const BROWSE_CHARACTER_ITEMS: (Omit<NavMenuItem, "count"> & {
  countKey: keyof CharacterOptionCounts;
})[] = [
  {
    href: "/ancestries",
    label: "Ancestries",
    icon: ENTITY_TYPE_ICONS.ancestry,
    countKey: "ancestries",
  },
  {
    href: "/backgrounds",
    label: "Backgrounds",
    icon: ENTITY_TYPE_ICONS.background,
    countKey: "backgrounds",
  },
  {
    href: "/classes",
    label: "Classes",
    icon: ENTITY_TYPE_ICONS.class,
    countKey: "classes",
  },
  {
    href: "/subclasses",
    label: "Subclasses",
    icon: ENTITY_TYPE_ICONS.subclass,
    countKey: "subclasses",
  },
  {
    href: "/spell-schools",
    label: "Spells",
    icon: ENTITY_TYPE_ICONS.school,
    countKey: "spellSchools",
  },
];

const GEAR_ITEMS: (Omit<NavMenuItem, "count"> & {
  countKey: keyof GearCounts;
})[] = [
  {
    href: "/items",
    label: "Items",
    icon: ENTITY_TYPE_ICONS.item,
    countKey: "items",
  },
];

const ADVENTURE_ITEMS: (Omit<NavMenuItem, "count"> & {
  countKey: keyof AdventureCounts;
})[] = [
  {
    href: "/encounters",
    label: "Encounters",
    icon: Swords,
    countKey: "encounters",
  },
];

const UTILITY_ITEMS: NavMenuItem[] = [
  {
    href: "/collections",
    label: "Collections",
    icon: ENTITY_TYPE_ICONS.collection,
  },
  { href: "/reference", label: "Rules", icon: BookOpen },
];

const ALL_BROWSE_ITEMS: NavMenuItem[] = [
  ...BESTIARY_ITEMS,
  ...BROWSE_CHARACTER_ITEMS,
  ...GEAR_ITEMS,
  ...ADVENTURE_ITEMS,
  ...UTILITY_ITEMS,
];

const Header = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

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
            setMobileUserMenuOpen(false);
          }}
        >
          <Menu className="h-8 w-8" />
        </Button>

        {/* Desktop logo (left) */}
        <Logo showText={true} className="hidden md:flex" />
        {/* Mobile logo (center) */}
        <Logo showText={false} className="md:hidden" />

        {/* Desktop navigation (center) */}
        <div className="hidden md:flex items-center h-full gap-6">
          <NavigationMenu viewport={false} className="max-w-none flex-none">
            <NavigationMenuList className="gap-2">
              <CountedNavMenu
                label="Bestiary"
                items={BESTIARY_ITEMS}
                queryKey="nav-counts"
                queryFn={getNavCountsAction}
              />
              <CountedNavMenu
                label="Heroes"
                items={BROWSE_CHARACTER_ITEMS}
                queryKey="nav-counts"
                queryFn={getNavCountsAction}
              />
              <CountedNavMenu
                label="Gear"
                items={GEAR_ITEMS}
                queryKey="nav-counts"
                queryFn={getNavCountsAction}
              />
              <CountedNavMenu
                label="Adventures"
                items={ADVENTURE_ITEMS}
                queryKey="nav-counts"
                queryFn={getNavCountsAction}
              />
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
          mobileMenuOpen={mobileUserMenuOpen}
          onMobileMenuOpenChange={(open) => {
            setMobileUserMenuOpen(open);
            if (open) setMobileMenuOpen(false);
          }}
        />
      </div>

      {/* Mobile browse menu */}
      <MobileMenuDropdown
        isOpen={mobileMenuOpen}
        links={ALL_BROWSE_ITEMS.map((link) => ({
          ...link,
          onClick: () => setMobileMenuOpen(false),
        }))}
      />
    </nav>
  );
};

export default Header;
