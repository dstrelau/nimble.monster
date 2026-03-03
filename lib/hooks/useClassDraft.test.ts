import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetClassDraft, mockSaveClassDraft, mockDeleteClassDraft } =
  vi.hoisted(() => ({
    mockGetClassDraft: vi.fn(),
    mockSaveClassDraft: vi.fn(),
    mockDeleteClassDraft: vi.fn(),
  }));

vi.mock("@/app/actions/classDraft", () => ({
  getClassDraft: mockGetClassDraft,
  saveClassDraft: mockSaveClassDraft,
  deleteClassDraft: mockDeleteClassDraft,
}));

vi.mock("@tanstack/react-pacer", () => ({
  useDebouncer: (fn: (...args: unknown[]) => unknown) => ({
    maybeExecute: (...args: unknown[]) => fn(...args),
    cancel: vi.fn(),
  }),
}));

import { useClassDraft } from "./useClassDraft";

afterEach(() => {
  vi.clearAllMocks();
});

describe("useClassDraft", () => {
  beforeEach(() => {
    mockGetClassDraft.mockResolvedValue({ success: true, draft: null });
    mockSaveClassDraft.mockResolvedValue({
      success: true,
      updatedAt: new Date().toISOString(),
    });
    mockDeleteClassDraft.mockResolvedValue({ success: true });
  });

  it("starts in loading state and transitions to idle when no draft", async () => {
    const { result } = renderHook(() =>
      useClassDraft({ classId: null, isLoggedIn: true })
    );

    expect(result.current.draftState).toBe("loading");

    await waitFor(() => {
      expect(result.current.draftState).toBe("idle");
    });
  });

  it("stays idle when not logged in", () => {
    const { result } = renderHook(() =>
      useClassDraft({ classId: null, isLoggedIn: false })
    );

    expect(result.current.draftState).toBe("idle");
    expect(mockGetClassDraft).not.toHaveBeenCalled();
  });

  it("sets available state when draft exists for new class", async () => {
    mockGetClassDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "Test" },
        updatedAt: new Date().toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useClassDraft({ classId: null, isLoggedIn: true })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("available");
    });
    expect(result.current.draftData).toEqual({ name: "Test" });
  });

  it("sets stale state when draft is older than class updatedAt", async () => {
    const classUpdated = new Date("2026-03-01T12:00:00Z");
    const draftUpdated = new Date("2026-03-01T11:00:00Z");

    mockGetClassDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "Old" },
        updatedAt: draftUpdated.toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useClassDraft({
        classId: "class-1",
        classUpdatedAt: classUpdated,
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

    mockGetClassDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "New" },
        updatedAt: draftUpdated.toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useClassDraft({
        classId: "class-1",
        classUpdatedAt: classUpdated,
        isLoggedIn: true,
      })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("available");
    });
  });

  it("calls saveClassDraft on form change", async () => {
    const { result } = renderHook(() =>
      useClassDraft({ classId: null, isLoggedIn: true })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("idle");
    });

    act(() => {
      result.current.onFormChange({ name: "Updated" });
    });

    expect(mockSaveClassDraft).toHaveBeenCalledWith(null, { name: "Updated" });
  });

  it("does not save when not logged in", async () => {
    const { result } = renderHook(() =>
      useClassDraft({ classId: null, isLoggedIn: false })
    );

    act(() => {
      result.current.onFormChange({ name: "Test" });
    });

    expect(mockSaveClassDraft).not.toHaveBeenCalled();
  });

  it("restoreDraft sets state to idle", async () => {
    mockGetClassDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "Draft" },
        updatedAt: new Date().toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useClassDraft({ classId: null, isLoggedIn: true })
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
    mockGetClassDraft.mockResolvedValue({
      success: true,
      draft: {
        data: { name: "Draft" },
        updatedAt: new Date().toISOString(),
      },
    });

    const { result } = renderHook(() =>
      useClassDraft({ classId: "class-1", isLoggedIn: true })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("available");
    });

    await act(async () => {
      await result.current.discardDraft();
    });

    expect(result.current.draftState).toBe("idle");
    expect(result.current.draftData).toBeNull();
    expect(mockDeleteClassDraft).toHaveBeenCalledWith("class-1");
  });

  it("deleteDraftOnSave cleans up after successful save", async () => {
    const { result } = renderHook(() =>
      useClassDraft({ classId: "class-1", isLoggedIn: true })
    );

    await waitFor(() => {
      expect(result.current.draftState).toBe("idle");
    });

    await act(async () => {
      await result.current.deleteDraftOnSave();
    });

    expect(mockDeleteClassDraft).toHaveBeenCalledWith("class-1");
    expect(result.current.lastSavedAt).toBeNull();
  });
});
