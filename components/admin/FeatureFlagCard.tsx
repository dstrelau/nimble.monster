"use client";

import { updateFeatureFlag } from "@/app/%5Factions/updateFeatureFlag/contract";
import { call } from "@/lib/contract";
import type { FeatureFlag } from "@/lib/services/featureFlags";
import type { User } from "@/lib/types";
import { UserAccessCard } from "./UserAccessCard";

interface FeatureFlagCardProps {
  feature: FeatureFlag;
  users: User[];
}

export function FeatureFlagCard({ feature, users }: FeatureFlagCardProps) {
  return (
    <UserAccessCard
      name={feature}
      users={users}
      emptyMessage="No users have this flag."
      onChange={(userId, enabled) =>
        call(updateFeatureFlag, { userId, feature, enabled })
      }
    />
  );
}
