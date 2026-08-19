import { afterEach, describe, expect, it, vi } from "vitest";

const queryResults: unknown[] = [];
const set = vi.fn(() => queryChain);
const queryChain = {
  from: vi.fn(() => queryChain),
  innerJoin: vi.fn(() => queryChain),
  leftJoin: vi.fn(() => queryChain),
  where: vi.fn(() => queryChain),
  limit: vi.fn(() => queryChain),
  set,
  // biome-ignore lint/suspicious/noThenProperty: thenable query-builder mock
  then(
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) {
    return Promise.resolve(queryResults.shift()).then(onFulfilled, onRejected);
  },
};
const database = {
  select: vi.fn(() => queryChain),
  update: vi.fn(() => queryChain),
};

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: vi.fn(() => database),
}));

import { updateItem } from "./repository";

afterEach(() => {
  queryResults.length = 0;
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("updateItem", () => {
  it("advances updatedAt so generated images use a new cache version", async () => {
    const updatedAt = new Date("2026-08-19T18:30:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(updatedAt);

    const user = {
      id: "user-1",
      discordId: "discord-1",
      username: "creator",
      displayName: "Creator",
      imageUrl: null,
      avatar: null,
    };
    const item = {
      id: "1344e3b0-0954-44ff-a276-1708dca48a31",
      name: "Elven Rope",
      kind: "Equipment",
      description: "Updated description",
      moreInfo: "More information",
      visibility: "public",
      userId: user.id,
      sourceId: null,
      remixedFromId: null,
      createdAt: "2026-08-19T17:00:00.000Z",
      updatedAt: updatedAt.toISOString(),
      imageIcon: null,
      rarity: "uncommon",
      imageBgIcon: null,
      imageColor: null,
      imageBgColor: null,
      imageBackdrop: null,
      likeCount: 0,
    };

    queryResults.push(
      [user],
      [item],
      undefined,
      [{ items: item, users: user, sources: null }],
      []
    );

    const result = await updateItem(
      item.id,
      {
        name: item.name,
        kind: item.kind,
        description: item.description,
        moreInfo: item.moreInfo,
        rarity: "uncommon",
        visibility: "public",
      },
      "discord-1"
    );

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ updatedAt: updatedAt.toISOString() })
    );
    expect(result.updatedAt).toEqual(updatedAt);
  });
});
