"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateFeatureFlag } from "@/app/%5Factions/updateFeatureFlag/contract";
import { Button } from "@/components/ui/button";
import { call } from "@/lib/contract";
import type { FeatureFlag } from "@/lib/services/featureFlags";

interface FeatureFlagControlProps {
  userId: string;
  feature: FeatureFlag;
  enabled: boolean;
}

export function FeatureFlagControl({
  userId,
  feature,
  enabled,
}: FeatureFlagControlProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await call(updateFeatureFlag, { userId, feature, enabled: !enabled });
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to save flag"
        );
      }
    });
  }

  return (
    <div className="py-4 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium break-words">{feature}</p>
          <output className="block text-sm text-muted-foreground">
            {enabled ? "Enabled" : "Disabled"}
          </output>
        </div>
        <Button
          variant="outline"
          onClick={save}
          disabled={pending}
          aria-label={`${enabled ? "Disable" : "Enable"} ${feature}`}
        >
          {pending ? "Saving…" : enabled ? "Disable" : "Enable"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
