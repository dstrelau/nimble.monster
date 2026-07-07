"use client";

import { Library, LogOut, Plus, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { SubNavItem } from "@/components/layout/NavMenu";
import { NavTriggerButton } from "@/components/layout/NavTriggerButton";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getUserUrl } from "@/lib/utils/url";

const AccountNavItem = ({
  user,
  label,
  open,
  className,
  ...props
}: {
  user?: User;
  label: string;
  open?: boolean;
} & React.ComponentProps<typeof Button>) => (
  <NavTriggerButton
    open={open}
    className={cn("h-16 px-3", className)}
    {...props}
  >
    <UserAvatar user={user} size="sm" className="ring-1 ring-border-strong" />
    <span className="font-slab font-bold">{label}</span>
  </NavTriggerButton>
);

interface UserNavItemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserNavItem({ open, onOpenChange }: UserNavItemProps) {
  const { data: session } = useSession();
  const currentUser = session?.user;
  const pathname = usePathname();
  const isOnMyPages =
    pathname?.startsWith("/my/") || pathname === `/u/${currentUser?.username}`;

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

  const myLibraryItem = {
    href: "/my/library",
    label: "My Library",
    isActive: pathname === "/my/library",
    icon: Library,
  };

  const handleSignOut = () => signOut({ redirectTo: "/" });
  const handleSignIn = () => signIn("discord", { redirectTo: "/my/library" });

  if (!currentUser) {
    return (
      <AccountNavItem user={undefined} label="Login" onClick={handleSignIn} />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        className="mr-2 hidden md:inline-flex"
        asChild
      >
        <Link href="/create">
          <Plus className="size-4" />
          Create
        </Link>
      </Button>
      <NavigationMenu
        viewport={false}
        value={open ? "account" : ""}
        onValueChange={(value) => onOpenChange(value === "account")}
      >
        <NavigationMenuList>
          <NavigationMenuItem value="account">
            <NavigationMenuTrigger
              className={cn(
                "h-16 px-3 gap-2 rounded-none border-b-2 border-transparent text-header-foreground bg-transparent hover:text-header-foreground focus:text-header-foreground data-[state=open]:bg-accent data-[state=open]:border-flame",
                isOnMyPages && "border-hp"
              )}
            >
              <UserAvatar
                user={currentUser}
                size="md"
                className="ring-1 ring-border-strong"
              />
              <span className="font-slab font-bold hidden md:block">
                {currentUser.displayName}
              </span>
            </NavigationMenuTrigger>
            <NavigationMenuContent className="absolute left-auto right-0 w-72 p-0">
              <ul className="py-1">
                {profileItem && (
                  <SubNavItem
                    href={profileItem.href}
                    label={profileItem.label}
                    icon={profileItem.icon}
                    active={profileItem.isActive}
                  />
                )}
                <SubNavItem
                  href={myLibraryItem.href}
                  label={myLibraryItem.label}
                  icon={myLibraryItem.icon}
                  active={myLibraryItem.isActive}
                />
              </ul>
              <Separator />
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted rounded-b-md">
                <ModeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:bg-transparent hover:text-accent-text-strong"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-3.5" />
                  Logout
                </Button>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
