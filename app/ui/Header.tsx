"use client";

import {
  Box,
  Ghost,
  HandFist,
  HeartHandshake,
  Menu,
  PersonStanding,
  Shield,
  SquarePen,
  WandSparkles,
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getUserUrl } from "@/lib/utils/url";

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
  const { data: session } = useSession();
  const currentUser = session?.user;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const isCreateActive = () =>
    isActive("/create") ||
    isActive("/monsters/new") ||
    isActive("/companions/new") ||
    isActive("/items/new") ||
    isActive("/spell-schools/new");

  const browseItems = [
    {
      href: "/collections",
      label: "Collections",
      isActive: isActive("/collections"),
      icon: Box,
    },
    {
      href: "/companions",
      label: "Companions",
      isActive: isActive("/companions"),
      icon: HeartHandshake,
    },
    {
      href: "/monsters",
      label: "Monsters",
      isActive: isActive("/monsters"),
      icon: Ghost,
    },
    {
      href: "/items",
      label: "Items",
      isActive: isActive("/items"),
      icon: Shield,
    },
  ];

  const characterItems = [
    {
      href: "/subclasses",
      label: "Subclasses",
      isActive: isActive("/subclasses"),
      icon: HandFist,
    },
    {
      href: "/spell-schools",
      label: "Spells",
      isActive: isActive("/spell-schools"),
      icon: WandSparkles,
    },
  ];

  const isCharacterActive = () =>
    isActive("/subclasses") || isActive("/spell-schools");

  const userMenuItems = currentUser
    ? [
        {
          href: currentUser.username ? getUserUrl(currentUser) : "#",
          label: "View Profile",
          isActive: currentUser.username
            ? isActive(getUserUrl(currentUser))
            : false,
        },
        {
          href: "/my/collections",
          label: "My Collections",
          isActive: isActive("/my/collections"),
        },
        {
          href: "/my/companions",
          label: "My Companions",
          isActive: isActive("/my/companions"),
        },
        {
          href: "/my/families",
          label: "My Families",
          isActive: isActive("/my/families"),
        },
        {
          href: "/my/items",
          label: "My Items",
          isActive: isActive("/my/items"),
        },
        {
          href: "/my/monsters",
          label: "My Monsters",
          isActive: isActive("/my/monsters"),
        },
        {
          href: "/my/spell-schools",
          label: "My Spells",
          isActive: isActive("/my/spell-schools"),
        },
        {
          href: "/my/subclasses",
          label: "My Subclasses",
          isActive: isActive("/my/subclasses"),
        },
      ]
    : [];

  const handleSignOut = () => signOut({ redirectTo: "/" });
  const handleSignIn = () => signIn("discord", { redirectTo: "/my/monsters" });

  return (
    <nav className="p-0 shadow-sm bg-header text-header-foreground">
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
        <NavigationMenu className="hidden md:block" viewport={false}>
          <NavigationMenuList className="gap-4">
            {browseItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink data-active={item.isActive} asChild>
                  <Link
                    href={item.href}
                    className="flex-row items-center gap-1"
                  >
                    <item.icon />
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
            <NavigationMenuItem className="z-10">
              <NavigationMenuTrigger data-active={isCharacterActive()}>
                <PersonStanding />
                Character
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul>
                  {characterItems.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "",
                            item.isActive && "text-flame font-bold"
                          )}
                        >
                          <div className="text-sm font-medium leading-none flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink data-active={isCreateActive()} asChild>
                <Link
                  href="/create"
                  className="px-3 border-2 border-border flex-row items-center gap-1"
                >
                  <SquarePen />
                  Create
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop User menu */}
        <div className="hidden md:flex items-center gap-2">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white bg-transparent p-2 rounded-full"
                >
                  <UserAvatar user={currentUser} size="md" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {userMenuItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(item.isActive && "font-bold bg-accent")}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={handleSignOut}>
                  Logout
                </DropdownMenuItem>
                <Separator />
                <ModeToggle className="mt-2 mb-1 items-center" />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <UserAvatarButton user={undefined} onClick={handleSignIn} />
          )}
        </div>

        {/* Mobile User menu */}
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
      </div>

      {/* Mobile menu dropdowns */}
      <MobileMenuDropdown
        isOpen={mobileMenuOpen}
        links={[
          {
            href: "/create",
            label: "Create",
            isActive: isCreateActive(),
            onClick: () => setMobileMenuOpen(false),
          },
          ...browseItems.map((link) => ({
            ...link,
            onClick: () => setMobileMenuOpen(false),
          })),
          ...characterItems.map((link) => ({
            ...link,
            onClick: () => setMobileMenuOpen(false),
          })),
        ]}
      />

      <MobileMenuDropdown
        isOpen={mobileUserMenuOpen && !!currentUser}
        links={userMenuItems.map((link) => ({
          ...link,
          onClick: () => setMobileUserMenuOpen(false),
        }))}
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
    </nav>
  );
};

export default Header;
