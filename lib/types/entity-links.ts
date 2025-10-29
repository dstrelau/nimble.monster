import type { LucideIcon } from "lucide-react";
import {
  Box,
  Drama,
  HandFist,
  HeartHandshake,
  Scroll,
  Shield,
  Users,
  WandSparkles,
} from "lucide-react";
import { Goblin } from "@/components/icons/goblin";

export type EntityType =
  | "monster"
  | "item"
  | "companion"
  | "family"
  | "collection"
  | "school"
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
  subclass: "subclasses",
  ancestry: "ancestries",
  background: "backgrounds",
};
