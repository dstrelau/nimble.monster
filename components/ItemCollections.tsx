import { Attribution } from "@/app/ui/Attribution";
import { Link } from "@/components/app/Link";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCollectionUrl } from "@/lib/utils/url";

interface Collection {
  id: string;
  slug?: string | null;
  name: string;
  creator: User;
}

interface ItemCollectionsProps {
  collections: Collection[];
}

export function ItemCollections({ collections }: ItemCollectionsProps) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="w-md">
      <h3 className={cn("font-sans text-lg pb-1 border-b-2 mb-4")}>
        Collected In
      </h3>
      <div className="space-y-3">
        {collections.map((collection) => (
          <div key={collection.id} className="flex gap-2 justify-between">
            <Link
              href={getCollectionUrl(collection)}
              className="text-lg font-medium"
            >
              {collection.name}
            </Link>
            <Attribution user={collection.creator} />
          </div>
        ))}
      </div>
    </div>
  );
}
