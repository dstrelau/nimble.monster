import { afterEach, describe, expect, it, vi } from "vitest";
import {
  pickerMyHazardsInfiniteQueryOptions,
  pickerMyItemsInfiniteQueryOptions,
  pickerMyMonstersInfiniteQueryOptions,
  pickerPublicHazardsInfiniteQueryOptions,
  pickerPublicItemsInfiniteQueryOptions,
  pickerPublicMonstersInfiniteQueryOptions,
} from "./statblock-picker-queries";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("statblock picker query transport", () => {
  it("uses the stable route without Server Action headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ kind: "monsters", data: [], nextCursor: null }),
        {
          headers: { "content-type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const query = pickerPublicMonstersInfiniteQueryOptions({
      search: "Spider",
      type: "all",
    });
    await query.queryFn({ pageParam: undefined });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/_actions/statblockPickerSearch");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.headers).not.toHaveProperty("next-action");
    expect(JSON.parse(options.body)).toMatchObject({
      kind: "monsters",
      scope: "public",
      search: "Spider",
      type: "all",
    });
  });

  it("isolates mine query caches by owner without sending the owner key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ kind: "monsters", data: [], nextCursor: null })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ kind: "hazards", data: [], nextCursor: null })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ kind: "items", data: [], nextCursor: null })
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const ownerAMonsters = pickerMyMonstersInfiniteQueryOptions({
      ownerId: "owner-a",
    });
    const ownerBMonsters = pickerMyMonstersInfiniteQueryOptions({
      ownerId: "owner-b",
    });
    const ownerAHazards = pickerMyHazardsInfiniteQueryOptions({
      ownerId: "owner-a",
    });
    const ownerBHazards = pickerMyHazardsInfiniteQueryOptions({
      ownerId: "owner-b",
    });
    const ownerAItems = pickerMyItemsInfiniteQueryOptions({
      ownerId: "owner-a",
    });
    const ownerBItems = pickerMyItemsInfiniteQueryOptions({
      ownerId: "owner-b",
    });

    expect(ownerAMonsters.queryKey).not.toEqual(ownerBMonsters.queryKey);
    expect(ownerAHazards.queryKey).not.toEqual(ownerBHazards.queryKey);
    expect(ownerAItems.queryKey).not.toEqual(ownerBItems.queryKey);

    await ownerAMonsters.queryFn({ pageParam: undefined });
    await ownerAHazards.queryFn({ pageParam: undefined });
    await ownerAItems.queryFn({ pageParam: undefined });
    for (const [, options] of fetchMock.mock.calls) {
      const body = JSON.parse(options.body);
      expect(body).not.toHaveProperty("ownerId");
      expect(body).not.toHaveProperty("creatorId");
    }
  });

  it("revives entity and nested relation dates for every picker result kind", async () => {
    const dates = {
      createdAt: "2026-01-02T03:04:05.000Z",
      updatedAt: "2026-02-03T04:05:06.000Z",
    };
    const relationDates = {
      source: { ...dates },
      awards: [{ ...dates }],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            kind: "monsters",
            data: [{ ...dates, ...relationDates }],
            nextCursor: null,
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            kind: "hazards",
            data: [{ ...dates, ...relationDates }],
            nextCursor: null,
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            kind: "items",
            data: [{ ...dates, ...relationDates }],
            nextCursor: null,
          })
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const monsterPage =
      await pickerPublicMonstersInfiniteQueryOptions().queryFn({
        pageParam: undefined,
      });
    const hazardPage = await pickerPublicHazardsInfiniteQueryOptions().queryFn({
      pageParam: undefined,
    });
    const itemPage = await pickerPublicItemsInfiniteQueryOptions().queryFn({
      pageParam: undefined,
    });

    for (const entity of [
      monsterPage.data[0],
      hazardPage.data[0],
      itemPage.data[0],
    ]) {
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.source?.createdAt).toBeInstanceOf(Date);
      expect(entity.source?.updatedAt).toBeInstanceOf(Date);
      expect(entity.awards?.[0]?.createdAt).toBeInstanceOf(Date);
      expect(entity.awards?.[0]?.updatedAt).toBeInstanceOf(Date);
    }
  });
});
