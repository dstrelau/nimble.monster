"use client";

import { Link } from "@/components/app/Link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassAbilityList } from "@/lib/types";
import { getClassAbilityListUrl } from "@/lib/utils/url";
import { CardFooterLayout } from "../shared/CardFooterLayout";

interface ClassAbilityCardProps {
  abilityList: ClassAbilityList;
}

export const AbilityListCardMini = ({ abilityList }: ClassAbilityCardProps) => {
  const maxItems = 8;
  const items =
    abilityList.items?.length > maxItems
      ? abilityList.items.slice(0, maxItems)
      : abilityList.items;
  const moreCount = Math.max(abilityList.items?.length - maxItems, 0);
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex flex-col font-slab text-2xl font-bold">
          {abilityList.characterClass && (
            <span className="uppercase self-center w-fit mb-2 py-1 px-2 bg-muted text-sm font-sab font-normal">
              {abilityList.characterClass}
            </span>
          )}
          <Link href={getClassAbilityListUrl(abilityList)}>
            {abilityList.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map((item) => (
          <div className="text-sm" key={item.id}>
            <h4 className="font-bold font-stretch-ultra-condensed">
              {item.name}
            </h4>
          </div>
        ))}
        {moreCount > 0 && (
          <div className="text-sm text-muted-foreground mt-2 text-center font-bold">
            <span>+{moreCount} more</span>
          </div>
        )}
      </CardContent>
      <CardFooterLayout creator={abilityList.creator} />
    </Card>
  );
};
