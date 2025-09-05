"use client";

import { CreateEditCollection } from "@/app/collections/CreateEditCollection";
import type { Collection, Monster } from "@/lib/types";

interface Props {
  myMonsters: Monster[];
}

export function NewCollection({ myMonsters }: Props) {
  // Create empty collection for creation
  const emptyCollection: Collection = {
    id: "",
    creator: { discordId: "", avatar: "", username: "" },
    name: "",
    description: "",
    visibility: "public",
    monsters: [],
    legendaryCount: 0,
    standardCount: 0,
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
