"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateMyFeatureFlag } from "@/app/%5Factions/updateMyFeatureFlag/contract";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { call } from "@/lib/contract";

export function MonsterCardLayoutToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setError(null);
    setChecked(next);
    startTransition(async () => {
      try {
        await call(updateMyFeatureFlag, {
          feature: "monster-card-layout",
          enabled: next,
        });
        // Re-render the root layout so the app-wide feature flags update.
        router.refresh();
      } catch (error) {
        setChecked(!next);
        setError(
          error instanceof Error ? error.message : "Failed to save setting"
        );
      }
    });
  }

  return (
    <Field orientation="horizontal" data-disabled={pending}>
      <FieldContent>
        <FieldLabel htmlFor="monster-card-layout">
          New Monster Card Styling
        </FieldLabel>
        {error && <FieldError>{error}</FieldError>}
      </FieldContent>
      <Switch
        id="monster-card-layout"
        checked={checked}
        onCheckedChange={handleChange}
        disabled={pending}
      />
    </Field>
  );
}
