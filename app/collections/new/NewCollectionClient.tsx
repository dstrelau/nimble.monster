"use client";

import { CreateEditCollection } from "@/app/collections/CreateEditCollection";
import { type Collection, type Monster, UNKNOWN_USER } from "@/lib/types";

interface Props {
  myMonsters: Monster[];
}

export function NewCollection({ myMonsters }: Props) {
  // Create empty collection for creation
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
  };

  return (
    <div className="container max-w-7xl">
      <CreateEditCollection
        collection={emptyCollection}
        myMonsters={myMonsters}
        isCreating={true}
        submitLabel="Create"
      />
    </div>
  );
}
