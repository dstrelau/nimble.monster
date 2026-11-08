import { Link } from "@/components/layout/Link";
import { Attribution } from "@/components/shared/Attribution";
import type { User } from "@/lib/types";
import { getAdventureUrl } from "@/lib/utils/url";

interface UsedInAdventuresProps {
  adventures: { id: string; name: string; creator: User }[];
}

export function UsedInAdventures({ adventures }: UsedInAdventuresProps) {
  if (adventures.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-lg">
      <h3 className="font-condensed text-lg pb-1 border-b-2 mb-4">
        Used In Adventures
      </h3>
      <div className="space-y-3">
        {adventures.map((adventure) => (
          <div key={adventure.id} className="flex gap-2 justify-between">
            <Link
              href={getAdventureUrl(adventure)}
              className="text-lg font-medium"
            >
              {adventure.name}
            </Link>
            <Attribution user={adventure.creator} showUsername={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
