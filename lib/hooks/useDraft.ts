"use client";

import { useDebouncer } from "@tanstack/react-pacer";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteDraft,
  getDraft,
  saveDraft,
} from "@/app/%5Factions/draft/contract";
import { call } from "@/lib/contract";
import type { DraftEntityType } from "@/lib/services/drafts/types";

export type DraftState = "idle" | "loading" | "available" | "stale";

interface UseDraftOptions {
  entityType: DraftEntityType;
  /** Null while creating a new entity. */
  entityId: string | null;
  /** Drafts saved before this are offered as stale. */
  entityUpdatedAt?: Date;
  isLoggedIn: boolean;
  enabled?: boolean;
}

interface UseDraftResult<T> {
  draftState: DraftState;
  draftData: T | null;
  lastSavedAt: Date | null;
  restoreDraft: () => void;
  discardDraft: () => Promise<void>;
  onFormChange: (data: unknown) => void;
  deleteDraftOnSave: () => Promise<void>;
}

export function useDraft<T>({
  entityType,
  entityId,
  entityUpdatedAt,
  isLoggedIn,
  enabled = true,
}: UseDraftOptions): UseDraftResult<T> {
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
    call(getDraft, { entityType, entityId })
      .then((result) => {
        if (cancelled) return;
        if (result.draft) {
          const draftUpdated = new Date(result.draft.updatedAt);
          if (entityUpdatedAt && draftUpdated <= entityUpdatedAt) {
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
  }, [entityType, entityId, entityUpdatedAt, isLoggedIn, enabled]);

  const saveDebouncer = useDebouncer(
    async (data: unknown) => {
      try {
        const result = await call(saveDraft, { entityType, entityId, data });
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
    await call(deleteDraft, { entityType, entityId }).catch(() => undefined);
  }, [entityType, entityId]);

  const deleteDraftOnSave = useCallback(async () => {
    saveDebouncer.cancel();
    setLastSavedAt(null);
    // Draft cleanup must not turn a successful save into an editor error.
    await call(deleteDraft, { entityType, entityId }).catch(() => undefined);
  }, [entityType, entityId, saveDebouncer]);

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
