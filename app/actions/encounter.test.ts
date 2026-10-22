import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn() }));
const unauthorizedSentinel = Symbol("unauthorized");
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  unauthorized: vi.fn(() => {
    throw unauthorizedSentinel;
  }),
}));
vi.mock("@/lib/db", () => ({ listEncountersWithMonstersForUser: mocks.list }));

import { listOwnEncounters } from "./encounter";

describe("listOwnEncounters", () => {
  beforeEach(() => vi.clearAllMocks());
  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(listOwnEncounters()).rejects.toBe(unauthorizedSentinel);
  });
  it("returns the session user's encounters", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user", discordId: "discord-123" },
    });
    const encounters = [{ id: "enc-1" }];
    mocks.list.mockResolvedValue(encounters);
    expect(await listOwnEncounters()).toEqual({ success: true, encounters });
    expect(mocks.list).toHaveBeenCalledWith("discord-123");
  });
});
