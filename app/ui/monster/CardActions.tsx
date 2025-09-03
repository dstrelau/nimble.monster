"use client";

import { Download, ExternalLink, Link as LinkIcon, Share } from "lucide-react";
import { useTransition } from "react";
import { VisibilityBadge } from "@/app/ui/VisibilityBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Monster } from "@/lib/types";

interface MonsterCardActionsProps {
  monster: Monster;
  isOwner?: boolean;
}

export default function CardActions({
  monster,
  isOwner,
}: MonsterCardActionsProps) {
  const [_isPending, _startTransition] = useTransition();
  const isPublic = monster.visibility === "public";

  const copyMonsterLink = async () => {
    try {
      const url = `${window.location.origin}/m/${monster.id}`;
      await navigator.clipboard.writeText(url);
      const activeElement = document.activeElement as HTMLElement;
      activeElement?.blur?.();
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const downloadCard = async () => {
    try {
      const link = document.createElement("a");
      link.download = `${monster.name}.png`;
      link.href = `/m/${monster.id}/image`;
      link.click();
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  return (
    <div className="flex gap-2">
      {isOwner && (
        <div className="mr-2">
          <VisibilityBadge visibility={monster.visibility} />
        </div>
      )}

      <TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:opacity-70">
            <Share className="w-5 h-5 text-base-content/50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="min-w-38">
            {isPublic ? (
              <DropdownMenuItem asChild>
                <a
                  className="flex gap-2 items-center"
                  href={`http://nimbrew.net/${monster.legendary ? "statblock-legendary" : "statblock-generic"}?urlJson=https://nimble.monster/m/${monster.id}/nimbrew.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Send to Nimbrew
                </a>
              </DropdownMenuItem>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DropdownMenuItem disabled>
                      <ExternalLink className="w-4 h-4" />
                      Send to Nimbrew
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Only public monsters can be exported to Nimbrew</p>
                </TooltipContent>
              </Tooltip>
            )}
            <DropdownMenuItem onClick={copyMonsterLink}>
              <LinkIcon className="w-4 h-4" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadCard}>
              <Download className="w-4 h-4" />
              Card Image
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}
