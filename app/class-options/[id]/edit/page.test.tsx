import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockFindClassAbilityList } = vi.hoisted(() => ({
  mockFindClassAbilityList: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/app/actions/classAbilityList", () => ({
  findClassAbilityList: mockFindClassAbilityList,
}));
vi.mock("@/lib/utils/slug", () => ({
  deslugify: vi.fn(() => "550e8400-e29b-41d4-a716-446655440000"),
}));

const notFoundSentinel = Symbol("notFound");
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw notFoundSentinel;
  }),
}));

vi.mock("../../BuildClassAbilityListView", () => ({ default: () => null }));

import EditClassAbilityListPage from "./page";

const CREATOR_DISCORD_ID = "discord-creator";
const OTHER_DISCORD_ID = "discord-other";

const LIST = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "My Ability List",
  description: "",
  creator: { discordId: CREATOR_DISCORD_ID },
  items: [],
};

const params = Promise.resolve({ id: "my-ability-list-abc" });

describe("EditClassAbilityListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the edit page for the owner", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", discordId: CREATOR_DISCORD_ID },
    });
    mockFindClassAbilityList.mockResolvedValue({ success: true, list: LIST });
    const result = await EditClassAbilityListPage({ params });
    expect(result).toBeDefined();
  });

  it("returns notFound for a different user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-2", discordId: OTHER_DISCORD_ID },
    });
    mockFindClassAbilityList.mockResolvedValue({ success: true, list: LIST });
    await expect(EditClassAbilityListPage({ params })).rejects.toBe(
      notFoundSentinel
    );
  });

  it("returns notFound when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    mockFindClassAbilityList.mockResolvedValue({ success: true, list: LIST });
    await expect(EditClassAbilityListPage({ params })).rejects.toBe(
      notFoundSentinel
    );
  });

  it("returns notFound when list does not exist", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", discordId: CREATOR_DISCORD_ID },
    });
    mockFindClassAbilityList.mockResolvedValue({ success: false, list: null });
    await expect(EditClassAbilityListPage({ params })).rejects.toBe(
      notFoundSentinel
    );
  });
});
