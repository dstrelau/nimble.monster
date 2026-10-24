import { defineRoute } from "@/lib/contract";

export const dismissBanner = defineRoute<
  Record<string, never>,
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/dismissBanner",
});
