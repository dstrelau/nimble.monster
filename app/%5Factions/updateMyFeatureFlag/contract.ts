import { defineRoute } from "@/lib/contract";
import type { SELF_SERVICE_FEATURE_FLAGS } from "@/lib/services/featureFlags";

interface UpdateMyFeatureFlagInput {
  feature: (typeof SELF_SERVICE_FEATURE_FLAGS)[number];
  enabled: boolean;
}

export const updateMyFeatureFlag = defineRoute<
  UpdateMyFeatureFlagInput,
  { success: true }
>({ method: "POST", path: () => "/_actions/updateMyFeatureFlag" });
