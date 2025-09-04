"use client";

import { Download, ExternalLink, Link as LinkIcon } from "lucide-react";
import { VisibilityBadge } from "@/app/ui/VisibilityBadge";
import {
  copyLinkToClipboard,
  ShareMenu,
  ShareMenuCopyURLItem,
  ShareMenuDownloadCardItem,
  ShareMenuItem,
} from "@/components/ShareMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
  const isPublic = monster.visibility === "public";

  return (
    <div className="flex gap-2">
      {isOwner && (
        <div className="mr-2">
          <VisibilityBadge visibility={monster.visibility} />
        </div>
      )}

      <ShareMenu>
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
          <TooltipProvider>
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
          </TooltipProvider>
        )}
        <ShareMenuCopyURLItem path={`/m/${monster.id}`} />
        <ShareMenuDownloadCardItem
          name={`${monster.name}.png`}
          path={`/m/${monster.id}`}
        />
      </ShareMenu>
    </div>
  );
}
