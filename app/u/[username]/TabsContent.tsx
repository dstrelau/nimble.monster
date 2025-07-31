"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Monster, CollectionOverview, Family } from "@/lib/types";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { CollectionCard } from "@/app/ui/CollectionCard";
import { FamilyCard } from "@/components/FamilyCard";
import {
  Tabs,
  TabsContent as ShadcnTabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type TabType = "monsters" | "collections" | "families";

export default function TabsContent({
  monsters,
  collections,
  families,
  initialTab,
}: {
  monsters: Monster[];
  collections: CollectionOverview[];
  families: Family[];
  initialTab?: "monsters" | "collections" | "families";
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = searchParams.get("tab");
  const activeTab: TabType =
    tab === "collections" || tab === "families"
      ? tab
      : initialTab === "collections" || initialTab === "families"
        ? initialTab
        : "monsters";

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => router.push(`?tab=${value}`)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="monsters">Monsters ({monsters.length})</TabsTrigger>
        <TabsTrigger value="collections">
          Collections ({collections.length})
        </TabsTrigger>
        <TabsTrigger value="families">Families ({families.length})</TabsTrigger>
      </TabsList>

      <ShadcnTabsContent value="monsters" className="py-6">
        {monsters.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No public monsters available
          </p>
        ) : (
          <CardGrid monsters={monsters} />
        )}
      </ShadcnTabsContent>

      <ShadcnTabsContent value="collections" className="py-6">
        {collections.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No public collections available
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                showEditDeleteButtons={false}
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
    </Tabs>
  );
}
