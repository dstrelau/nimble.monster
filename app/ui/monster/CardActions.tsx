"use client";

import { ExternalLink, FileText } from "lucide-react";
import {
  ShareMenu,
  ShareMenuCopyURLItem,
  ShareMenuDownloadCardItem,
} from "@/components/ShareMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Monster } from "@/lib/services/monsters";
import {
  getMonsterImageUrl,
  getMonsterMarkdownUrl,
  getMonsterUrl,
} from "@/lib/utils/url";

interface MonsterCardActionsProps {
  monster: Monster;
}

export default function CardActions({ monster }: MonsterCardActionsProps) {
  const isPublic = monster.visibility === "public";

  if (!monster.id) {
    return null;
  }

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
        <DropdownMenuItem asChild>
          <a
            className="flex gap-2 items-center"
            href={`${getMonsterMarkdownUrl(monster)}?format=brief`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText className="w-4 h-4" />
            Export to Markdown (Brief)
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            className="flex gap-2 items-center"
            href={getMonsterMarkdownUrl(monster)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText className="w-4 h-4" />
            Export to Markdown (Full)
          </a>
        </DropdownMenuItem>
        <ShareMenuDownloadCardItem
          name={`${monster.name}.png`}
          path={getMonsterImageUrl(monster)}
        />
        <ShareMenuCopyURLItem
          path={getMonsterUrl(monster)}
          updatedAt={monster.updatedAt}
        />
      </ShareMenu>
    </div>
  );
}
