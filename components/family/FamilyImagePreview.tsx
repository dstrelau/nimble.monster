"use client";

import { FamilyCard } from "@/components/family/FamilyCard";
import type { Monster } from "@/lib/services/monsters";
import type { FamilyOverview } from "@/lib/types";

interface FamilyImagePreviewProps {
  family: FamilyOverview;
  monsters: Monster[];
}

export function FamilyImagePreview({
  family,
  monsters,
}: FamilyImagePreviewProps) {
  return (
    <div
      id={`family-${family.id}`}
      className="mx-auto w-full max-w-lg bg-background p-8"
    >
      <FamilyCard family={family} monsters={monsters} />
    </div>
  );
}
