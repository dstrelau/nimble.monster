import { error } from "@sveltejs/kit";
import Monsters from "$lib/data/monsters.yaml";
import { type Family } from "$lib/Bestiary.svelte";

export function load({ params }: { params: { slug: string } }) {
  let family: Family = Monsters.families.find(
    (f: Family) => f.slug == params.slug,
  );
  if (!family) {
    error(404);
  }

  return {
    family,
    monsters: family.monsters,
  };
}
