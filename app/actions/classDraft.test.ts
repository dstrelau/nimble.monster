import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockIsFeatureFlagEnabled } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockIsFeatureFlagEnabled: vi.fn(),
}));
const { mockSave, mockGet, mockDelete } = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockGet: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/featureFlags", () => ({
  isFeatureFlagEnabled: mockIsFeatureFlagEnabled,
}));
vi.mock("@/lib/services/classdrafts", () => ({
  classDraftsService: {
    save: mockSave,
    get: mockGet,
    delete: mockDelete,
  },
}));

import { deleteClassDraft, getClassDraft, saveClassDraft } from "./classDraft";

beforeEach(() => {
  mockAuth.mockResolvedValue({
    user: { id: "user-1", discordId: "discord-1" },
  });
  mockIsFeatureFlagEnabled.mockResolvedValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("class draft feature flag", () => {
  it("rejects draft operations when the user flag is disabled", async () => {
    mockIsFeatureFlagEnabled.mockResolvedValue(false);

    await expect(saveClassDraft(null, { name: "test" })).resolves.toEqual({
      success: false,
    });
    await expect(getClassDraft(null)).resolves.toEqual({
      success: false,
      draft: null,
    });
    await expect(deleteClassDraft(null)).resolves.toEqual({ success: false });

    expect(mockSave).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("allows an enabled user to save a draft", async () => {
    const updatedAt = new Date("2026-08-30T12:00:00Z");
    mockSave.mockResolvedValue({ updatedAt });

    await expect(saveClassDraft("class-1", { name: "test" })).resolves.toEqual({
      success: true,
      updatedAt: updatedAt.toISOString(),
    });

    expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
      "user-1",
      "class-draft-autosave"
    );
    expect(mockSave).toHaveBeenCalledWith("discord-1", "class-1", {
      name: "test",
    });
  });
});
