"use client";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import type { Family } from "@/lib/types";
import { MonsterGroupMinis } from "./MonsterGroupMinis";

interface FamilyCardProps {
  family: Family;
  showEditDeleteButtons?: boolean;
}

export const FamilyCard = ({ family }: FamilyCardProps) => {
  return (
    <MonsterGroupMinis
      name={family.name}
      href={`/f/${family.id}`}
      monsters={family.monsters}
    >
      <AbilityOverlay abilities={family.abilities} />
    </MonsterGroupMinis>
  );
};
