"use client";

import { createContext, useContext } from "react";
import type { FeatureFlag } from "@/lib/services/featureFlags";

const FeatureFlagsContext = createContext<readonly FeatureFlag[]>([]);

export function FeatureFlagsProvider({
  enabledFeatures,
  children,
}: {
  enabledFeatures: readonly FeatureFlag[];
  children: React.ReactNode;
}) {
  return (
    <FeatureFlagsContext value={enabledFeatures}>
      {children}
    </FeatureFlagsContext>
  );
}

export function useFeatureFlag(feature: FeatureFlag): boolean {
  return useContext(FeatureFlagsContext).includes(feature);
}
