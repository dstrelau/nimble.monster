import { defineRoute } from "@/lib/contract";
import type { SubclassClassOption } from "@/lib/db/class";

export const searchClassesForSubclass = defineRoute<
  { searchTerm?: string },
  SubclassClassOption[]
>({
  method: "GET",
  path: ({ searchTerm }) => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("searchTerm", searchTerm);
    const query = params.toString();
    return `/_actions/searchClassesForSubclass${query ? `?${query}` : ""}`;
  },
});
