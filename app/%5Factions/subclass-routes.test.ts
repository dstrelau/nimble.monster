import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSubclassUrl } from "@/lib/utils/url";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  revalidate: vi.fn(),
  errors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/subclass", () => ({
  createSubclass: mocks.create,
  updateSubclass: mocks.update,
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

import { POST as create } from "./createSubclass/route";
import { POST as update } from "./updateSubclass/route";

const id = "33333333-3333-3333-3333-333333333333";
const input = {
  name: "Red Mist",
  className: "Berserker",
  namePreface: "Path of the",
  tagline: "A furious path",
  description: "",
  levels: [
    {
      level: 3,
      abilities: [
        { id: "blood-frenzy", name: "Blood Frenzy", description: "Gain Fury." },
      ],
    },
  ],
  abilityLists: [
    {
      name: "Options",
      description: "",
      items: [{ name: "Mist", description: "" }],
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
  mocks.create.mockResolvedValue({ id, ...input, createdAt: new Date() });
  mocks.update.mockResolvedValue({ id, ...input, createdAt: new Date() });
});
describe.each([
  { path: "createSubclass", handler: create, status: 201 },
  { path: "updateSubclass", handler: update, status: 200 },
])("$path", ({ path, handler, status }) => {
  const body = (value: unknown) =>
    status === 201 ? value : { id, input: value };
  it("returns canonical navigation data and delegates only validated builder fields with session ownership", async () => {
    const response = await handler(
      request(
        path,
        body({
          ...input,
          discordId: "attacker",
          sourceId: id,
          abilityListIds: [id],
        })
      )
    );
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({
      id,
      name: input.name,
      namePreface: input.namePreface,
    });
    expect(status === 201 ? mocks.create : mocks.update).toHaveBeenCalledWith({
      ...(status === 200 ? { id } : {}),
      ...input,
      discordId: "discord-owner",
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/subclasses");
    expect(mocks.revalidate).toHaveBeenCalledWith("/my/subclasses");
    if (status === 200)
      expect(mocks.revalidate).toHaveBeenCalledWith(
        getSubclassUrl({ id, ...input })
      );
  });
  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await handler(request(path, body(input)))).status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON and invalid scalar/nested inputs before writes", async () => {
    const malformed = await handler(request(path, "{broken"));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "Invalid JSON body" });
    for (const invalid of [
      { ...input, name: " " },
      { ...input, className: " " },
      { ...input, classId: "bad" },
      { ...input, visibility: "hidden" },
      { ...input, levels: [{ level: "3", abilities: [] }] },
      {
        ...input,
        levels: [
          {
            level: 3,
            abilities: [{ id: "example", name: "A", description: " " }],
          },
        ],
      },
      {
        ...input,
        abilityLists: [{ name: "Options", description: "", items: [] }],
      },
      {
        ...input,
        abilityLists: [
          {
            name: "Options",
            description: "",
            items: [{ name: " ", description: "" }],
          },
        ],
      },
    ])
      expect((await handler(request(path, body(invalid)))).status).toBe(400);
    if (status === 200)
      expect((await handler(request(path, { id: "bad", input }))).status).toBe(
        400
      );
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("checks origin/media before authentication", async () => {
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
  it("records unexpected errors without exposing details or refreshing caches", async () => {
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
it("hides missing and non-owned updates", async () => {
  mocks.update.mockRejectedValue(new Error("Subclass not found"));
  const response = await update(request("updateSubclass", { id, input }));
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Subclass not found" });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
