import { defineRoute } from "@/lib/contract";

export interface AwardInput {
  name: string;
  abbreviation: string;
  description: string;
  url: string;
  color: string;
  icon: string;
}

export const createAward = defineRoute<AwardInput, { success: true }>({
  method: "POST",
  path: () => "/_actions/createAward",
});
