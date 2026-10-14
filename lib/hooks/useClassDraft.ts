"use client";

import { useDebouncer } from "@tanstack/react-pacer";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteClassDraft,
  getClassDraft,
  saveClassDraft,
} from "@/app/%5Factions/classDraft/contract";
import { call } from "@/lib/contract";

export type DraftState = "idle" | "loading" | "available" | "stale";

interface UseClassDraftOptions {
  classId: string | null;
  classUpdatedAt?: Date;
  isLoggedIn: boolean;
  enabled?: boolean;
}

interface UseClassDraftResult<T> {
  draftState: DraftState;
  draftData: T | null;
  lastSavedAt: Date | null;
  restoreDraft: () => void;
  discardDraft: () => Promise<void>;
  onFormChange: (data: unknown) => void;
  deleteDraftOnSave: () => Promise<void>;
}

export function useClassDraft<T>({
  classId,
  classUpdatedAt,
  isLoggedIn,
  enabled = true,
}: UseClassDraftOptions): UseClassDraftResult<T> {
  const [draftState, setDraftState] = useState<DraftState>("idle");
  const [draftData, setDraftData] = useState<T | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  // Track component unmount for debouncer callbacks
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load draft on mount / when deps change
  useEffect(() => {
    let cancelled = false;
    if (!isLoggedIn || !enabled)
      return () => {
        cancelled = true;
      };

    setDraftState("loading");
    call(getClassDraft, { classId })
      .then((result) => {
        if (cancelled) return;
        if (result.draft) {
          const draftUpdated = new Date(result.draft.updatedAt);
          if (classUpdatedAt && draftUpdated <= classUpdatedAt) {
            setDraftState("stale");
          } else {
            setDraftState("available");
          }
          setDraftData(result.draft.data as T);
          setLastSavedAt(draftUpdated);
        } else {
          setDraftState("idle");
        }
      })
      .catch(() => {
        // Autosave is best-effort; a failed load must not block editing.
        if (!cancelled) setDraftState("idle");
      });

    return () => {
      cancelled = true;
    };
  }, [classId, classUpdatedAt, isLoggedIn, enabled]);

  const saveDebouncer = useDebouncer(
    async (data: unknown) => {
      try {
        const result = await call(saveClassDraft, { classId, data });
        if (mountedRef.current) {
          setLastSavedAt(new Date(result.updatedAt));
        }
      } catch {
        // Keep input and the last confirmed save time; a later edit can retry.
      }
    },
    { wait: 3000 }
  );

  const onFormChange = useCallback(
    (data: unknown) => {
      if (!isLoggedIn || !enabled) return;
      saveDebouncer.maybeExecute(data);
    },
    [isLoggedIn, enabled, saveDebouncer]
  );

  const restoreDraft = useCallback(() => {
    setDraftState("idle");
  }, []);

  const discardDraft = useCallback(async () => {
    setDraftState("idle");
    setDraftData(null);
    setLastSavedAt(null);
    await call(deleteClassDraft, { classId }).catch(() => undefined);
  }, [classId]);

  const deleteDraftOnSave = useCallback(async () => {
    saveDebouncer.cancel();
    setLastSavedAt(null);
    // Draft cleanup must not turn a successful class save into an editor error.
    await call(deleteClassDraft, { classId }).catch(() => undefined);
  }, [classId, saveDebouncer]);

  return {
    draftState,
    draftData,
    lastSavedAt,
    restoreDraft,
    discardDraft,
    onFormChange,
    deleteDraftOnSave,
  };
}
