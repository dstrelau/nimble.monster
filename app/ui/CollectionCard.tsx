"use client";
import {
  Drama,
  EyeOff,
  HandFist,
  HeartHandshake,
  Scroll,
  WandSparkles,
  X,
} from "lucide-react";
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
import type { AncestryMini } from "@/lib/services/ancestries/types";
import type { BackgroundMini } from "@/lib/services/backgrounds/types";
import { RARITIES } from "@/lib/services/items";
import type {
  CollectionOverview,
  CompanionMini,
  SpellSchoolMini,
  SubclassMini,
} from "@/lib/types";
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
        className={
          "font-slab flex-1 flex gap-1 items-center font-bold small-caps italic"
        }
      >
        <div className="w-7 shrink-0 flex items-center justify-center">
          {(item.imageIcon || item.imageBgIcon) && (
            <GameIcon
              iconId={item.imageIcon ?? item.imageBgIcon ?? ""}
              className="size-5 fill-muted-foreground z-0"
            />
          )}
        </div>
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

const EntityRow = ({
  id,
  icon,
  name,
  right,
  onRemove,
}: {
  id: string;
  icon: React.ReactNode;
  name: string;
  right?: React.ReactNode;
  onRemove?: (id: string) => void;
}) => (
  <div className="flex gap-1 items-center">
    {onRemove && (
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="rounded p-0.5 hover:bg-muted"
      >
        <X className="size-4 stroke-muted-foreground" />
      </button>
    )}
    <div className="font-slab flex-1 flex gap-1 items-center font-bold small-caps italic">
      <div className="w-7 shrink-0 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-lg">{name}</span>
    </div>
    {right && (
      <div className="font-slab flex flex-wrap items-baseline justify-end font-black italic">
        {right}
      </div>
    )}
  </div>
);

const CompanionRow = ({
  companion,
  onRemove,
}: {
  companion: CompanionMini;
  onRemove?: (id: string) => void;
}) => (
  <EntityRow
    id={companion.id}
    icon={<HeartHandshake className="size-5 stroke-muted-foreground" />}
    name={companion.name}
    onRemove={onRemove}
  />
);

const AncestryRow = ({
  ancestry,
  onRemove,
}: {
  ancestry: AncestryMini;
  onRemove?: (id: string) => void;
}) => (
  <EntityRow
    id={ancestry.id}
    icon={<Scroll className="size-5 stroke-muted-foreground" />}
    name={ancestry.name}
    onRemove={onRemove}
  />
);

const BackgroundRow = ({
  background,
  onRemove,
}: {
  background: BackgroundMini;
  onRemove?: (id: string) => void;
}) => (
  <EntityRow
    id={background.id}
    icon={<Drama className="size-5 stroke-muted-foreground" />}
    name={background.name}
    onRemove={onRemove}
  />
);

const SubclassRow = ({
  subclass,
  onRemove,
}: {
  subclass: SubclassMini;
  onRemove?: (id: string) => void;
}) => (
  <EntityRow
    id={subclass.id}
    icon={<HandFist className="size-5 stroke-muted-foreground" />}
    name={`${subclass.namePreface ? `${subclass.namePreface} ` : ""}${subclass.name}`}
    onRemove={onRemove}
    right={
      <span className="text-sm text-muted-foreground not-italic">
        {subclass.className}
      </span>
    }
  />
);

const SpellSchoolRow = ({
  school,
  onRemove,
}: {
  school: SpellSchoolMini;
  onRemove?: (id: string) => void;
}) => (
  <EntityRow
    id={school.id}
    icon={<WandSparkles className="size-5 stroke-muted-foreground" />}
    name={school.name}
    onRemove={onRemove}
    right={
      school.spellCount != null ? (
        <span className="text-sm text-muted-foreground not-italic">
          {school.spellCount} {school.spellCount === 1 ? "spell" : "spells"}
        </span>
      ) : undefined
    }
  />
);

export const CollectionCard = ({
  collection,
  limit = 7,
  onRemoveMonsterAction,
  onRemoveItemAction,
  onRemoveCompanionAction,
  onRemoveAncestryAction,
  onRemoveBackgroundAction,
  onRemoveSubclassAction,
  onRemoveSpellSchoolAction,
}: {
  collection: CollectionOverview;
  limit?: number;
  onRemoveMonsterAction?: (id: string) => void;
  onRemoveItemAction?: (id: string) => void;
  onRemoveCompanionAction?: (id: string) => void;
  onRemoveAncestryAction?: (id: string) => void;
  onRemoveBackgroundAction?: (id: string) => void;
  onRemoveSubclassAction?: (id: string) => void;
  onRemoveSpellSchoolAction?: (id: string) => void;
}) => {
  const sortedMonsters = monstersSortedByLevelInt(collection.monsters);
  const sortedItems = itemsSortedByName(collection.items);
  const { companions, ancestries, backgrounds, subclasses, spellSchools } =
    collection;

  const otherCount =
    companions.length +
    ancestries.length +
    backgrounds.length +
    subclasses.length +
    spellSchools.length;
  const total = sortedMonsters.length + sortedItems.length + otherCount;

  const monsterRatio = total > 0 ? sortedMonsters.length / total : 0;
  const itemRatio = total > 0 ? sortedItems.length / total : 0;
  const limitMonsters = Math.round(monsterRatio * limit);
  const limitItems = Math.round(itemRatio * limit);
  const limitOther = Math.max(0, limit - limitMonsters - limitItems);

  const visibleMonsters = limitMonsters
    ? sortedMonsters.slice(0, limitMonsters)
    : sortedMonsters;
  const visibleItems = limitItems
    ? sortedItems.slice(0, limitItems)
    : sortedItems;

  const allOther = [
    ...companions.map((c) => ({ type: "companion" as const, entity: c })),
    ...ancestries.map((a) => ({ type: "ancestry" as const, entity: a })),
    ...backgrounds.map((b) => ({ type: "background" as const, entity: b })),
    ...subclasses.map((s) => ({ type: "subclass" as const, entity: s })),
    ...spellSchools.map((s) => ({ type: "spellSchool" as const, entity: s })),
  ];
  const visibleOther = limitOther ? allOther.slice(0, limitOther) : allOther;

  const totalRemainingCount =
    total - visibleMonsters.length - visibleItems.length - visibleOther.length;

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
              onRemove={onRemoveMonsterAction}
            />
          ))}
          {visibleItems.map((item) => (
            <ItemRow key={item.id} item={item} onRemove={onRemoveItemAction} />
          ))}
          {visibleOther.map(({ type, entity }) => {
            switch (type) {
              case "companion":
                return (
                  <CompanionRow
                    key={entity.id}
                    companion={entity}
                    onRemove={onRemoveCompanionAction}
                  />
                );
              case "ancestry":
                return (
                  <AncestryRow
                    key={entity.id}
                    ancestry={entity}
                    onRemove={onRemoveAncestryAction}
                  />
                );
              case "background":
                return (
                  <BackgroundRow
                    key={entity.id}
                    background={entity}
                    onRemove={onRemoveBackgroundAction}
                  />
                );
              case "subclass":
                return (
                  <SubclassRow
                    key={entity.id}
                    subclass={entity}
                    onRemove={onRemoveSubclassAction}
                  />
                );
              case "spellSchool":
                return (
                  <SpellSchoolRow
                    key={entity.id}
                    school={entity}
                    onRemove={onRemoveSpellSchoolAction}
                  />
                );
              default:
                return null;
            }
          })}
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
