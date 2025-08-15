import { Attribution } from "@/app/ui/Attribution";
import { VisibilityBadge } from "@/app/ui/VisibilityBadge";
import { MonsterGroupMinis } from "@/components/MonsterGroupMinis";
import type { CollectionOverview } from "@/lib/types";

export const CollectionCard = ({
  collection,
  showAttribution,
  showVisibilityBadge = true,
}: {
  collection: CollectionOverview;
  showVisibilityBadge: boolean;
  showAttribution: boolean;
}) => {
  return (
    <MonsterGroupMinis
      name={collection.name}
      href={`/collections/${collection.id}`}
      monsters={collection.monsters}
      badge={
        showVisibilityBadge ? (
          <VisibilityBadge visibility={collection.visibility} />
        ) : null
      }
      attribution={showAttribution && <Attribution user={collection.creator} />}
    ></MonsterGroupMinis>
  );
};
