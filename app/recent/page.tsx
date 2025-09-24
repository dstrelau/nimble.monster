import { CollectionCard } from "@/app/ui/CollectionCard";
import { Card as CompanionCard } from "@/app/ui/companion/Card";
import { Card as ItemCard } from "@/app/ui/item/Card";
import { Card as MonsterCard } from "@/app/ui/monster/Card";
import { FamilyCard } from "@/components/FamilyCard";
import { getRecentPublicContent } from "@/lib/db/recent";

export const revalidate = 60;

export default async function RecentPage() {
  const recentContent = await getRecentPublicContent(25);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Recent Content</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-6 [&>*]:w-full">
        {recentContent.map((item) => {
          switch (item.type) {
            case "monster":
              return (
                <MonsterCard
                  key={`monster-${item.id}`}
                  monster={item.data}
                  creator={item.creator}
                />
              );
            case "item":
              return (
                <ItemCard
                  key={`item-${item.id}`}
                  item={item.data}
                  creator={item.creator}
                />
              );
            case "companion":
              return (
                <CompanionCard
                  key={`companion-${item.id}`}
                  companion={item.data}
                  creator={item.creator}
                />
              );
            case "collection":
              return (
                <CollectionCard
                  key={`collection-${item.id}`}
                  collection={item.data}
                />
              );
            case "family":
              return (
                <FamilyCard
                  key={`family-${item.id}`}
                  family={item.data}
                  monsters={item.data.monsters}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
