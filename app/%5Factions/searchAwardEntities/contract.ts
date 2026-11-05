import { defineRoute } from "@/lib/contract";

export const searchAwardEntities = defineRoute<
  { entityType: string; query: string },
  { id: string; name: string }[]
>({
  method: "GET",
  path: (input) =>
    `/_actions/searchAwardEntities?${new URLSearchParams(input)}`,
});
