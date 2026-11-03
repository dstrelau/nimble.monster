"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import { updateMyFeatureFlag } from "@/app/%5Factions/updateMyFeatureFlag/contract";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { call } from "@/lib/contract";
import type { SELF_SERVICE_FEATURE_FLAGS } from "@/lib/services/featureFlags";

interface FeatureFlagConfirmation {
  title: string;
  description: ReactNode;
}

interface FeatureFlagToggleProps {
  feature: (typeof SELF_SERVICE_FEATURE_FLAGS)[number];
  label: string;
  enabled: boolean;
  /** Shown before the user enables the flag for the first time. */
  confirmation?: FeatureFlagConfirmation;
}

export function FeatureFlagToggle({
  feature,
  label,
  enabled,
  confirmation,
}: FeatureFlagToggleProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: boolean) {
    setError(null);
    setChecked(next);
    startTransition(async () => {
      try {
        await call(updateMyFeatureFlag, { feature, enabled: next });
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

  function handleChange(next: boolean) {
    if (next && confirmation) {
      setConfirming(true);
      return;
    }
    save(next);
  }

  return (
    <Field orientation="horizontal" data-disabled={pending}>
      <FieldContent>
        <FieldLabel htmlFor={feature}>{label}</FieldLabel>
        {error && <FieldError>{error}</FieldError>}
      </FieldContent>
      <Switch
        id={feature}
        checked={checked}
        onCheckedChange={handleChange}
        disabled={pending}
      />
      {confirmation && (
        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmation.title}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">{confirmation.description}</div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => save(true)}>
                Agree
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Field>
  );
}
