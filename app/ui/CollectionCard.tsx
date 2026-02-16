"use client";
import { EyeOff, X } from "lucide-react";
import { useSession } from "next-auth/react";

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

import { useConditions } from "@/lib/hooks/useConditions";
import { RARITIES } from "@/lib/services/items";
import type { CollectionOverview } from "@/lib/types";
import { cn, itemsSortedByName, monstersSortedByLevelInt } from "@/lib/utils";
import { getCollectionUrl, getItemUrl } from "@/lib/utils/url";
import { CardFooterLayout } from "./shared/CardFooterLayout";

const ItemRow = ({
  item,
  onRemove,
}: {
  item: CollectionOverview["items"][0];
  onRemove?: (id: string) => void;
}) => {
  const rarityOption = RARITIES.find(
    (r: { value: string; label: string }) => r.value === item.rarity
  );

  return (
    <div className="flex gap-1 items-center">
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="rounded p-0.5 hover:bg-muted"
        >
          <X className="size-4 stroke-muted-foreground" />
        </button>
      )}
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
  limit = 7,
  onRemoveMonster,
  onRemoveItem,
}: {
  collection: CollectionOverview;
  limit?: number;
  onRemoveMonster?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
}) => {
  const total = collection.items.length + collection.monsters.length;
  const itemRatio = collection.items.length / total;
  const monsterRatio = collection.monsters.length / total;
  const limitItems = Math.round(itemRatio * limit);
  const limitMonsters = Math.round(monsterRatio * limit);

  const sortedItems = itemsSortedByName(collection.items);
  const visibleItems = limitItems
    ? sortedItems.slice(0, limitItems)
    : sortedItems;
  const remainingItemCount =
    limitItems && sortedItems.length > limitItems
      ? sortedItems.length - limitItems
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
          {visibleMonsters?.map((monster) => (
            <MonsterRow
              key={monster.id}
              monster={monster}
              onRemove={onRemoveMonster}
            />
          ))}
          {visibleItems.map((item) => (
            <ItemRow key={item.id} item={item} onRemove={onRemoveItem} />
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
