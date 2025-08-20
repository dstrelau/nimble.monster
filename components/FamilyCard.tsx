"use client";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { extractFamilyConditions } from "@/lib/conditions";
import type { FamilyOverview } from "@/lib/types";
import { MonsterGroupMinis } from "./MonsterGroupMinis";

interface FamilyCardProps {
  family: FamilyOverview;
  showEditDeleteButtons?: boolean;
}

export const FamilyCard = ({ family }: FamilyCardProps) => {
  const familyConditions = extractFamilyConditions(family.monsters);

  return (
    <MonsterGroupMinis
      name={family.name}
      href={`/f/${family.id}`}
      monsters={family.monsters}
    >
      <AbilityOverlay
        abilities={family.abilities}
        conditions={familyConditions}
      />
    </MonsterGroupMinis>
  );
};
