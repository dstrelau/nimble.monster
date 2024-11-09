import { error } from "@sveltejs/kit";
import Data from "$lib/data/bestiary.yaml";
import { type Monster, type Family } from "$lib/types.svelte";

import type { EntryGenerator, RouteParams } from "./$types";

export const entries: EntryGenerator = (): RouteParams[] =>
  Data.families
    .flatMap((f: Family) => f.monsters)
    .map((m: Monster) => ({ slug: m.slug }));

export function load({ params }: { params: { slug: string } }) {
  let family = Data.families.find((f: Family) => {
    return f.monsters?.find((m: Monster) => params.slug == m.slug);
  });
  let selected = family?.monsters.find((m: Monster) => params.slug == m.slug);
  if (!selected) {
    error(404);
  }

  return {
    selected,
    family,
  };
}
