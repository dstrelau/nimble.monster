"use client";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { MiniCard } from "@/app/ui/monster/MiniCard";
import { Card, CardTitle } from "@/components/ui/card";
import type { Family } from "@/lib/types";
import { Link } from "./app/Link";

interface FamilyCardProps {
  family: Family;
  showEditDeleteButtons?: boolean;
}

export const FamilyCard = ({ family }: FamilyCardProps) => {
  return (
    <Card className="px-4 gap-4">
      <CardTitle className="font-black text-2xl">
        <Link href={`/f/${family.id}`}>{family.name}</Link>
      </CardTitle>
      <AbilityOverlay abilities={family.abilities} />
      <div className="flex flex-col gap-2">
        {family.monsters?.map((monster) => (
          <MiniCard key={monster.id} monster={monster} />
        ))}
      </div>
    </Card>
  );
};
