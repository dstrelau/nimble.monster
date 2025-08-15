"use client";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import type { FamilyOverview } from "@/lib/types";
import { MonsterGroupMinis } from "./MonsterGroupMinis";

interface FamilyCardProps {
  family: FamilyOverview;
  showEditDeleteButtons?: boolean;
}

export const FamilyCard = ({ family }: FamilyCardProps) => {
  return (
    <MonsterGroupMinis
      name={family.name}
      href={`/f/${family.id}`}
      monsters={family.monsters}
    >
      {/* FIXME: Add family conditions */}
      <AbilityOverlay abilities={family.abilities} conditions={[]} />
    </MonsterGroupMinis>
  );
};
