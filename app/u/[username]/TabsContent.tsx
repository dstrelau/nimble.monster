"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CollectionCard } from "@/app/ui/CollectionCard";
import { CardGrid as CompanionCardGrid } from "@/app/ui/companion/CardGrid";
import { CardGrid as ItemCardGrid } from "@/app/ui/item/CardGrid";
import { CardGrid as MonsterCardGrid } from "@/app/ui/monster/CardGrid";
import { FamilyCard } from "@/components/FamilyCard";
import {
  TabsContent as ShadcnTabsContent,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type {
  CollectionOverview,
  Companion,
  Condition,
  Family,
  Item,
  Monster,
} from "@/lib/types";

type TabType = "monsters" | "collections" | "families" | "companions" | "items";

export default function TabsContent({
  monsters,
  collections,
  families,
  companions,
  items,
  conditions,
  initialTab,
}: {
  monsters: Monster[];
  collections: CollectionOverview[];
  families: Family[];
  companions: Companion[];
  items: Item[];
  conditions: Condition[];
  initialTab?: "monsters" | "collections" | "families" | "companions" | "items";
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = searchParams.get("tab") as TabType | null;
  const validTabs: TabType[] = [
    "monsters",
    "collections",
    "families",
    "companions",
    "items",
  ];

  const activeTab: TabType =
    tab && validTabs.includes(tab)
      ? tab
      : initialTab && validTabs.includes(initialTab)
        ? initialTab
        : "monsters";
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => router.push(`?tab=${value}`)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="monsters">Monsters ({monsters.length})</TabsTrigger>
        <TabsTrigger value="collections">
          Collections ({collections.length})
        </TabsTrigger>
        <TabsTrigger value="families">Families ({families.length})</TabsTrigger>
        <TabsTrigger value="companions">
          Companions ({companions.length})
        </TabsTrigger>
        <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
      </TabsList>

      <ShadcnTabsContent value="monsters" className="py-6">
        {monsters.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No public monsters available
          </p>
        ) : (
          <MonsterCardGrid monsters={monsters} hideCreator={true} />
        )}
      </ShadcnTabsContent>

      <ShadcnTabsContent value="collections" className="py-6">
        {collections.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No public collections available
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                showVisibilityBadge={false}
                showAttribution={false}
              />
            ))}
          </div>
        )}
      </ShadcnTabsContent>

      <ShadcnTabsContent value="families" className="py-6">
        {families.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No public families available
          </p>
        ) : (
          <div className="grid gap-8 items-start md:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => (
              <FamilyCard key={family.id} family={family} />
            ))}
          </div>
        )}
      </ShadcnTabsContent>

      <ShadcnTabsContent value="companions" className="py-6">
        {companions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No public companions available
          </p>
        ) : (
          <CompanionCardGrid companions={companions} hideActions hideCreator />
        )}
      </ShadcnTabsContent>

      <ShadcnTabsContent value="items" className="py-6">
        {items.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No public items available
          </p>
        ) : (
          <ItemCardGrid items={items} hideCreator conditions={conditions} />
        )}
      </ShadcnTabsContent>
    </Tabs>
  );
}
