import { defineRoute } from "@/lib/contract";
import type { CollectionVisibilityType } from "@/lib/types";

export interface EncounterMonsterInput {
  monsterId: string;
  quantity: number;
  isPerHero: boolean;
  heroesPerMonster: number;
}

export interface SaveEncounterInput {
  id?: string;
  name: string;
  visibility: CollectionVisibilityType;
  description?: string;
  heroCount: number;
  heroLevel: number;
  monsters: EncounterMonsterInput[];
}

export interface SaveCollectionInput {
  id?: string;
  name: string;
  visibility: CollectionVisibilityType;
  description?: string;
  monsterIds: string[];
  itemIds: string[];
  companionIds: string[];
  ancestryIds: string[];
  backgroundIds: string[];
  subclassIds: string[];
  spellSchoolIds: string[];
  classIds: string[];
}

export interface EditorMutationResult {
  id: string;
  name: string;
}

export const saveEncounter = defineRoute<
  SaveEncounterInput,
  EditorMutationResult
>({
  method: "POST",
  path: () => "/_actions/saveEncounter",
});

export const saveCollection = defineRoute<
  SaveCollectionInput,
  EditorMutationResult
>({
  method: "POST",
  path: () => "/_actions/saveCollection",
});
