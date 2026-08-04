import Link from "next/link";
import { AdventureList } from "@/components/adventure/AdventureList";
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
import type { AdventureOverview } from "@/lib/db/adventures";
import type { CustomRule, CustomRuleRelation } from "@/lib/db/custom-rule";
import { getRule } from "@/lib/rules/filesystem";
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
      entityType:
        | "monsters"
        | "hazards"
        | "ancestries"
        | "backgrounds"
        | "encounters";
      creatorId: string;
    }
  | { entityType: "adventures"; adventures: AdventureOverview[] }
  | { entityType: "collections"; collections: CollectionOverview[] }
  | { entityType: "families"; families: Family[] }
  | { entityType: "companions"; companions: Companion[] }
  | { entityType: "items"; items: Item[] }
  | { entityType: "classes"; classes: Class[] }
  | { entityType: "subclasses"; subclasses: Subclass[] }
  | { entityType: "spell-schools"; spellSchools: SpellSchool[] }
  | { entityType: "rules"; rules: CustomRule[] };

function linkedRuleTitles(
  rule: CustomRule,
  relation: CustomRuleRelation
): string {
  return rule.links
    .filter((link) => link.relation === relation)
    .map((link) => getRule(link.ruleSlug)?.title ?? link.ruleSlug)
    .join(", ");
}

export default function ProfileEntityContent(props: ProfileEntityContentProps) {
  switch (props.entityType) {
    case "monsters":
      return (
        <PaginatedMonsterGrid
          kind="user-monsters"
          creatorId={props.creatorId}
        />
      );
    case "hazards":
      return (
        <PaginatedMonsterGrid
          kind="user-monsters"
          creatorId={props.creatorId}
          entityType="hazards"
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
    case "adventures":
      return (
        <AdventureList
          adventures={props.adventures}
          emptyMessage="No public adventures available"
        />
      );
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
          {props.rules.map((rule) => {
            const replaces = linkedRuleTitles(rule, "replaces");
            const augments = linkedRuleTitles(rule, "augments");
            return (
              <Link
                key={rule.id}
                href={getCustomRuleUrl(rule)}
                className="group rounded-md border bg-card p-4 text-card-foreground transition-colors hover:bg-accent"
              >
                <h2 className="font-semibold group-hover:underline">
                  {rule.name}
                </h2>
                {rule.links.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No linked official rules
                  </p>
                ) : (
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {replaces && <p>Replaces: {replaces}</p>}
                    {augments && <p>Augments: {augments}</p>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      );
  }
}
