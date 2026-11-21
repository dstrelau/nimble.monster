import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dev Labs",
  robots: { index: false, follow: false },
};

const DEV_PAGES = [
  {
    href: "/dev/text-formatting",
    name: "Text formatting",
    description: "FormattedText fixtures and every entity that renders it.",
  },
  {
    href: "/dev/entity-references",
    name: "Entity references",
    description: "Entity link and reference rendering.",
  },
  {
    href: "/dev/monster-card",
    name: "Monster card",
    description: "Monster card layouts.",
  },
  {
    href: "/dev/monster-card/levels",
    name: "Monster card levels",
    description: "Monster cards across levels.",
  },
  {
    href: "/dev/random-tables",
    name: "Random tables",
    description: "Table editor playground with stress-test tables.",
  },
  {
    href: "/dev/reference-table-card",
    name: "Reference table card",
    description: "Reference table card states.",
  },
  {
    href: "/dev/entities/items",
    name: "Items",
    description: "Item entity lab.",
  },
];

export default function DevIndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-slab font-black text-4xl">Dev labs</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {DEV_PAGES.map((page) => (
          <li key={page.href}>
            <Link
              href={page.href}
              className="block rounded-lg border p-4 hover:bg-accent"
            >
              <div className="font-semibold">{page.name}</div>
              <div className="text-sm text-muted-foreground">
                {page.description}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {page.href}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
