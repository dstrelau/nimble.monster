import { error } from "@sveltejs/kit";
import Monsters from "$lib/data/monsters.yaml";
import { type Monster, type Family } from "$lib/Bestiary.svelte";

export function load({ params }: { params: { slug: string } }) {
  let family = Monsters.families.find((f: Family) => {
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
