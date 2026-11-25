"use client";
import type { LucideIcon } from "lucide-react";
import { TriangleAlert } from "lucide-react";
import NextLink from "next/link";
import { EntityReactions } from "@/components/EntityReactions";
import {
  resolveItemBackdrop,
  resolveItemColor,
} from "@/components/item/colors";
import { ItemImageStage } from "@/components/item/ItemImageStage";
import { Link } from "@/components/layout/Link";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { MonsterImage } from "@/components/monster/MonsterImage";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import { Level } from "@/components/shared/Level";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RARITIES } from "@/lib/services/items";
import type { CollectionOverview, User } from "@/lib/types";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";
import { cn, itemsSortedByName, monstersSortedByLevelInt } from "@/lib/utils";
import {
  getCollectionUrl,
  getItemUrl,
  getMonsterUrl,
  getUserUrl,
} from "@/lib/utils/url";

// Earthy inks that keep the cream header text readable; dark mode uses a
// slightly deeper shade of each so the band doesn't glare on the dark page.
const INKS = [
  "bg-[#b1490f] dark:bg-[#a8460f]",
  "bg-[#56702f] dark:bg-[#4e6630]",
  "bg-[#3b5487] dark:bg-[#384f80]",
  "bg-[#99690c] dark:bg-[#8a5f0d]",
  "bg-[#7d3c6b] dark:bg-[#713762]",
  "bg-[#23706b] dark:bg-[#215f5b]",
  "bg-[#8f2d2d] dark:bg-[#842b2b]",
  "bg-[#50606e] dark:bg-[#46535f]",
];

const LIST_LIMIT = 6;
// Six overlapping 48px portraits span about 238px, leaving room in the
// narrowest card (about 315px at the 3-column breakpoint); the rest are left out.
const LINEUP_LIMIT = 6;
// Overlapping 24px avatars; past this many, the last slot shows "+N" so the
// footer keeps room for reactions.
const CONTRIBUTOR_LIMIT = 10;

// "Monstery Monday Week 95 - Contrast" -> week "95", title "Contrast".
function parseName(name: string): { week?: string; title: string } {
  const match = name.match(/\bWeek\s+(\d+)\s*[-–—:]\s*(.+)$/i);
  return match ? { week: match[1], title: match[2] } : { title: name };
}

function inkIndex(id: string, week?: string): number {
  if (week) return Number(week) % INKS.length;
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % INKS.length;
}

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

interface Row {
  key: string;
  name: string;
  href?: string;
  detail?: React.ReactNode;
}

export const CollectionPlateCard = ({
  collection,
}: {
  collection: CollectionOverview;
}) => {
  const { week, title } = parseName(collection.name);
  const href = getCollectionUrl(collection);
  const monsters = monstersSortedByLevelInt(collection.monsters);
  const items = itemsSortedByName(collection.items);
  const classes = collection.classes ?? [];
  const creatures = monsters.filter((m) => !m.hazard);

  const counts: { label: string; count: number; Icon: LucideIcon }[] = [
    {
      label: "monster",
      count: creatures.length,
      Icon: ENTITY_TYPE_ICONS.monster,
    },
    {
      label: "hazard",
      count: monsters.length - creatures.length,
      Icon: TriangleAlert,
    },
    { label: "item", count: items.length, Icon: ENTITY_TYPE_ICONS.item },
    {
      label: "class",
      count: classes.length,
      Icon: ENTITY_TYPE_ICONS.class,
    },
    {
      label: "subclass",
      count: collection.subclasses.length,
      Icon: ENTITY_TYPE_ICONS.subclass,
    },
    {
      label: "ancestry",
      count: collection.ancestries.length,
      Icon: ENTITY_TYPE_ICONS.ancestry,
    },
    {
      label: "background",
      count: collection.backgrounds.length,
      Icon: ENTITY_TYPE_ICONS.background,
    },
    {
      label: "spell school",
      count: collection.spellSchools.length,
      Icon: ENTITY_TYPE_ICONS.school,
    },
    {
      label: "companion",
      count: collection.companions.length,
      Icon: ENTITY_TYPE_ICONS.companion,
    },
    {
      label: "rule",
      count: collection.customRules.length,
      Icon: ENTITY_TYPE_ICONS.rule,
    },
    {
      label: "reference table",
      count: collection.randomTables.length,
      Icon: ENTITY_TYPE_ICONS.table,
    },
  ];

  const lineup = [
    ...creatures
      .filter((m) => m.paperforgeId || m.customArtwork)
      .map((m) => ({
        key: m.id,
        node: (
          <MonsterImage
            paperforgeId={m.paperforgeId}
            customArtwork={m.customArtwork}
            size={48}
            alt=""
            className="size-12"
          />
        ),
      })),
    ...items
      .filter((i) => i.imageIcon || i.imageBgIcon)
      .map((i) => ({
        key: i.id,
        node: (
          <ItemImageStage
            backdrop={resolveItemBackdrop(i)}
            imageIcon={i.imageIcon}
            imageBgIcon={i.imageBgIcon}
            imageColor={resolveItemColor(i.imageColor)}
            imageBgColor={resolveItemColor(i.imageBgColor)}
            size="xs"
            className="overflow-hidden rounded-full bg-muted"
          />
        ),
      })),
  ];

  const rows: Row[] = [
    ...monsters.map((m) => ({
      key: m.id,
      name: m.name,
      href: getMonsterUrl(m),
      detail: m.hazard ? (
        "Hazard"
      ) : m.legendary ? (
        "Legendary"
      ) : m.levelInt !== 0 ? (
        <span className="font-medium small-caps">
          Lvl <Level level={m.level} />
        </span>
      ) : m.minion ? (
        "Minion"
      ) : undefined,
    })),
    ...items.map((i) => ({
      key: i.id,
      name: i.name,
      href: getItemUrl(i),
      detail:
        i.rarity !== "unspecified"
          ? RARITIES.find((r) => r.value === i.rarity)?.label
          : undefined,
    })),
    ...classes.map((c) => ({ key: c.id, name: c.name, detail: "Class" })),
    ...collection.subclasses.map((s) => ({
      key: s.id,
      name: `${s.namePreface ? `${s.namePreface} ` : ""}${s.name}`,
      detail: s.className,
    })),
    ...collection.ancestries.map((a) => ({
      key: a.id,
      name: a.name,
      detail: "Ancestry",
    })),
    ...collection.backgrounds.map((b) => ({
      key: b.id,
      name: b.name,
      detail: "Background",
    })),
    ...collection.spellSchools.map((s) => ({
      key: s.id,
      name: s.name,
      detail:
        s.spellCount != null ? plural(s.spellCount, "spell") : "Spell school",
    })),
    ...collection.companions.map((c) => ({
      key: c.id,
      name: c.name,
      detail: "Companion",
    })),
    ...collection.customRules.map((r) => ({
      key: r.id,
      name: r.name,
      detail: "Rule",
    })),
    ...collection.randomTables.map((t) => ({
      key: t.id,
      name: t.name,
      detail: "Reference table",
    })),
  ];

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div
        className={cn(
          "px-5 pt-4 text-[#fffdf8]",
          lineup.length ? "pb-9" : "pb-5",
          INKS[inkIndex(collection.id, week)]
        )}
      >
        <div className="flex min-h-5 items-center justify-between gap-3">
          {week ? (
            <span className="font-condensed text-sm leading-none font-bold tracking-[0.2em] uppercase opacity-80">
              Week {week}
            </span>
          ) : (
            <span />
          )}
          <ul
            aria-label="Contents"
            className="flex flex-wrap justify-end gap-x-3 gap-y-1"
          >
            {counts
              .filter(({ count }) => count > 0)
              .map(({ label, count, Icon }) => (
                <li
                  key={label}
                  title={plural(count, label)}
                  className="flex items-center gap-1 font-semibold tabular-nums"
                >
                  <Icon aria-hidden className="size-4 opacity-80" />
                  {count}
                  <span className="sr-only">
                    {" "}
                    {count === 1 ? label : `${label}s`}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <h3 className="mt-1 font-slab text-3xl leading-[1.05] font-bold tracking-tight text-balance">
          <Link href={href} className="text-inherit hover:underline">
            {title}
          </Link>
        </h3>
      </div>
      {lineup.length > 0 && (
        <div className="-mt-7 flex px-5" aria-hidden>
          {lineup.slice(0, LINEUP_LIMIT).map(({ key, node }) => (
            <div key={key} className="-mr-2.5 rounded-full">
              {node}
            </div>
          ))}
        </div>
      )}
      <ul className="px-5 pt-3 pb-4">
        {rows.slice(0, LIST_LIMIT).map((row) => (
          <li
            key={row.key}
            className="flex items-baseline justify-between gap-2 border-t py-1 first:border-t-0"
          >
            <span className="min-w-0 truncate font-slab text-lg leading-6 italic small-caps">
              {row.href ? <Link href={row.href}>{row.name}</Link> : row.name}
            </span>
            {row.detail && (
              <span className="text-sm whitespace-nowrap text-muted-foreground">
                {row.detail}
              </span>
            )}
          </li>
        ))}
      </ul>
      <CardFooterLayout
        className="px-5 py-3"
        creator={collection.creator}
        attributionSlot={
          collection.contributors?.length ? (
            <Contributors users={collection.contributors} />
          ) : undefined
        }
        reactionsSlot={
          <EntityReactions
            entityType="collection"
            entityId={collection.id}
            likeCount={collection.likeCount}
          />
        }
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

const Contributors = ({ users }: { users: User[] }) => {
  const shown =
    users.length > CONTRIBUTOR_LIMIT
      ? users.slice(0, CONTRIBUTOR_LIMIT - 1)
      : users;
  const hidden = users.length - shown.length;
  return (
    <ul aria-label="Contributors" className="flex pl-1.5">
      {shown.map((user) => (
        <li key={user.id} className="-ml-1.5">
          <NextLink
            href={getUserUrl(user)}
            title={user.displayName}
            className="block rounded-full"
          >
            <UserAvatar
              user={user}
              size={24}
              className="bg-muted ring-2 ring-card"
            />
          </NextLink>
        </li>
      ))}
      {hidden > 0 && (
        <li
          title={plural(hidden, "more contributor")}
          className="relative -ml-1.5 flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums ring-2 ring-card"
        >
          +{hidden}
        </li>
      )}
    </ul>
  );
};
