import Data from "$lib/data/bestiary.yaml";
import { type Monster, type Family } from "$lib/types.svelte";

export function load({ params }: { params: { slug: string } }) {
  let family = Data.families.find((f: Family) => {
    return f.monsters?.find((m: Monster) => params.slug == m.slug);
  });
  let selected = family?.monsters.find((m: Monster) => params.slug == m.slug);

  return {
    selected,
    family,
  };
}
