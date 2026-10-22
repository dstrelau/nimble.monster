import { defineRoute } from "@/lib/contract";

export const addMonsterToEncounter = defineRoute<
  {
    monsterId: string;
    encounterId: string;
    quantity: number;
    isPerHero: boolean;
    heroesPerMonster: number;
  },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addMonsterToEncounter",
});
