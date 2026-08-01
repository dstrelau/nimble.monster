"use client";
import { Shuffle } from "lucide-react";
import Link from "next/link";
import { deleteMonster } from "@/app/actions/monster";
import { deleteHazard } from "@/app/monsters/actions";
import { EntityDetailActions } from "@/components/EntityDetailActions";
import { Button } from "@/components/ui/button";
import type { MonsterFormState } from "@/lib/services/monsters";
import { slugify } from "@/lib/utils/slug";
import { getMonsterEditUrl } from "@/lib/utils/url";

interface MonsterDetailActionsProps {
  monster: MonsterFormState;
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
      onDelete={() =>
        monster.hazard ? deleteHazard(monster.id) : deleteMonster(monster.id)
      }
      redirectTo={monster.hazard ? "/my/hazards" : "/my/monsters"}
      entityType="monster"
      entityId={monster.id}
      entityLabel={monster.hazard ? "Hazard" : "Monster"}
    >
      <Button variant="outline" size="sm" asChild>
        <Link
          href={`/${monster.hazard ? "hazards" : "monsters"}/new?remix=${slugify(monster)}`}
        >
          <Shuffle className="w-4 h-4" />
          Remix
        </Link>
      </Button>
    </EntityDetailActions>
  );
}
