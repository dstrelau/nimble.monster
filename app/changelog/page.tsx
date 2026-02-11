import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = {
  title: `Changelog - ${SITE_NAME}`,
};

interface ChangelogEntry {
  date: string;
  entries: string[];
}

const changelog: ChangelogEntry[] = [
  {
    date: "11 February 2026",
    entries: ["Add Paperforge image support to companions."],
  },
  {
    date: "10 February 2026",
    entries: ["Add this Changelog."],
  },
  {
    date: "9 February 2026",
    entries: [
      "Link Paperforge minis to paperforgeminis.com instead of Patreon wherever possible.",
      "Monsters API: add type and role attributes and filters.",
    ],
  },
  {
    date: "6 February 2026",
    entries: [
      "Show a notification banner when a new version of the site has been deployed, prompting users to refresh.",
      "Monsters API: add family relationships and /api/families/:id endpoint.",
    ],
  },
  {
    date: "4 February 2026",
    entries: ['Add "Parchment" card theme matching the official GMG styling.'],
  },
  {
    date: "3 February 2026",
    entries: [
      "Move Paperforge attribution on monster cards to the card footer.",
      "Fix a bug where monster and companion abilities/actions were being double-encoded when saving.",
    ],
  },
  {
    date: "2 February 2026",
    entries: ["Add official monsters from the Nimble GMG."],
  },
  {
    date: "29 January 2026",
    entries: [
      "Fix monster images being cut off on the create/edit page.",
      "Fix abilities and actions not displaying correctly on companions and ancestries.",
    ],
  },
  {
    date: "27 January 2026",
    entries: [
      "Fix cursor-based pagination for monsters and items.",
      "Fix a crash on the profile page caused by unparsed ability data.",
      "Monsters API: use correct save stat abbreviations (STR, DEX, INT, WIL) and include parsed saves in responses.",
    ],
  },
  {
    date: "26 January 2026",
    entries: [
      "Add more Paperforge portraits.",
      "Add a dismissible banner explaining that the tool is free to use.",
      "New read-only Items API at /api/items",
    ],
  },
  {
    date: "22 January 2026",
    entries: ['Add "Brief" markdown export option for monster cards.'],
  },
  {
    date: "2 January 2026",
    entries: ["Monster levels now go up to 30 (previously capped at 20)."],
  },
];

export default function ChangelogPage() {
  return (
    <div className="prose prose-neutral dark:prose-invert">
      <h1>Changelog</h1>
      {changelog.map((group) => (
        <section key={group.date}>
          <h2>{group.date}</h2>
          <ul>
            {group.entries.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
