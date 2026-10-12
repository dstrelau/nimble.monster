import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  revalidate: vi.fn(),
  errors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/services/ancestries/service", () => ({
  ancestriesService: {
    createAncestry: mocks.create,
    updateAncestry: mocks.update,
  },
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

import { POST as create } from "./createAncestry/route";
import { POST as update } from "./updateAncestry/route";

const id = "33333333-3333-3333-3333-333333333333";
const input = {
  name: "Starfolk",
  description: "Born beneath unfamiliar stars.",
  size: ["small", "large"],
  rarity: "exotic",
  visibility: "private",
  abilities: [{ name: "Starlight", description: "See in dim light." }],
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
  { path: "createAncestry", handler: create, body: input, status: 201 },
  { path: "updateAncestry", handler: update, body: { id, input }, status: 200 },
])("$path", ({ path, handler, body, status }) => {
  it("returns only navigation data and preserves session ownership and invalidation", async () => {
    const response = await handler(request(path, body));
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ id, name: input.name });
    expect(mocks.revalidate).toHaveBeenCalledWith("/ancestries");
    expect(mocks.revalidate).toHaveBeenCalledWith("/my/ancestries");
    if (status === 201) {
      expect(mocks.create).toHaveBeenCalledWith(input, "discord-owner");
    } else {
      expect(mocks.update).toHaveBeenCalledWith(id, input, "discord-owner");
      expect(mocks.revalidate).toHaveBeenCalledWith(`/ancestries/${id}`);
    }
  });

  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await handler(request(path, body))).status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON, invalid IDs, enums, and empty input", async () => {
    const malformed = await handler(request(path, "{broken"));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "Invalid JSON body" });
    for (const invalid of [
      { ...input, name: "  " },
      { ...input, size: [] },
      { ...input, rarity: "rare" },
      { ...input, sourceId: "bad-id" },
      { ...input, abilities: [{ name: "", description: "light" }] },
    ]) {
      expect(
        (
          await handler(
            request(path, status === 201 ? invalid : { id, input: invalid })
          )
        ).status
      ).toBe(400);
    }
    if (status === 200) {
      expect(
        (await handler(request(path, { id: "bad-id", input }))).status
      ).toBe(400);
    }
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("checks origin and media type before authentication", async () => {
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

  it("records unexpected failures without exposing infrastructure details", async () => {
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

it("hides missing and non-owned updates as 404", async () => {
  mocks.update.mockRejectedValue(
    new Error("Ancestry not found or not owned by user")
  );
  const response = await update(request("updateAncestry", { id, input }));
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Ancestry not found" });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
