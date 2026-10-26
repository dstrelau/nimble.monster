import { defineRoute } from "@/lib/contract";
import type { Condition } from "@/lib/types";

export const loadConditionsForDiscordId = defineRoute<
  { discordId: string },
  Condition[]
>({
  method: "GET",
  path: ({ discordId }) =>
    `/_actions/loadConditionsForDiscordId?${new URLSearchParams({ discordId })}`,
});
