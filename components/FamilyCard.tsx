"use client";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { useConditions } from "@/lib/hooks/useConditions";
import type { MonsterMini } from "@/lib/services/monsters";
import type { Family } from "@/lib/types";
import { getFamilyUrl } from "@/lib/utils/url";
import { MonsterGroupMinis } from "./MonsterGroupMinis";

interface FamilyCardProps {
  family: Family;
  monsters: MonsterMini[];
  showEditDeleteButtons?: boolean;
}

export const FamilyCard = ({ family, monsters }: FamilyCardProps) => {
  const { allConditions } = useConditions({
    creatorId: family.creator.discordId,
  });
  return (
    <MonsterGroupMinis
      name={family.name}
      href={getFamilyUrl(family)}
      monsters={monsters}
    >
      <AbilityOverlay abilities={family.abilities} conditions={allConditions} />
    </MonsterGroupMinis>
  );
};
