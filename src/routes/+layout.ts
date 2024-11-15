import Data from "$lib/data/bestiary.yaml";
import { type Family } from "$lib/types.svelte";

export function load() {
  return {
    families: Data.families.sort((a: Family, b: Family) =>
      a.name.localeCompare(b.name),
    ),
  };
}
