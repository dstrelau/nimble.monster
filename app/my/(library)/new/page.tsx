import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import type { MyLibraryCounts } from "@/lib/db/my-library";
import {
  MY_LIBRARY_GROUPS,
  MY_LIBRARY_PRIVATE_ITEMS,
} from "@/lib/types/entity-links";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = { title: `Create - ${SITE_NAME}` };

const CREATE_TARGETS: Partial<
  Record<keyof MyLibraryCounts, { name: string; href: string }>
> = {
  monsters: { name: "Monster", href: "/monsters/new" },
  hazards: { name: "Hazard", href: "/hazards/new" },
  families: { name: "Family", href: "/families/new" },
  companions: { name: "Companion", href: "/companions/new" },
  ancestries: { name: "Ancestry", href: "/ancestries/new" },
  backgrounds: { name: "Background", href: "/backgrounds/new" },
  classes: { name: "Class", href: "/classes/new" },
  subclasses: { name: "Subclass", href: "/subclasses/new" },
  "spell-schools": { name: "Spell School", href: "/spell-schools/new" },
  items: { name: "Item", href: "/items/new" },
  adventures: { name: "Adventure", href: "/adventures/new" },
  encounters: { name: "Encounter", href: "/encounters/new" },
  rules: { name: "Rule", href: "/custom-rules/new" },
  "random-tables": { name: "Reference Table", href: "/tables/new" },
  collections: { name: "Collection", href: "/collections/new" },
};

const TYPES = MY_LIBRARY_GROUPS.flatMap((group) =>
  group.label === "Play"
    ? [...group.items, ...MY_LIBRARY_PRIVATE_ITEMS]
    : group.items
).flatMap((item) => {
  const target = CREATE_TARGETS[item.key];
  return target ? [{ ...target, key: item.key, icon: item.icon }] : [];
});

export default function MyNewPage() {
  return (
    <div className="space-y-6">
      <MyLibraryPageHeader icon={Plus} title="Create" />
      <ul className="grid gap-2 md:grid-cols-2">
        {TYPES.map((type) => (
          <li key={type.key}>
            <Link
              href={type.href}
              className="group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="flex size-9 shrink-0 items-center justify-center">
                <type.icon className="size-5 text-muted-foreground group-hover:text-primary" />
              </span>
              <span className="font-medium group-hover:underline">
                {type.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
