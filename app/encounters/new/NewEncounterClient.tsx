"use client";

import { CreateEditEncounter } from "@/app/encounters/CreateEditEncounter";
import { type Encounter, UNKNOWN_USER } from "@/lib/types";

export function NewEncounter() {
  const emptyEncounter: Encounter = {
    id: "",
    creator: UNKNOWN_USER,
    name: "",
    description: "",
    visibility: "public",
    heroCount: 4,
    heroLevel: 1,
    monsters: [],
  };

  return (
    <div className="container max-w-7xl">
      <CreateEditEncounter
        encounter={emptyEncounter}
        isCreating={true}
        submitLabel="Create"
      />
    </div>
  );
}
