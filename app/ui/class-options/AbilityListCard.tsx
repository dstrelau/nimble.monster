"use client";

import { FormattedText } from "@/components/FormattedText";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { ClassAbilityList } from "@/lib/types";

interface ClassAbilityCardProps {
  abilityList: ClassAbilityList;
}

export const AbilityListCard = ({ abilityList }: ClassAbilityCardProps) => {
  const { allConditions: conditions } = useConditions({
    creatorId: abilityList.creator?.discordId,
  });
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex flex-col font-slab text-3xl font-bold text-center">
          {abilityList.characterClass && (
            <span className="uppercase self-center w-fit mb-2 py-1 px-2 bg-muted text-sm font-sab font-normal">
              {abilityList.characterClass}
            </span>
          )}
          {abilityList.name}
        </CardTitle>
        {abilityList.description && (
          <CardDescription>
            <FormattedText
              content={abilityList.description}
              conditions={conditions}
            />
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="lg:grid lg:grid-cols-2 gap-4 space-y-4">
        {abilityList.items &&
          abilityList.items.length > 0 &&
          abilityList.items.map((item) => (
            <div className="text-sm" key={item.id}>
              <h4 className="font-bold">{item.name}</h4>
              <p>{item.description}</p>
            </div>
          ))}
      </CardContent>
    </Card>
  );
};
