import { defineRoute } from "@/lib/contract";
import type { User } from "@/lib/types";

export const searchCreators = defineRoute<{ query: string }, User[]>({
  method: "GET",
  path: ({ query }) =>
    `/_actions/searchCreators?${new URLSearchParams({ query })}`,
});
