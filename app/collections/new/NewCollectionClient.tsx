"use client";

import { CreateEditCollection } from "@/app/collections/CreateEditCollection";
import type { FeaturedMembership } from "@/lib/services/collections/queries";
import { type Collection, UNKNOWN_USER } from "@/lib/types";

interface NewCollectionProps {
  /** Omit when the user cannot mark Monstery Monday collections. */
  monsteryMonday?: FeaturedMembership;
}

export function NewCollection({ monsteryMonday }: NewCollectionProps) {
  const emptyCollection: Collection = {
    id: "",
    creator: UNKNOWN_USER,
    name: "",
    description: "",
    visibility: "public",
    monsters: [],
    items: [],
    legendaryCount: 0,
    standardCount: 0,
    itemCount: 0,
    companions: [],
    ancestries: [],
    backgrounds: [],
    subclasses: [],
    classes: [],
    customRules: [],
    spellSchools: [],
  };

  return (
    <div className="container max-w-7xl">
      <CreateEditCollection
        collection={emptyCollection}
        isCreating={true}
        submitLabel="Create"
        monsteryMonday={monsteryMonday}
      />
    </div>
  );
}
