import { defineRoute } from "@/lib/contract";

export const signIn = defineRoute<Record<string, never>, { url: string }>({
  method: "POST",
  path: () => "/_actions/signIn",
});
