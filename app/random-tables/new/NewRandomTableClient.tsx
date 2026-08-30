"use client";

import { CreateEditRandomTable } from "@/app/random-tables/CreateEditRandomTable";
import { type RandomTable, UNKNOWN_USER } from "@/lib/types";

export function NewRandomTable() {
  const emptyRandomTable: RandomTable = {
    id: "",
    creator: UNKNOWN_USER,
    name: "",
    description: "",
    visibility: "public",
    subtables: [],
  };

  return (
    <div className="container max-w-7xl">
      <CreateEditRandomTable
        randomTable={emptyRandomTable}
        isCreating={true}
        submitLabel="Create"
      />
    </div>
  );
}
