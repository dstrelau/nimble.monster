import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type { Spell, SpellSchool } from "@/lib/types";

// The school loader's spells have no recursive school back-reference.
export const listPublicSpellSchools = defineRoute<
  void,
  Jsonify<Omit<SpellSchool, "spells"> & { spells: Omit<Spell, "school">[] }>[]
>({
  method: "GET",
  path: () => "/_actions/listPublicSpellSchools",
});
