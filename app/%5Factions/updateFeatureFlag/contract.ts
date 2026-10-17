import { defineRoute } from "@/lib/contract";
import type { FeatureFlag } from "@/lib/services/featureFlags";

interface UpdateFeatureFlagInput {
  userId: string;
  feature: FeatureFlag;
  enabled: boolean;
}

export const updateFeatureFlag = defineRoute<
  UpdateFeatureFlagInput,
  { success: true }
>({ method: "POST", path: () => "/_actions/updateFeatureFlag" });
