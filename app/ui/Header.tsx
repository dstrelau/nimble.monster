"use client";

import {
  BookUser,
  Box,
  Drama,
  HandFist,
  HeartHandshake,
  ListChecks,
  Menu,
  PersonStanding,
  Scroll,
  Shield,
  SquarePen,
  User as UserIcon,
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
import { Goblin } from "@/components/icons/goblin";
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
      icon: Goblin,
    },
    {
      href: "/items",
      label: "Items",
      isActive: isActive("/items"),
      icon: Shield,
    },
  ];

  const heroItems = [
    {
      href: "/ancestries",
      label: "Ancestries",
      isActive: isActive("/ancestries"),
      icon: Scroll,
    },
    {
      href: "/backgrounds",
      label: "Backgrounds",
      isActive: isActive("/backgrounds"),
      icon: Drama,
    },
    {
      href: "/classes",
      label: "Classes",
      isActive: isActive("/classes"),
      icon: BookUser,
    },
    {
      href: "/class-options",
      label: "Class Options",
      isActive: isActive("/class-options"),
      icon: ListChecks,
    },
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

  const isHeroActive = () =>
    isActive("/ancestries") ||
    isActive("/backgrounds") ||
    isActive("/subclasses") ||
    isActive("/spell-schools");

  const userMenuItems = currentUser
    ? [
        {
          href: currentUser.username ? getUserUrl(currentUser) : "#",
          label: "View Profile",
          isActive: currentUser.username
            ? isActive(getUserUrl(currentUser))
            : false,
          icon: UserIcon,
        },
        {
          href: "/my/ancestries",
          label: "Ancestries",
          isActive: isActive("/my/ancestries"),
          icon: Scroll,
        },
        {
          href: "/my/monsters",
          label: "Monsters",
          isActive: isActive("/my/monsters"),
          icon: Goblin,
        },
        {
          href: "/my/backgrounds",
          label: "Backgrounds",
          isActive: isActive("/my/backgrounds"),
          icon: Drama,
        },
        {
          href: "/my/families",
          label: "Families",
          isActive: isActive("/my/families"),
          icon: PersonStanding,
        },
        {
          href: "/my/spell-schools",
          label: "Spells",
          isActive: isActive("/my/spell-schools"),
          icon: WandSparkles,
        },
        {
          href: "/my/items",
          label: "Items",
          isActive: isActive("/my/items"),
          icon: Shield,
        },
        {
          href: "/my/classes",
          label: "Classes",
          isActive: isActive("/my/classes"),
          icon: BookUser,
        },
        {
          href: "/my/subclasses",
          label: "Subclasses",
          isActive: isActive("/my/subclasses"),
          icon: HandFist,
        },
        {
          href: "/my/companions",
          label: "Companions",
          isActive: isActive("/my/companions"),
          icon: HeartHandshake,
        },
        {
          href: "/my/collections",
          label: "Collections",
          isActive: isActive("/my/collections"),
          icon: Box,
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
              <NavigationMenuTrigger data-active={isHeroActive()}>
                <PersonStanding />
                Heroes
              </NavigationMenuTrigger>
              <NavigationMenuContent className="min-w-48">
                <ul>
                  {heroItems.map((item) => (
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
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-1">
                  {userMenuItems[0] && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={userMenuItems[0].href}
                        className={cn(
                          "flex justify-center items-center gap-1",
                          userMenuItems[0].isActive && "font-bold bg-accent"
                        )}
                      >
                        {(() => {
                          const Icon = userMenuItems[0].icon;
                          return <Icon className="size-4" />;
                        })()}
                        {userMenuItems[0].label}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <div className="grid grid-cols-2 gap-1">
                    {userMenuItems.slice(1).map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex justify-center items-center gap-2 flex-col",
                            item.isActive && "font-bold bg-accent"
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
          ...heroItems.map((link) => ({
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
