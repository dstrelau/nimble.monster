import { error } from "@sveltejs/kit";
import Data from "$lib/data/bestiary.yaml";
import { type Family } from "$lib/types.svelte";

export function load({ params }: { params: { slug: string } }) {
  let family: Family = Data.families.find((f: Family) => f.slug == params.slug);
  if (!family) {
    error(404);
  }

  return {
    family,
    monsters: family.monsters,
  };
}
