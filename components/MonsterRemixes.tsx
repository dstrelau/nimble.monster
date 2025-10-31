import { Attribution } from "@/app/ui/Attribution";
import { Link } from "@/components/app/Link";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getMonsterUrl } from "@/lib/utils/url";

interface Remix {
  id: string;
  name: string;
  creator: User;
}

interface MonsterRemixesProps {
  remixes: Remix[];
}

export function MonsterRemixes({ remixes }: MonsterRemixesProps) {
  if (remixes.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-lg">
      <h3 className={cn("font-condensed text-lg pb-1 border-b-2 mb-4")}>
        Remixes
      </h3>
      <div className="space-y-3">
        {remixes.map((remix) => (
          <div key={remix.id} className="flex gap-2 justify-between">
            <Link href={getMonsterUrl(remix)} className="text-lg font-medium">
              {remix.name}
            </Link>
            <Attribution user={remix.creator} showUsername={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
