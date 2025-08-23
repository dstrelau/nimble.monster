"use client";

import { Menu } from "lucide-react";
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
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const Header = () => {
  const { data: session } = useSession();
  const currentUser = session?.user;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Navigation data
  const mainNavLinks = [
    {
      href: "/create",
      label: "Create",
      isActive:
        isActive("/create") ||
        isActive("/monsters/new") ||
        isActive("/companions/new"),
    },
    { href: "/monsters", label: "Monsters", isActive: isActive("/monsters") },
    {
      href: "/collections",
      label: "Collections",
      isActive: isActive("/collections"),
    },
  ];

  const userNavLinks = currentUser
    ? [
        {
          href: currentUser.name ? `/u/${currentUser.name}` : "#",
          label: "My Profile",
          isActive: currentUser.name
            ? isActive(`/u/${currentUser.name}`)
            : false,
        },
        {
          href: "/my/monsters",
          label: "My Monsters",
          isActive: isActive("/my/monsters"),
        },
        {
          href: "/my/companions",
          label: "My Companions",
          isActive: isActive("/my/companions"),
        },
        {
          href: "/my/collections",
          label: "My Collections",
          isActive: isActive("/my/collections"),
        },
        {
          href: "/my/families",
          label: "My Families",
          isActive: isActive("/my/families"),
        },
      ]
    : [];

  const userNavButtons = currentUser
    ? [
        {
          label: "Logout",
          onClick: () => {
            setMobileUserMenuOpen(false);
            signOut({ redirectTo: "/" });
          },
        },
      ]
    : [];

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
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link
                  href="/create"
                  data-active={
                    isActive("/create") ||
                    isActive("/monsters/new") ||
                    isActive("/companions/new")
                  }
                >
                  Create
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link href="/monsters" data-active={isActive("/monsters")}>
                  Monsters
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link
                  href="/collections"
                  data-active={isActive("/collections")}
                >
                  Collections
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
                <DropdownMenuItem asChild>
                  <Link
                    href={currentUser.name ? `/u/${currentUser.name}` : "#"}
                    className={cn(
                      currentUser.name &&
                        isActive(`/u/${currentUser.name}`) &&
                        "font-bold bg-accent"
                    )}
                  >
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/my/monsters"
                    className={cn(
                      isActive("/my/monsters") && "font-bold bg-accent"
                    )}
                  >
                    My Monsters
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/my/companions"
                    className={cn(
                      isActive("/my/companions") && "font-bold bg-accent"
                    )}
                  >
                    My Companions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/my/collections"
                    className={cn(
                      isActive("/my/collections") && "font-bold bg-accent"
                    )}
                  >
                    My Collections
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/my/families"
                    className={cn(
                      isActive("/my/families") && "font-bold bg-accent"
                    )}
                  >
                    My Families
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ redirectTo: "/" })}>
                  Logout
                </DropdownMenuItem>
                <Separator />
                <ModeToggle className="mt-2 mb-1 items-center" />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white bg-transparent p-2 rounded-full"
              onClick={() => signIn("discord", { redirectTo: "/my/monsters" })}
            >
              <UserAvatar user={{}} size="md" />
            </Button>
          )}
        </div>

        {/* Mobile User menu */}
        <div className="md:hidden flex items-center gap-2">
          <ModeToggle />
          {currentUser ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => {
                setMobileUserMenuOpen(!mobileUserMenuOpen);
                setMobileMenuOpen(false);
              }}
            >
              <UserAvatar user={currentUser} size="md" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => signIn("discord", { redirectTo: "/my/monsters" })}
            >
              <UserAvatar user={{}} size="md" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu dropdowns */}
      <MobileMenuDropdown
        isOpen={mobileMenuOpen}
        links={mainNavLinks.map((link) => ({
          ...link,
          onClick: () => setMobileMenuOpen(false),
        }))}
      />

      <MobileMenuDropdown
        isOpen={mobileUserMenuOpen && !!currentUser}
        links={userNavLinks.map((link) => ({
          ...link,
          onClick: () => setMobileUserMenuOpen(false),
        }))}
        buttons={userNavButtons}
      />
    </nav>
  );
};

export default Header;
