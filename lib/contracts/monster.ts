import { defineRoute } from "@/lib/contract";
import type {
  CreateMonsterInput,
  Monster,
  UpdateMonsterInput,
} from "@/lib/services/monsters";

export const createMonster = defineRoute<CreateMonsterInput, Monster>({
  method: "POST",
  path: () => "/_actions/createMonster",
});

export const updateMonster = defineRoute<UpdateMonsterInput, Monster>({
  method: "POST",
  path: () => "/_actions/updateMonster",
});
