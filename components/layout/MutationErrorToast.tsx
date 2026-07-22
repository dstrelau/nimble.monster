"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  dismissMutationError,
  getMutationErrorSnapshot,
  subscribeMutationError,
} from "@/lib/mutationErrors";

const AUTO_DISMISS_MS = 6000;

export function MutationErrorToast() {
  const message = useSyncExternalStore(
    subscribeMutationError,
    getMutationErrorSnapshot,
    () => null
  );

  useEffect(() => {
    if (message === null) {
      return;
    }
    const timeout = setTimeout(dismissMutationError, AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [message]);

  if (message === null) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border border-destructive/50 bg-background px-4 py-3 shadow-lg">
      <p className="text-foreground text-sm">{message}</p>
      <button
        type="button"
        onClick={dismissMutationError}
        className="mt-1 font-medium text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
      >
        Dismiss
      </button>
    </div>
  );
}
