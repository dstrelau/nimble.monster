import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetDraft, mockSaveDraft, mockDeleteDraft } = vi.hoisted(() => ({
  mockGetDraft: vi.fn(),
  mockSaveDraft: vi.fn(),
  mockDeleteDraft: vi.fn(),
}));

vi.mock("@tanstack/react-pacer", () => ({
  useDebouncer: (fn: (...args: unknown[]) => unknown) => ({
    maybeExecute: (...args: unknown[]) => fn(...args),
    cancel: vi.fn(),
  }),
}));

import { useDraft } from "./useDraft";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("useDraft", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        const input = init.body ? JSON.parse(String(init.body)) : null;
        const result =
          init.method === "GET"
            ? await mockGetDraft(
                new URL(url, "https://nimble.nexus").searchParams.get(
                  "entityId"
                )
              )
            : init.method === "DELETE"
              ? await mockDeleteDraft(input.entityId)
              : await mockSaveDraft(input.entityId, input.data);
        return Response.json(result);
      })
    );
    mockGetDraft.mockResolvedValue({ success: true, draft: null });
    mockSaveDraft.mockResolvedValue({
      success: true,
      updatedAt: new Date().toISOString(),
    });
    mockDeleteDraft.mockResolvedValue({ success: true });
  });

  it("starts in loading state and transitions to idle when no draft", async () => {
    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: null, isLoggedIn: true })
    );

    expect(result.current.draftState).toBe("loading");

    await waitFor(() => {
      expect(result.current.draftState).toBe("idle");
    });
  });

  it("stays idle when not logged in", () => {
    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: null, isLoggedIn: false })
    );

    expect(result.current.draftState).toBe("idle");
    expect(mockGetDraft).not.toHaveBeenCalled();
  });

  it("sets available state when draft exists for new class", async () => {
    mockGetDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "Test" },
        updatedAt: new Date().toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: null, isLoggedIn: true })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("available");
    });
    expect(result.current.draftData).toEqual({ name: "Test" });
  });

  it("sets stale state when draft is older than class updatedAt", async () => {
    const classUpdated = new Date("2026-03-01T12:00:00Z");
    const draftUpdated = new Date("2026-03-01T11:00:00Z");

    mockGetDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "Old" },
        updatedAt: draftUpdated.toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useDraft({
        entityType: "class",
        entityId: "class-1",
        entityUpdatedAt: classUpdated,
        isLoggedIn: true,
      })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("stale");
    });
  });

  it("sets available state when draft is newer than class updatedAt", async () => {
    const classUpdated = new Date("2026-03-01T11:00:00Z");
    const draftUpdated = new Date("2026-03-01T12:00:00Z");

    mockGetDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "New" },
        updatedAt: draftUpdated.toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useDraft({
        entityType: "class",
        entityId: "class-1",
        entityUpdatedAt: classUpdated,
        isLoggedIn: true,
      })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("available");
    });
  });

  it("calls saveDraft on form change", async () => {
    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: null, isLoggedIn: true })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("idle");
    });

    act(() => {
      result.current.onFormChange({ name: "Updated" });
    });

    expect(mockSaveDraft).toHaveBeenCalledWith(null, { name: "Updated" });
  });

  it("does not save when not logged in", async () => {
    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: null, isLoggedIn: false })
    );

    act(() => {
      result.current.onFormChange({ name: "Test" });
    });

    expect(mockSaveDraft).not.toHaveBeenCalled();
  });

  it("restoreDraft sets state to idle", async () => {
    mockGetDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "Draft" },
        updatedAt: new Date().toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: null, isLoggedIn: true })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("available");
    });

    act(() => {
      result.current.restoreDraft();
    });

    expect(result.current.draftState).toBe("idle");
  });

  it("discardDraft deletes and resets state", async () => {
    mockGetDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "Draft" },
        updatedAt: new Date().toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: "class-1", isLoggedIn: true })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("available");
    });

    await act(async () => {
      await result.current.discardDraft();
    });

    expect(result.current.draftState).toBe("idle");
    expect(result.current.draftData).toBeNull();
    expect(mockDeleteDraft).toHaveBeenCalledWith("class-1");
  });

  it("deleteDraftOnSave cleans up after successful save", async () => {
    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: "class-1", isLoggedIn: true })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("idle");
    });

    await act(async () => {
      await result.current.deleteDraftOnSave();
    });

    expect(mockDeleteDraft).toHaveBeenCalledWith("class-1");
    expect(result.current.lastSavedAt).toBeNull();
  });

  it("uses stable GET/POST/DELETE requests without next-action or a GET body", async () => {
    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: "class-1", isLoggedIn: true })
    );
    await waitFor(() => expect(result.current.draftState).toBe("idle"));
    await act(async () => {
      result.current.onFormChange({ name: "Partial" });
    });
    await act(async () => {
      await result.current.discardDraft();
    });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/_actions/draft?entityType=class&entityId=class-1",
      {
        method: "GET",
        credentials: "same-origin",
      }
    );
    for (const method of ["POST", "DELETE"]) {
      expect(fetch).toHaveBeenCalledWith("/_actions/draft", {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          method === "POST"
            ? {
                entityType: "class",
                entityId: "class-1",
                data: { name: "Partial" },
              }
            : { entityType: "class", entityId: "class-1" }
        ),
      });
    }
  });

  it("keeps editing usable after HTTP and network failures and retries on a later edit", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ error: "Forbidden" }, { status: 403 })
    );
    const { result } = renderHook(() =>
      useDraft({ entityType: "class", entityId: null, isLoggedIn: true })
    );
    await waitFor(() => expect(result.current.draftState).toBe("idle"));
    mockSaveDraft.mockRejectedValueOnce(new Error("Network unavailable"));
    await act(async () => {
      result.current.onFormChange({ name: "Retained" });
    });
    expect(result.current.lastSavedAt).toBeNull();
    await act(async () => {
      result.current.onFormChange({ name: "Retained again" });
    });
    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
    mockDeleteDraft.mockRejectedValueOnce(new Error("Network unavailable"));
    await act(async () => {
      await result.current.deleteDraftOnSave();
    });
    expect(result.current.draftState).toBe("idle");
  });
});
