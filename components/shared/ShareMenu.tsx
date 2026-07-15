"use client";

import { Download, LinkIcon, Share } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";

export const copyLinkToClipboard = async (path: string, updatedAt?: Date) => {
  try {
    let url = `${window.location.origin}${path}`;
    if (updatedAt) {
      const timestamp = Math.floor(updatedAt.getTime() / 1000);
      url += `?t=${timestamp}`;
    }
    await navigator.clipboard.writeText(url);
    const activeElement = document.activeElement as HTMLElement;
    activeElement?.blur?.();
  } catch (error) {
    console.error("Failed to copy link:", error);
  }
};

export const downloadCard = async (name: string, path: string) => {
  try {
    const link = document.createElement("a");
    link.download = name;
    link.href = path;
    link.click();
  } catch (error) {
    console.error("Error downloading image:", error);
  }
};

interface ShareMenuItemProps {
  onClick: () => void;
  children: ReactNode;
}

export const shareMenuItemClassName =
  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-accent focus:text-accent-foreground focus:font-semibold";
export const shareMenuIconClassName =
  "size-4 text-muted-foreground group-focus:text-primary";

export const ShareMenuItem = ({ onClick, children }: ShareMenuItemProps) => {
  return (
    <DropdownMenuItem onClick={onClick} className={shareMenuItemClassName}>
      {children}
    </DropdownMenuItem>
  );
};

export const ShareMenuCopyURLItem = ({
  path,
  updatedAt,
}: {
  path: string;
  updatedAt?: Date;
}) => {
  const onClick = () => copyLinkToClipboard(path, updatedAt);
  return (
    <ShareMenuItem onClick={onClick}>
      <LinkIcon className={shareMenuIconClassName} />
      Copy Link
    </ShareMenuItem>
  );
};

export const ShareMenuDownloadCardItem = ({
  name,
  path,
}: {
  name: string;
  path: string;
}) => {
  const { resolvedTheme } = useTheme();
  const downloadTheme = resolvedTheme === "dark" ? resolvedTheme : "light";
  const pathWithTheme = `${path}?theme=${downloadTheme}`;
  const onClick = () => downloadCard(name, pathWithTheme);
  return (
    <ShareMenuItem onClick={onClick}>
      <Download className={shareMenuIconClassName} />
      Card Image
    </ShareMenuItem>
  );
};

interface ShareMenuProps {
  children: ReactNode;
  disabled?: boolean;
}

export const ShareMenu = ({ children, disabled = false }: ShareMenuProps) =>
  disabled ? (
    <Badge variant="default" className="h-6">
      Private
    </Badge>
  ) : (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="menu-trigger" size="icon-sm" aria-label="share">
            <Share className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          className="min-w-56 rounded-xl p-1.5 shadow-lg"
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
