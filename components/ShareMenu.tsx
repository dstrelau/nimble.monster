import { Download, LinkIcon, Share } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { TooltipProvider } from "./ui/tooltip";

export const copyLinkToClipboard = async (path: string) => {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
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

export const ShareMenuItem = ({ onClick, children }: ShareMenuItemProps) => {
  return <DropdownMenuItem onClick={onClick}>{children}</DropdownMenuItem>;
};

export const ShareMenuCopyURLItem = ({ path }: { path: string }) => {
  const onClick = () => copyLinkToClipboard(path);
  return (
    <ShareMenuItem onClick={onClick}>
      <LinkIcon className="w-4 h-4" />
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
  const onClick = () => downloadCard(name, path);
  return (
    <ShareMenuItem onClick={onClick}>
      <Download className="w-4 h-4" />
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
        <DropdownMenuTrigger className="hover:opacity-70">
          <Share className="w-5 h-5 text-base-content/50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="min-w-38">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
