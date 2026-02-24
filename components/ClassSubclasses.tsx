import { Attribution } from "@/app/ui/Attribution";
import { Link } from "@/components/app/Link";
import type { SubclassMini, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSubclassUrl } from "@/lib/utils/url";

interface ClassSubclassesProps {
  subclasses: (SubclassMini & { creator: User })[];
}

export function ClassSubclasses({ subclasses }: ClassSubclassesProps) {
  if (subclasses.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-lg">
      <h3 className={cn("font-condensed text-lg pb-1 border-b-2 mb-4")}>
        Subclasses
      </h3>
      <div className="space-y-3">
        {subclasses.map((subclass) => (
          <div key={subclass.id} className="flex gap-2 justify-between">
            <Link
              href={getSubclassUrl(subclass)}
              className="text-lg font-medium"
            >
              {subclass.name}
            </Link>
            <Attribution user={subclass.creator} showUsername={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
