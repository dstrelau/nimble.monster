"use client";

import {
  BookOpen,
  type LucideIcon,
  Menu,
  SquarePen,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Logo } from "@/components/app/Logo";
import { MobileMenuDropdown } from "@/components/app/MobileMenuDropdown";
import { ModeToggle } from "@/components/app/ModeToggle";
import { UserAvatar } from "@/components/app/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useOfficialOnly } from "@/lib/hooks/useOfficialOnly";
import type { User } from "@/lib/types";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";
import { cn } from "@/lib/utils";
import { getUserUrl } from "@/lib/utils/url";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  hideOfficial?: boolean;
};

const BROWSE_CREATURES_ITEMS: NavItem[] = [
  { href: "/monsters", label: "Monsters", icon: ENTITY_TYPE_ICONS.monster },
  {
    href: "/companions",
    label: "Companions",
    icon: ENTITY_TYPE_ICONS.companion,
    hideOfficial: true,
  },
  {
    href: "/items",
    label: "Items",
    icon: ENTITY_TYPE_ICONS.item,
    hideOfficial: true,
  },
  {
    href: "/collections",
    label: "Collections",
    icon: ENTITY_TYPE_ICONS.collection,
    hideOfficial: true,
  },
  { href: "/reference", label: "Rules", icon: BookOpen },
];

const BROWSE_CHARACTER_ITEMS: NavItem[] = [
  {
    href: "/ancestries",
    label: "Ancestries",
    icon: ENTITY_TYPE_ICONS.ancestry,
  },
  {
    href: "/backgrounds",
    label: "Backgrounds",
    icon: ENTITY_TYPE_ICONS.background,
  },
  { href: "/classes", label: "Classes", icon: ENTITY_TYPE_ICONS.class },
  {
    href: "/subclasses",
    label: "Subclasses",
    icon: ENTITY_TYPE_ICONS.subclass,
  },
  { href: "/spell-schools", label: "Spells", icon: ENTITY_TYPE_ICONS.school },
];

const MY_ITEMS = [
  { href: "/my/monsters", label: "Monsters", icon: ENTITY_TYPE_ICONS.monster },
  {
    href: "/my/ancestries",
    label: "Ancestries",
    icon: ENTITY_TYPE_ICONS.ancestry,
  },
  {
    href: "/my/companions",
    label: "Companions",
    icon: ENTITY_TYPE_ICONS.companion,
  },
  {
    href: "/my/backgrounds",
    label: "Backgrounds",
    icon: ENTITY_TYPE_ICONS.background,
  },
  { href: "/my/items", label: "Items", icon: ENTITY_TYPE_ICONS.item },
  { href: "/my/classes", label: "Classes", icon: ENTITY_TYPE_ICONS.class },
  {
    href: "/my/collections",
    label: "Collections",
    icon: ENTITY_TYPE_ICONS.collection,
  },
  {
    href: "/my/subclasses",
    label: "Subclasses",
    icon: ENTITY_TYPE_ICONS.subclass,
  },
  { href: "/my/families", label: "Families", icon: ENTITY_TYPE_ICONS.family },
  {
    href: "/my/spell-schools",
    label: "Spells",
    icon: ENTITY_TYPE_ICONS.school,
  },
];

const UserAvatarButton = ({
  user,
  onClick,
}: {
  user?: User;
  onClick?: () => void;
}) => (
  <Button
    variant="ghost"
    size="icon"
    className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white bg-transparent p-2 rounded-full"
    onClick={onClick}
  >
    <UserAvatar user={user} size="md" />
  </Button>
);

const Header = () => {
  const officialOnly = useOfficialOnly();
  const { data: session } = useSession();
  const currentUser = session?.user;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  const profileItem = currentUser
    ? {
        href: currentUser.username ? getUserUrl(currentUser) : "#",
        label: "View Profile",
        isActive: currentUser.username
          ? pathname === getUserUrl(currentUser)
          : false,
        icon: UserIcon,
      }
    : null;

  const handleSignOut = () => signOut({ redirectTo: "/" });
  const handleSignIn = () => signIn("discord", { redirectTo: "/my/monsters" });

  const siteName = officialOnly ? "Nimblenomi.com" : "Nimble Nexus";

  const filterNav = (items: NavItem[]) =>
    officialOnly ? items.filter((i) => !i.hideOfficial) : items;

  const browseCreatures = filterNav(BROWSE_CREATURES_ITEMS);
  const browseCharacters = filterNav(BROWSE_CHARACTER_ITEMS);
  const allBrowse = [...browseCreatures, ...browseCharacters];

  return (
    <nav className="p-0 shadow-sm bg-header text-header-foreground">
      <div
        className={cn(
          "mx-auto max-w-7xl w-full px-4 flex justify-between items-center h-16",
          officialOnly && "gap-8 justify-start"
        )}
      >
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
        <Logo showText={true} className="hidden md:flex" siteName={siteName} />
        {/* Mobile logo (center) */}
        <Logo showText={false} className="md:hidden" />

        {/* Desktop navigation (center) */}
        <div
          className={cn(
            "hidden md:flex flex-col items-center gap-1",
            officialOnly && "items-start"
          )}
        >
          <div className="flex gap-x-6">
            {browseCreatures.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 hover:text-flame",
                  pathname === item.href && "text-flame"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-x-6">
            {browseCharacters.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 hover:text-flame",
                  pathname === item.href && "text-flame"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop User menu */}
        {!officialOnly && (
          <div className="hidden md:flex items-center gap-2">
            {currentUser ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white bg-transparent p-2 rounded-full"
                  >
                    <UserAvatar user={currentUser} size="md" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="p-1">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/create"
                        className={cn("flex justify-center items-center gap-1")}
                      >
                        <SquarePen className="size-4" />
                        Create
                      </Link>
                    </DropdownMenuItem>
                    <Separator className="my-1" />
                    {profileItem && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            href={profileItem.href}
                            className={cn(
                              "flex justify-center items-center gap-1",
                              profileItem.isActive && "font-bold bg-accent"
                            )}
                          >
                            <profileItem.icon className="size-4" />
                            {profileItem.label}
                          </Link>
                        </DropdownMenuItem>
                        <Separator className="my-1" />
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-1">
                      {MY_ITEMS.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex justify-center items-center gap-2 flex-col",
                              pathname === item.href && "font-bold bg-accent"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex text-sm justify-between items-center gap-2 px-2">
                    <ModeToggle className="mt-2 mb-1 items-center" />
                    <Button onClick={handleSignOut}>Logout</Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <UserAvatarButton user={undefined} onClick={handleSignIn} />
            )}
          </div>
        )}

        {/* Mobile User menu */}
        {!officialOnly && (
          <div className="md:hidden flex items-center gap-2">
            {currentUser ? (
              <UserAvatarButton
                user={currentUser}
                onClick={() => {
                  setMobileUserMenuOpen(!mobileUserMenuOpen);
                  setMobileMenuOpen(false);
                }}
              />
            ) : (
              <UserAvatarButton user={undefined} onClick={handleSignIn} />
            )}
          </div>
        )}
      </div>

      {/* Mobile menu dropdowns */}
      <MobileMenuDropdown
        isOpen={mobileMenuOpen}
        links={allBrowse.map((link) => ({
          ...link,
          onClick: () => setMobileMenuOpen(false),
        }))}
      />

      {!officialOnly && (
        <MobileMenuDropdown
          isOpen={mobileUserMenuOpen && !!currentUser}
          links={[
            {
              href: "/create",
              label: "Create",
              onClick: () => setMobileUserMenuOpen(false),
            },
            ...(profileItem
              ? [
                  {
                    ...profileItem,
                    onClick: () => setMobileUserMenuOpen(false),
                  },
                ]
              : []),
            ...MY_ITEMS.map((item) => ({
              ...item,
              isActive: pathname === item.href,
              onClick: () => setMobileUserMenuOpen(false),
            })),
          ]}
          buttons={[
            {
              label: "Logout",
              onClick: () => {
                setMobileUserMenuOpen(false);
                handleSignOut();
              },
            },
          ]}
        >
          <ModeToggle />
        </MobileMenuDropdown>
      )}
    </nav>
  );
};

export default Header;
