import { defineRoute } from "@/lib/contract";
import type { User } from "@/lib/types";

export const getTopMonsterCreators = defineRoute<void, User[]>({
  method: "GET",
  path: () => "/_actions/getTopMonsterCreators",
});
