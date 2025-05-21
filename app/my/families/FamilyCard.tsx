"use client";
import type { Family } from "@/lib/types";
import { AbilityOverlay } from "@/ui/AbilityOverlay";
import { useState } from "react";
import { EditDeleteButtons } from "./EditDeleteButtons";
import { EditFamilyForm } from "./EditFamilyForm";

export const FamilyCard = ({ family }: { family: Family }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="d-card d-card-border px-4 py-3 bg-base-100 border-base-300">
      {isEditing ? (
        <EditFamilyForm family={family} onCancel={() => setIsEditing(false)} />
      ) : (
        <>
          <h2 className="d-card-title font-bold italic text-xl">
            {family.name}
          </h2>
          <div className="flex flex-col py-2 gap-4">
            {family.abilities.map((ability) => (
              <AbilityOverlay
                abilities={[ability]}
                key={ability.name + ability.description}
              />
            ))}
          </div>
          <div className="flex flex-row justify-between">
            <div className="font-condensed text-sm text-base-content/50">
              {family.monsterCount || 0} monsters
            </div>
            <EditDeleteButtons
              family={family}
              onEdit={() => setIsEditing(true)}
            />
          </div>
        </>
      )}
    </div>
  );
};
