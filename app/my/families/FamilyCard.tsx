"use client";
import type { Family } from "@/lib/types";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { useState } from "react";
import { EditDeleteButtons } from "./EditDeleteButtons";
import { EditFamilyForm } from "./EditFamilyForm";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const FamilyCard = ({ family }: { family: Family }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card>
      {isEditing ? (
        <CardContent className="p-6">
          <EditFamilyForm
            family={family}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="font-bold italic text-xl">
              {family.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AbilityOverlay abilities={family.abilities} />
          </CardContent>
          <CardFooter className="flex flex-row justify-between items-center">
            <div className="font-condensed text-sm text-muted-foreground">
              {family.monsterCount || 0} monsters
            </div>
            <EditDeleteButtons
              family={family}
              onEdit={() => setIsEditing(true)}
            />
          </CardFooter>
        </>
      )}
    </Card>
  );
};
