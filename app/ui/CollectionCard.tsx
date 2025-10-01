"use client";
import { EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import React from "react";
import { Link } from "@/components/app/Link";
import { FormattedText } from "@/components/FormattedText";
import { GameIcon } from "@/components/GameIcon";
import { MonsterRow } from "@/components/MonsterGroupMinis";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useConditions } from "@/lib/hooks/useConditions";
import { RARITIES } from "@/lib/services/items";
import type { CollectionOverview } from "@/lib/types";
import { cn, monstersSortedByLevelInt } from "@/lib/utils";
import { getCollectionUrl, getItemUrl } from "@/lib/utils/url";
import { CardFooterLayout } from "./shared/CardFooterLayout";

const ItemRow = ({ item }: { item: CollectionOverview["items"][0] }) => {
  const rarityOption = RARITIES.find(
    (r: { value: string; label: string }) => r.value === item.rarity
  );

  return (
    <div className="flex gap-1 items-center">
      <div
        className={cn(
          "font-slab",
          "flex-1 flex gap-1 items-center font-bold small-caps italic"
        )}
      >
        {item.imageIcon && (
          <GameIcon
            iconId={item.imageIcon}
            className="size-5 fill-icon/50 z-0"
          />
        )}
        {item.visibility === "private" && (
          <EyeOff className="size-5 inline self-center stroke-flame" />
        )}
        <span>
          <Link
            href={getItemUrl(item)}
            className={cn(
              "text-lg mr-2",
              item.visibility === "private" && "text-muted-foreground"
            )}
          >
            {item.name}
          </Link>
        </span>
      </div>
      <div
        className={cn(
          "font-slab",
          "flex flex-wrap items-center justify-end font-black italic"
        )}
      >
        {rarityOption && item.rarity !== "unspecified" && (
          <span className="font-condensed text-sm uppercase px-1.5 py-0 mr-2 rounded border-2">
            {rarityOption.label[0]}
          </span>
        )}
      </div>
    </div>
  );
};

export const CollectionCard = ({
  collection,
  limit = 5,
}: {
  collection: CollectionOverview;
  limit?: number;
}) => {
  const total = collection.items.length + collection.monsters.length;
  const itemRatio = collection.items.length / total;
  const monsterRatio = collection.monsters.length / total;
  const limitItems = Math.round(itemRatio * limit);
  const limitMonsters = Math.round(monsterRatio * limit);

  const visibleItems = limitItems
    ? collection.items.slice(0, limitItems)
    : collection.items;
  const remainingItemCount =
    limitItems && collection.items.length > limitItems
      ? collection.items.length - limitItems
      : 0;

  const sortedMonsters = monstersSortedByLevelInt(collection.monsters);
  const visibleMonsters = sortedMonsters
    ? sortedMonsters.slice(0, limitMonsters)
    : sortedMonsters;
  const remainingMonsterCount =
    limitMonsters && sortedMonsters.length > limitMonsters
      ? sortedMonsters.length - limitMonsters
      : 0;

  const totalRemainingCount = remainingItemCount + remainingMonsterCount;

  const href = collection.id && getCollectionUrl(collection);

  const { data: session } = useSession();
  const { allConditions: conditions } = useConditions({
    creatorId: session?.user.discordId,
  });
  const truncatedDescription = collection.description
    ? collection.description.length > 100
      ? `${collection.description.slice(0, 100)}...`
      : collection.description
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle
          className={cn(
            "font-condensed font-bold text-2xl flex items-center gap-2"
          )}
        >
          {collection.id ? (
            <Link href={href}>{collection.name}</Link>
          ) : (
            `${collection.name}`
          )}
        </CardTitle>
        {truncatedDescription && (
          <CardDescription>
            <FormattedText
              content={truncatedDescription}
              conditions={conditions}
            />
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1 justify-center">
          {visibleMonsters?.map((monster, index) => (
            <React.Fragment key={monster.id}>
              <MonsterRow key={monster.id} monster={monster} />
              {(visibleItems.length > 0 ||
                index < visibleMonsters.length - 1) && <Separator />}
            </React.Fragment>
          ))}
          {visibleItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <ItemRow item={item} />
              {index < visibleItems.length - 1 && <Separator />}
            </React.Fragment>
          ))}
          {totalRemainingCount > 0 && (
            <div className="text-sm text-muted-foreground mt-2 text-center font-bold">
              {href ? (
                <Link className="text-muted-foreground" href={href}>
                  +{totalRemainingCount} more
                </Link>
              ) : (
                <span>+{totalRemainingCount} more</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooterLayout
        creator={collection.creator}
        actionsSlot={
          collection.visibility === "private" && (
            <Badge variant="default" className="h-6">
              Private
            </Badge>
          )
        }
      />
    </Card>
  );
};
