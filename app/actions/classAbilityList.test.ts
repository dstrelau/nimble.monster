import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockDeleteClassAbilityList, mockUpdateClassAbilityList } = vi.hoisted(
  () => ({
    mockDeleteClassAbilityList: vi.fn(),
    mockUpdateClassAbilityList: vi.fn(),
  })
);

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  deleteClassAbilityList: mockDeleteClassAbilityList,
  updateClassAbilityList: mockUpdateClassAbilityList,
  getUserClassAbilityLists: vi.fn(),
  createClassAbilityList: vi.fn(),
  findClassAbilityList: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/utils/url", () => ({
  getClassAbilityListUrl: vi.fn(() => "/class-options/test"),
}));

import {
  deleteClassAbilityList,
  updateClassAbilityList,
} from "./classAbilityList";

const SESSION = { user: { id: "user-1", discordId: "discord-user-1" } };
const LIST_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("deleteClassAbilityList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await deleteClassAbilityList(LIST_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
    expect(mockDeleteClassAbilityList).not.toHaveBeenCalled();
  });

  it("returns error when db rejects (list not owned by user)", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteClassAbilityList.mockResolvedValue(false);
    const result = await deleteClassAbilityList(LIST_ID);
    expect(result.success).toBe(false);
    expect(mockDeleteClassAbilityList).toHaveBeenCalledWith({
      id: LIST_ID,
      discordId: SESSION.user.discordId,
    });
  });

  it("returns success when db confirms deletion", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteClassAbilityList.mockResolvedValue(true);
    const result = await deleteClassAbilityList(LIST_ID);
    expect(result.success).toBe(true);
  });
});

describe("updateClassAbilityList", () => {
  const FORM_DATA = {
    name: "Updated Name",
    description: "Updated description",
    items: [],
  };

  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateClassAbilityList(LIST_ID, FORM_DATA);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
    expect(mockUpdateClassAbilityList).not.toHaveBeenCalled();
  });

  it("returns error when db throws (list not owned by user)", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockUpdateClassAbilityList.mockRejectedValue(
      new Error("Class ability list not found or access denied")
    );
    const result = await updateClassAbilityList(LIST_ID, FORM_DATA);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Class ability list not found or access denied");
  });

  it("passes discordId from session to db layer", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const mockList = { id: LIST_ID, name: FORM_DATA.name };
    mockUpdateClassAbilityList.mockResolvedValue(mockList);
    await updateClassAbilityList(LIST_ID, FORM_DATA);
    expect(mockUpdateClassAbilityList).toHaveBeenCalledWith(
      expect.objectContaining({
        id: LIST_ID,
        discordId: SESSION.user.discordId,
      })
    );
  });
});
