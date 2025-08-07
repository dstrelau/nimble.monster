"use client";
import Link from "next/link";
import { useState } from "react";
import { EditDeleteButtons } from "@/app/my/families/EditDeleteButtons";
import { EditFamilyForm } from "@/app/my/families/EditFamilyForm";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Family } from "@/lib/types";

interface FamilyCardProps {
  family: Family;
  showEditDeleteButtons?: boolean;
}

export const FamilyCard = ({
  family,
  showEditDeleteButtons = false,
}: FamilyCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-bold italic text-xl">
            <Link href={`/f/${family.id}`}>{family.name}</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AbilityOverlay abilities={family.abilities} />
        </CardContent>
        <CardFooter className="flex flex-row justify-between items-center">
          <div className="font-condensed text-sm text-muted-foreground">
            {family.monsterCount || 0} monsters
          </div>
          {showEditDeleteButtons && (
            <EditDeleteButtons
              family={family}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </CardFooter>
      </Card>
      {showEditDeleteButtons && isEditing && (
        <EditFamilyForm
          family={family}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </>
  );
};
