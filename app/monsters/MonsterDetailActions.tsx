"use client";
import { Shuffle } from "lucide-react";
import Link from "next/link";
import { deleteMonster } from "@/app/actions/monster";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import { Button } from "@/components/ui/button";
import type { Monster } from "@/lib/services/monsters";
import { slugify } from "@/lib/utils/slug";
import { getMonsterEditUrl } from "@/lib/utils/url";

interface MonsterDetailActionsProps {
  monster: Monster;
  isOwner: boolean;
}

export function MonsterDetailActions({
  monster,
  isOwner,
}: MonsterDetailActionsProps) {
  if (!monster?.id) {
    return null;
  }

  return (
    <EntityDetailActions
      isOwner={isOwner}
      editUrl={getMonsterEditUrl(monster)}
      onDelete={() => deleteMonster(monster.id)}
      redirectTo="/my/monsters"
      entityType="monster"
      entityId={monster.id}
      entityLabel="Monster"
    >
      <Button variant="outline" size="sm" asChild>
        <Link href={`/monsters/new?remix=${slugify(monster)}`}>
          <Shuffle className="w-4 h-4" />
          Remix
        </Link>
      </Button>
    </EntityDetailActions>
  );
}
