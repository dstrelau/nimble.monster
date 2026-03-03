"use client";

import { useDebouncer } from "@tanstack/react-pacer";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteClassDraft,
  getClassDraft,
  saveClassDraft,
} from "@/app/actions/classDraft";

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
    getClassDraft(classId).then((result) => {
      if (cancelled) return;
      if (result.success && result.draft) {
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
    });

    return () => {
      cancelled = true;
    };
  }, [classId, classUpdatedAt, isLoggedIn, enabled]);

  const saveDebouncer = useDebouncer(
    async (data: unknown) => {
      const result = await saveClassDraft(classId, data);
      if (result.success && result.updatedAt && mountedRef.current) {
        setLastSavedAt(new Date(result.updatedAt));
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
    await deleteClassDraft(classId);
  }, [classId]);

  const deleteDraftOnSave = useCallback(async () => {
    saveDebouncer.cancel();
    setLastSavedAt(null);
    await deleteClassDraft(classId);
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
