import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BookUser,
  Box,
  Drama,
  HandFist,
  HeartHandshake,
  Map as MapIcon,
  NotebookPen,
  Scroll,
  Shield,
  Swords,
  TriangleAlert,
  Users,
  WandSparkles,
} from "lucide-react";
import { Goblin } from "@/components/icons/goblin";
import type { MyLibraryCounts } from "@/lib/db/my-library";

export const ENTITY_TYPES = [
  "monster",
  "item",
  "companion",
  "family",
  "collection",
  "school",
  "class",
  "subclass",
  "ancestry",
  "background",
  "rule",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export function isEntityType(value: string): value is EntityType {
  return ENTITY_TYPES.some((type) => type === value);
}

export interface EntityReference {
  id: string;
  name: string;
  type: EntityType;
  href?: string;
}

export const ENTITY_TYPE_ICONS: Record<EntityType, LucideIcon> = {
  monster: Goblin,
  item: Shield,
  companion: HeartHandshake,
  family: Users,
  collection: Box,
  school: WandSparkles,
  class: BookUser,
  subclass: HandFist,
  ancestry: Scroll,
  background: Drama,
  rule: NotebookPen,
};

export const ENTITY_TYPE_PATHS: Record<EntityType, string> = {
  monster: "monsters",
  item: "items",
  companion: "companions",
  family: "families",
  collection: "collections",
  school: "spell-schools",
  class: "classes",
  subclass: "subclasses",
  ancestry: "ancestries",
  background: "backgrounds",
  rule: "custom-rules",
};

export type SiteNavigationItemKey =
  | "monsters"
  | "hazards"
  | "companions"
  | "ancestries"
  | "backgrounds"
  | "classes"
  | "subclasses"
  | "spell-schools"
  | "items"
  | "adventures"
  | "encounters"
  | "rules";

export interface SiteNavigationItem {
  key: SiteNavigationItemKey;
  label: string;
  icon: LucideIcon;
}

export interface SiteNavigationGroup {
  id: "bestiary" | "heroes" | "gear" | "play";
  label: string;
  items: SiteNavigationItem[];
}

export const SITE_NAVIGATION_GROUPS: SiteNavigationGroup[] = [
  {
    id: "bestiary",
    label: "Bestiary",
    items: [
      {
        key: "monsters",
        label: "Monsters",
        icon: ENTITY_TYPE_ICONS.monster,
      },
      { key: "hazards", label: "Hazards", icon: TriangleAlert },
      {
        key: "companions",
        label: "Companions",
        icon: ENTITY_TYPE_ICONS.companion,
      },
    ],
  },
  {
    id: "heroes",
    label: "Heroes",
    items: [
      {
        key: "ancestries",
        label: "Ancestries",
        icon: ENTITY_TYPE_ICONS.ancestry,
      },
      {
        key: "backgrounds",
        label: "Backgrounds",
        icon: ENTITY_TYPE_ICONS.background,
      },
      {
        key: "classes",
        label: "Classes",
        icon: ENTITY_TYPE_ICONS.class,
      },
      {
        key: "subclasses",
        label: "Subclasses",
        icon: ENTITY_TYPE_ICONS.subclass,
      },
      {
        key: "spell-schools",
        label: "Spells",
        icon: ENTITY_TYPE_ICONS.school,
      },
    ],
  },
  {
    id: "gear",
    label: "Gear",
    items: [{ key: "items", label: "Items", icon: ENTITY_TYPE_ICONS.item }],
  },
  {
    id: "play",
    label: "Play",
    items: [
      { key: "adventures", label: "Adventures", icon: MapIcon },
      { key: "encounters", label: "Encounters", icon: Swords },
      { key: "rules", label: "Rules", icon: BookOpen },
    ],
  },
];

export interface MyLibraryItem {
  href: string;
  label: string;
  icon: LucideIcon;
  key: keyof MyLibraryCounts;
}

export const MY_LIBRARY_GROUPS: {
  label?: string;
  items: MyLibraryItem[];
}[] = [
  ...SITE_NAVIGATION_GROUPS.map((group) => {
    const items = group.items.map((item): MyLibraryItem => {
      if (item.key === "rules") {
        return {
          href: "/my/rules",
          label: "Custom Rules",
          icon: NotebookPen,
          key: "rules",
        };
      }

      return {
        href: `/my/${item.key}`,
        label: item.label,
        icon: item.icon,
        key: item.key,
      };
    });
    const familyItem: MyLibraryItem = {
      href: "/my/families",
      label: "Families",
      icon: ENTITY_TYPE_ICONS.family,
      key: "families",
    };

    return {
      label: group.label,
      items:
        group.id === "bestiary"
          ? [...items.slice(0, 2), familyItem, ...items.slice(2)]
          : items,
    };
  }),
  {
    items: [
      {
        href: "/my/collections",
        label: "Collections",
        icon: ENTITY_TYPE_ICONS.collection,
        key: "collections",
      },
    ],
  },
];

export const MY_LIBRARY_ITEMS = MY_LIBRARY_GROUPS.flatMap(
  (group) => group.items
);
