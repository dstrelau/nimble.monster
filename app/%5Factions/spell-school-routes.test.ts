import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  revalidate: vi.fn(),
  errors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/school", () => ({
  createSpellSchool: mocks.create,
  updateSpellSchool: mocks.update,
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

import { POST as create } from "./createSpellSchool/route";
import { POST as update } from "./updateSpellSchool/route";

const id = "33333333-3333-4333-8333-333333333333";
const spell = {
  name: "Gust",
  tier: 2,
  version: 2,
  actions: 3,
  reaction: true,
  utility: false,
  target: { type: "aoe", kind: "cone", distance: 7 },
  damage: "2d6",
  description: "Push 3 spaces",
  highLevels: "Push further",
  concentration: "1 minute",
  upcast: "Extra damage",
};
const input = {
  name: "Wind",
  description: "Control air",
  visibility: "private",
  spells: [spell],
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
    user: { id: "owner", discordId: "discord-owner", username: "owner" },
  });
  mocks.create.mockResolvedValue({ id, ...input, updatedAt: new Date() });
  mocks.update.mockResolvedValue({ id, ...input, updatedAt: new Date() });
});
describe.each([
  { path: "createSpellSchool", handler: create, status: 201 },
  { path: "updateSpellSchool", handler: update, status: 200 },
])("$path", ({ path, handler, status }) => {
  const body = (value: unknown) =>
    status === 201 ? value : { id, input: value };
  it("returns minimal JSON, derives ownership and preserves cache invalidation", async () => {
    const response = await handler(
      request(path, body({ ...input, discordId: "attacker", sourceId: id }))
    );
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ id, name: input.name });
    expect(status === 201 ? mocks.create : mocks.update).toHaveBeenCalledWith({
      ...input,
      ...(status === 200 ? { id } : {}),
      discordId: "discord-owner",
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/my/spell-schools");
    expect(mocks.revalidate).toHaveBeenCalledWith("/spell-schools");
    if (status === 200) {
      expect(mocks.revalidate).toHaveBeenCalledWith("/u/owner");
      expect(mocks.revalidate).toHaveBeenCalledWith(`/spell-schools/${id}`);
    }
  });
  it("accepts all editor target variants and optional empty text", async () => {
    for (const target of [
      undefined,
      { type: "self" },
      ...["single", "single+", "multi", "special"].map((type) => ({
        type,
        kind: "reach",
        distance: 0,
      })),
      ...["range", "reach", "line", "cone"].map((kind) => ({
        type: "aoe",
        kind,
      })),
    ]) {
      expect(
        (
          await handler(
            request(
              path,
              body({ ...input, spells: [{ ...spell, target, damage: "" }] })
            )
          )
        ).status
      ).toBe(status);
    }
    expect(
      (await handler(request(path, body({ ...input, spells: [] })))).status
    ).toBe(status);
  });
  it("requires a session and Discord identity", async () => {
    for (const session of [null, { user: { id: "owner" } }]) {
      mocks.auth.mockResolvedValue(session);
      expect((await handler(request(path, body(input)))).status).toBe(401);
    }
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON and invalid nested fields before writes", async () => {
    const malformed = await handler(request(path, "{broken"));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "Invalid JSON body" });
    for (const invalid of [
      { ...input, name: "" },
      { ...input, description: 9 },
      { ...input, visibility: "unlisted" },
      ...[
        { name: "" },
        { tier: -1 },
        { tier: 10 },
        { version: 1 },
        { version: 4 },
        { actions: -1 },
        { actions: 11 },
        { actions: "3" },
        { reaction: "true" },
        { utility: null },
        { target: { type: "single", kind: "cone" } },
        { target: { type: "aoe", kind: "line", distance: -1 } },
        { damage: 3 },
      ].map((fields) => ({ ...input, spells: [{ ...spell, ...fields }] })),
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
  it("records unexpected failures without leaking internals or invalidating caches", async () => {
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
it("hides missing and non-owned updates with 404", async () => {
  mocks.update.mockRejectedValue(new Error("Spell school not found"));
  const response = await update(request("updateSpellSchool", { id, input }));
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Spell school not found" });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
