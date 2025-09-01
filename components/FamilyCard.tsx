"use client";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Family, MonsterMini } from "@/lib/types";
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
      href={`/f/${family.id}`}
      monsters={monsters}
    >
      <AbilityOverlay abilities={family.abilities} conditions={allConditions} />
    </MonsterGroupMinis>
  );
};
