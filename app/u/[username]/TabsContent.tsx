"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Monster, CollectionOverview, Family } from "@/lib/types";
import { CardGrid } from "@/ui/monster/CardGrid";
import { CollectionCard } from "@/ui/CollectionCard";
import UserFamilyCard from "@/ui/UserFamilyCard";

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
    <>
      <div className="d-tabs d-tabs-border mb-4">
        <div className="d-tabs-list">
          <button
            onClick={() => router.push("?tab=monsters")}
            className={`d-tab ${activeTab === "monsters" ? "d-tab-active" : ""}`}
          >
            Monsters ({monsters.length})
          </button>
          <button
            onClick={() => router.push("?tab=collections")}
            className={`d-tab ${activeTab === "collections" ? "d-tab-active" : ""}`}
          >
            Collections ({collections.length})
          </button>
          <button
            onClick={() => router.push("?tab=families")}
            className={`d-tab ${activeTab === "families" ? "d-tab-active" : ""}`}
          >
            Families ({families.length})
          </button>
        </div>
      </div>

      {/* Monsters Section */}
      {activeTab === "monsters" && (
        <section className="py-6">
          {monsters.length === 0 ? (
            <p className="text-center py-8 text-base-content/70">
              No public monsters available
            </p>
          ) : (
            <CardGrid monsters={monsters} />
          )}
        </section>
      )}

      {/* Collections Section */}
      {activeTab === "collections" && (
        <section className="py-6">
          {collections.length === 0 ? (
            <p className="text-center py-8 text-base-content/70">
              No public collections available
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  showEditDeleteButtons={false}
                  showPublicBadge={false}
                  showAttribution={false}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Families Section */}
      {activeTab === "families" && (
        <section className="py-6">
          {families.length === 0 ? (
            <p className="text-center py-8 text-base-content/70">
              No public families available
            </p>
          ) : (
            <div className="grid gap-8 items-start md:grid-cols-2 lg:grid-cols-3">
              {families.map((family) => (
                <UserFamilyCard key={family.id} family={family} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
