import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCompanionUrl } from "@/lib/utils/url";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  find: vi.fn(),
  revalidate: vi.fn(),
  errors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/companion", () => ({
  createCompanion: mocks.create,
  updateCompanion: mocks.update,
  findCompanionWithCreator: mocks.find,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/telemetry", () => ({
  telemetry:
    (handler: (...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) => {
      try {
        return await handler(...args);
      } catch (error) {
        mocks.errors(error);
        throw error;
      }
    },
}));

import { POST as create } from "./createCompanion/route";
import { POST as update } from "./updateCompanion/route";

const id = "33333333-3333-3333-3333-333333333333";
const input = {
  name: "Stabs",
  kind: "Kobold",
  class: "The Cheat",
  hp_per_level: "5+LVL",
  wounds: 3,
  size: "small",
  saves: "DEX+",
  actions: [{ id: "example", name: "Stab", damage: "1d4", range: "4" }],
  abilities: [{ id: "example", name: "Companion", description: "Interpose" }],
  actionPreface: "Choose 1:",
  dyingRule: "Become invisible",
  visibility: "private",
  paperforgeId: "kobold",
};
function request(path: string, body: unknown, headers?: HeadersInit) {
  return new Request(`http://localhost/_actions/${path}`, {
    method: "POST",
    headers: {
      origin: "http://localhost",
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: "owner", discordId: "discord-owner" },
  });
  mocks.find.mockResolvedValue({ id, ...input });
  mocks.create.mockResolvedValue({ id, ...input, updatedAt: new Date() });
  mocks.update.mockResolvedValue({ id, ...input, updatedAt: new Date() });
});
describe.each([
  { path: "createCompanion", handler: create, status: 201 },
  { path: "updateCompanion", handler: update, status: 200 },
])("$path", ({ path, handler, status }) => {
  const body = (value: unknown) =>
    status === 201 ? value : { id, input: value };
  it("returns minimal JSON navigation data, derives ownership and refreshes lists/detail", async () => {
    const response = await handler(
      request(
        path,
        body({ ...input, discordId: "attacker", userId: "attacker" })
      )
    );
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ id, name: input.name });
    expect(status === 201 ? mocks.create : mocks.update).toHaveBeenCalledWith({
      ...input,
      ...(status === 200 ? { id, moreInfo: "" } : {}),
      discordId: "discord-owner",
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/companions");
    expect(mocks.revalidate).toHaveBeenCalledWith("/my/companions");
    if (status === 200) {
      expect(mocks.find).toHaveBeenCalledWith(id, "owner");
      expect(mocks.revalidate).toHaveBeenCalledWith(
        getCompanionUrl({ id, ...input })
      );
    }
  });
  it("requires an authenticated user and Discord identity", async () => {
    for (const session of [null, { user: { id: "owner" } }]) {
      mocks.auth.mockResolvedValue(session);
      expect((await handler(request(path, body(input)))).status).toBe(401);
    }
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON and invalid scalar/nested input before writes", async () => {
    const malformed = await handler(request(path, "{broken"));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "Invalid JSON body" });
    for (const invalid of [
      { ...input, name: " " },
      { ...input, size: "giant" },
      { ...input, wounds: 0 },
      { ...input, hp_per_level: 5 },
      { ...input, visibility: "hidden" },
      { ...input, actions: [{ id: "a", name: "A", damage: 5 }] },
      { ...input, abilities: [{ id: "a", name: "A" }] },
    ])
      expect((await handler(request(path, body(invalid)))).status).toBe(400);
    if (status === 200)
      expect((await handler(request(path, { id: "bad", input }))).status).toBe(
        400
      );
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("checks exact origin and media type before auth", async () => {
    expect(
      (
        await handler(
          request(path, body(input), { origin: "https://evil.test" })
        )
      ).status
    ).toBe(403);
    expect(
      (
        await handler(
          request(path, body(input), { "content-type": "text/plain" })
        )
      ).status
    ).toBe(415);
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it("records unexpected errors and returns a generic failure without cache invalidation", async () => {
    const error = new Error("private database details");
    mocks.create.mockRejectedValue(error);
    mocks.update.mockRejectedValue(error);
    const response = await handler(request(path, body(input)));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mocks.errors).toHaveBeenCalledWith(error);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
it("hides missing/non-owned updates before writes", async () => {
  mocks.find.mockResolvedValue(null);
  const response = await update(request("updateCompanion", { id, input }));
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Companion not found" });
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
