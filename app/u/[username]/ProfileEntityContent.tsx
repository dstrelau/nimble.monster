"use client";

import Link from "next/link";
import { PaginatedAncestryGrid } from "@/components/ancestry/PaginatedAncestryGrid";
import { PaginatedBackgroundGrid } from "@/components/background/PaginatedBackgroundGrid";
import { ClassesListView } from "@/components/class/ClassesListView";
import { CollectionCard } from "@/components/collection/CollectionCard";
import { CardGrid as CompanionCardGrid } from "@/components/companion/CardGrid";
import { EncountersListView } from "@/components/encounter/EncountersListView";
import { FamilyCard } from "@/components/family/FamilyCard";
import { CardGrid as ItemCardGrid } from "@/components/item/CardGrid";
import { PaginatedMonsterGrid } from "@/components/monster/PaginatedMonsterGrid";
import { SchoolsListView } from "@/components/school/SchoolsListView";
import { SubclassesListView } from "@/components/subclass/SubclassesListView";
import type { CustomRule } from "@/lib/db/custom-rule";
import type { Item } from "@/lib/services/items";
import type {
  Class,
  CollectionOverview,
  Companion,
  Family,
  SpellSchool,
  Subclass,
} from "@/lib/types";
import { getCustomRuleUrl } from "@/lib/utils/url";

export type ProfileEntityContentProps =
  | {
      entityType: "monsters" | "ancestries" | "backgrounds" | "encounters";
      creatorId: string;
    }
  | { entityType: "collections"; collections: CollectionOverview[] }
  | { entityType: "families"; families: Family[] }
  | { entityType: "companions"; companions: Companion[] }
  | { entityType: "items"; items: Item[] }
  | { entityType: "classes"; classes: Class[] }
  | { entityType: "subclasses"; subclasses: Subclass[] }
  | { entityType: "spell-schools"; spellSchools: SpellSchool[] }
  | { entityType: "rules"; rules: CustomRule[] };

export default function ProfileEntityContent(props: ProfileEntityContentProps) {
  switch (props.entityType) {
    case "monsters":
      return (
        <PaginatedMonsterGrid
          kind="user-monsters"
          creatorId={props.creatorId}
        />
      );
    case "ancestries":
      return (
        <PaginatedAncestryGrid
          kind="user-ancestries"
          creatorId={props.creatorId}
        />
      );
    case "backgrounds":
      return (
        <PaginatedBackgroundGrid
          kind="user-backgrounds"
          creatorId={props.creatorId}
        />
      );
    case "encounters":
      return <EncountersListView creatorId={props.creatorId} />;
    case "collections":
      return props.collections.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No public collections available
        </p>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {props.collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      );
    case "families":
      return props.families.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No public families available
        </p>
      ) : (
        <div className="grid items-start gap-8 md:grid-cols-2 lg:grid-cols-3">
          {props.families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              monsters={family.monsters}
            />
          ))}
        </div>
      );
    case "companions":
      return props.companions.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No public companions available
        </p>
      ) : (
        <CompanionCardGrid companions={props.companions} hideActions />
      );
    case "items":
      return props.items.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No public items available
        </p>
      ) : (
        <ItemCardGrid items={props.items} hideActions />
      );
    case "classes":
      return <ClassesListView classes={props.classes} />;
    case "subclasses":
      return <SubclassesListView subclasses={props.subclasses} />;
    case "spell-schools":
      return <SchoolsListView spellSchools={props.spellSchools} />;
    case "rules":
      return props.rules.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No public custom rules available
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {props.rules.map((rule) => (
            <Link
              key={rule.id}
              href={getCustomRuleUrl(rule)}
              className="group rounded-md border bg-card p-4 text-card-foreground transition-colors hover:bg-accent"
            >
              <h2 className="font-semibold group-hover:underline">
                {rule.name}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {rule.links.length === 0
                  ? "No linked official rules"
                  : `${rule.links.length} linked official ${rule.links.length === 1 ? "rule" : "rules"}`}
              </p>
            </Link>
          ))}
        </div>
      );
  }
}
