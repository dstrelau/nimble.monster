import Monsters from "$lib/data/monsters.yaml";
import { type Family } from "$lib/Bestiary.svelte";

export function load() {
  return {
    monsters: Monsters.monsters,
    families: Monsters.families.sort((a: Family, b: Family) =>
      a.name.localeCompare(b.name),
    ),
  };
}
