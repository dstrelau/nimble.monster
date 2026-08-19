"use client";

import { CollectionCard } from "@/components/collection/CollectionCard";
import { EncounterCard } from "@/components/encounter/EncounterCard";
import { Card as SpellSchoolCard } from "@/components/school/Card";
import { Card as SubclassCard } from "@/components/subclass/Card";
import type {
  CollectionOverview,
  EncounterOverview,
  SpellSchool,
  Subclass,
  User,
} from "@/lib/types";

const DEMO_DATE = new Date("2026-01-01T00:00:00.000Z");
const COMPACT_TEXT =
  "The first compact paragraph stays in place.\n\nThe second compact paragraph must not expand the component.";

const creator: User = {
  id: "formatted-text-demo-user",
  discordId: "",
  username: "formatted-text-demo",
  displayName: "FormattedText Demo",
};

const subclass: Subclass = {
  id: "",
  name: "Compact Tagline",
  classId: null,
  className: "Demo Class",
  tagline: COMPACT_TEXT,
  description: "The description remains a normal block paragraph.",
  visibility: "public",
  levels: [],
  abilityLists: [],
  creator,
  createdAt: DEMO_DATE,
  updatedAt: DEMO_DATE,
};

const spellSchool: SpellSchool = {
  id: "",
  name: "Compact Spell",
  description: "School descriptions remain normal block paragraphs.",
  visibility: "public",
  spells: [
    {
      id: "formatted-text-demo-spell",
      schoolId: "",
      name: "Unbroken Flow",
      tier: 1,
      actions: 1,
      reaction: true,
      description: COMPACT_TEXT,
      upcast: "The Upcast label must remain in the spell's metadata flow.",
      createdAt: DEMO_DATE,
      updatedAt: DEMO_DATE,
    },
  ],
  creator,
  createdAt: DEMO_DATE,
  updatedAt: DEMO_DATE,
};

const collection: CollectionOverview = {
  id: "",
  name: "Compact Collection Preview",
  description: COMPACT_TEXT,
  visibility: "public",
  creator,
  legendaryCount: 0,
  standardCount: 0,
  itemCount: 0,
  monsters: [],
  items: [],
  companions: [],
  ancestries: [],
  backgrounds: [],
  subclasses: [],
  spellSchools: [],
  classes: [],
};

const encounter: EncounterOverview = {
  id: "",
  name: "Compact Encounter Preview",
  description: COMPACT_TEXT,
  visibility: "public",
  creator,
  heroCount: 4,
  heroLevel: 1,
  monsters: [],
};

export function CompactComponentDemos() {
  return (
    <section aria-labelledby="compact-component-stress-test">
      <div className="mb-3">
        <h2
          id="compact-component-stress-test"
          className="font-slab text-2xl font-bold"
        >
          Compact production components
        </h2>
        <p className="text-sm text-muted-foreground">
          These are the real components, each injected with two parsed
          paragraphs. They should remain compact without clipping or displacing
          adjacent metadata.
        </p>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div data-compact-component="subclass-tagline">
          <SubclassCard subclass={subclass} link={false} />
        </div>
        <div data-compact-component="spell-description">
          <SpellSchoolCard spellSchool={spellSchool} link={false} />
        </div>
        <div data-compact-component="collection-preview">
          <CollectionCard collection={collection} />
        </div>
        <div data-compact-component="encounter-preview">
          <EncounterCard encounter={encounter} />
        </div>
      </div>
    </section>
  );
}
