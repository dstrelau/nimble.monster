"use client";

import { CreateEditCollection } from "@/app/collections/CreateEditCollection";
import { type Collection, UNKNOWN_USER } from "@/lib/types";

export function NewCollection() {
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
    spellSchools: [],
  };

  return (
    <div className="container max-w-7xl">
      <CreateEditCollection
        collection={emptyCollection}
        isCreating={true}
        submitLabel="Create"
      />
    </div>
  );
}
