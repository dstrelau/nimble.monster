"use client";

import { ExternalLink } from "lucide-react";
import {
  ShareMenu,
  ShareMenuCopyURLItem,
  ShareMenuDownloadCardItem,
} from "@/components/ShareMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Monster } from "@/lib/types";
import { getMonsterImageUrl, getMonsterUrl } from "@/lib/utils/url";

interface MonsterCardActionsProps {
  monster: Monster;
}

export default function CardActions({ monster }: MonsterCardActionsProps) {
  const isPublic = monster.visibility === "public";

  return (
    <div className="flex gap-2">
      <ShareMenu disabled={!isPublic}>
        <DropdownMenuItem asChild>
          <a
            className="flex gap-2 items-center"
            href={`http://nimbrew.net/${monster.legendary ? "statblock-legendary" : "statblock-generic"}?urlJson=https://nimble.monster${getMonsterUrl(monster)}/nimbrew.json`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4" />
            Send to Nimbrew
          </a>
        </DropdownMenuItem>
        <ShareMenuDownloadCardItem
          name={`${monster.name}.png`}
          path={getMonsterImageUrl(monster)}
        />
        <ShareMenuCopyURLItem path={getMonsterUrl(monster)} />
      </ShareMenu>
    </div>
  );
}
