import type { LucideIcon } from "lucide-react";
import {
  BookUser,
  Box,
  Drama,
  HandFist,
  HeartHandshake,
  Scroll,
  Shield,
  Swords,
  Users,
  WandSparkles,
} from "lucide-react";
import { Goblin } from "@/components/icons/goblin";
import type { MyLibraryCounts } from "@/lib/db/my-library";

export type EntityType =
  | "monster"
  | "item"
  | "companion"
  | "family"
  | "collection"
  | "school"
  | "class"
  | "subclass"
  | "ancestry"
  | "background";

export interface EntityReference {
  id: string;
  name: string;
  type: EntityType;
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
};

export const MY_LIBRARY_ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  key: keyof MyLibraryCounts;
}[] = [
  {
    href: "/my/monsters",
    label: "Monsters",
    icon: ENTITY_TYPE_ICONS.monster,
    key: "monsters",
  },
  {
    href: "/my/ancestries",
    label: "Ancestries",
    icon: ENTITY_TYPE_ICONS.ancestry,
    key: "ancestries",
  },
  {
    href: "/my/companions",
    label: "Companions",
    icon: ENTITY_TYPE_ICONS.companion,
    key: "companions",
  },
  {
    href: "/my/backgrounds",
    label: "Backgrounds",
    icon: ENTITY_TYPE_ICONS.background,
    key: "backgrounds",
  },
  {
    href: "/my/items",
    label: "Items",
    icon: ENTITY_TYPE_ICONS.item,
    key: "items",
  },
  {
    href: "/my/classes",
    label: "Classes",
    icon: ENTITY_TYPE_ICONS.class,
    key: "classes",
  },
  {
    href: "/my/collections",
    label: "Collections",
    icon: ENTITY_TYPE_ICONS.collection,
    key: "collections",
  },
  {
    href: "/my/encounters",
    label: "Encounters",
    icon: Swords,
    key: "encounters",
  },
  {
    href: "/my/subclasses",
    label: "Subclasses",
    icon: ENTITY_TYPE_ICONS.subclass,
    key: "subclasses",
  },
  {
    href: "/my/families",
    label: "Families",
    icon: ENTITY_TYPE_ICONS.family,
    key: "families",
  },
  {
    href: "/my/spell-schools",
    label: "Spells",
    icon: ENTITY_TYPE_ICONS.school,
    key: "spell-schools",
  },
];
