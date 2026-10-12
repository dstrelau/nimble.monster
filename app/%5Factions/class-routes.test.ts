import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClassUrl } from "@/lib/utils/url";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  revalidate: vi.fn(),
  errors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/class", () => ({
  createClass: mocks.create,
  updateClass: mocks.update,
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

import { POST as create } from "./createClass/route";
import { POST as update } from "./updateClass/route";

const id = "33333333-3333-3333-3333-333333333333";
const input = {
  name: "Stargazer",
  description: "Read the stars.",
  keyStats: ["INT", "WIL"],
  hitDie: "d6",
  startingHp: 7,
  saves: { STR: -1, DEX: 0, INT: 1, WIL: 0 },
  armor: ["cloth"],
  weapons: [{ kind: "wand" }, { type: "DEX" }, { range: "ranged" }],
  startingGear: ["Telescope"],
  levels: [
    {
      level: 3,
      abilities: [{ id, name: "Portent", description: "Foresee danger." }],
    },
  ],
  abilityLists: [
    {
      name: "Stars",
      description: "",
      items: [{ name: "Polaris", description: "Navigate." }],
    },
  ],
  visibility: "private",
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
  mocks.create.mockResolvedValue({
    id,
    name: input.name,
    createdAt: new Date(),
  });
  mocks.update.mockResolvedValue({
    id,
    name: input.name,
    createdAt: new Date(),
  });
});

describe.each([
  { path: "createClass", handler: create, body: input, status: 201 },
  { path: "updateClass", handler: update, body: { id, input }, status: 200 },
])("$path", ({ path, handler, body, status }) => {
  it("returns minimal JSON, derives ownership from session and refreshes lists/detail", async () => {
    const spoofed = { ...input, discordId: "attacker" };
    const response = await handler(
      request(path, status === 201 ? spoofed : { id, input: spoofed })
    );
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ id, name: input.name });
    expect(mocks.revalidate).toHaveBeenCalledWith("/classes");
    expect(mocks.revalidate).toHaveBeenCalledWith("/my/classes");
    if (status === 201)
      expect(mocks.create).toHaveBeenCalledWith({
        ...input,
        discordId: "discord-owner",
      });
    else {
      expect(mocks.update).toHaveBeenCalledWith({
        id,
        ...input,
        discordId: "discord-owner",
      });
      expect(mocks.revalidate).toHaveBeenCalledWith(
        getClassUrl({ id, name: input.name })
      );
    }
  });

  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await handler(request(path, body))).status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and nested invalid inputs before persistence", async () => {
    const response = await handler(request(path, "{broken"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body" });
    for (const invalid of [
      { ...input, name: " " },
      { ...input, description: " " },
      { ...input, keyStats: ["INT"] },
      { ...input, hitDie: "d3" },
      { ...input, startingHp: 0 },
      { ...input, armor: ["invalid"] },
      { ...input, weapons: [{ kind: "sword" }] },
      { ...input, saves: { STR: 0, DEX: 0, INT: 1, WIL: 0 } },
      {
        ...input,
        levels: [
          {
            level: 1,
            abilities: [{ id, name: "", description: "Incomplete" }],
          },
        ],
      },
      {
        ...input,
        levels: [
          {
            level: 1,
            abilities: [{ id: "bad-id", name: "A", description: "B" }],
          },
        ],
      },
      {
        ...input,
        abilityLists: [{ name: "Options", description: "", items: [] }],
      },
      { ...input, visibility: "hidden" },
    ]) {
      expect(
        (
          await handler(
            request(path, status === 201 ? invalid : { id, input: invalid })
          )
        ).status
      ).toBe(400);
    }
    if (status === 200)
      expect(
        (await handler(request(path, { id: "bad-id", input }))).status
      ).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("checks origin and media type before auth", async () => {
    expect(
      (await handler(request(path, body, { origin: "https://evil.test" })))
        .status
    ).toBe(403);
    expect(
      (await handler(request(path, body, { "content-type": "text/plain" })))
        .status
    ).toBe(415);
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("records unexpected failures without exposing them or invalidating caches", async () => {
    const error = new Error("private database details");
    mocks.create.mockRejectedValue(error);
    mocks.update.mockRejectedValue(error);
    const response = await handler(request(path, body));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mocks.errors).toHaveBeenCalledWith(error);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});

it("hides missing and non-owned updates", async () => {
  mocks.update.mockRejectedValue(new Error("Class not found"));
  const response = await update(request("updateClass", { id, input }));
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Class not found" });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
