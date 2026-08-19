import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockCreateItem,
  mockRevalidatePath,
  mockTelemetryErrors,
  mockUpdateItem,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateItem: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockTelemetryErrors: vi.fn(),
  mockUpdateItem: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/items", () => ({
  RARITIES: [
    { value: "unspecified" },
    { value: "common" },
    { value: "uncommon" },
    { value: "rare" },
    { value: "very_rare" },
    { value: "legendary" },
  ],
  itemsService: {
    createItem: mockCreateItem,
    updateItem: mockUpdateItem,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      mockTelemetryErrors(error);
      throw error;
    }
  }),
}));
vi.mock("@opentelemetry/api", () => ({
  trace: { getActiveSpan: vi.fn(() => ({ setAttributes: vi.fn() })) },
}));

import { POST as createPost } from "./createItem/route";
import { POST as updatePost } from "./updateItem/route";

const id = "550e8400-e29b-41d4-a716-446655440000";
const input = {
  name: "Lucky Coin",
  description: "A coin that always lands edge-up.",
  rarity: "rare",
  visibility: "private",
};

function request(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/_actions/item", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      ...headers,
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({
    user: { id: "owner", discordId: "discord-owner" },
  });
});

describe("item mutation routes", () => {
  it("creates an item and invalidates the owner list", async () => {
    mockCreateItem.mockResolvedValue({ id, name: input.name });

    const response = await createPost(request(input));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id, name: input.name });
    expect(mockCreateItem).toHaveBeenCalledWith(input, "discord-owner");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/items");
  });

  it("updates an owned item and invalidates list and detail", async () => {
    const existingId = "33333333-3333-3333-3333-333333333333";
    mockUpdateItem.mockResolvedValue({ id: existingId, name: input.name });

    const response = await updatePost(request({ id: existingId, input }));

    expect(response.status).toBe(200);
    expect(mockUpdateItem).toHaveBeenCalledWith(
      existingId,
      input,
      "discord-owner"
    );
    expect(mockRevalidatePath.mock.calls).toEqual([
      ["/my/items"],
      ["/items/[itemId]", "page"],
    ]);
  });

  it("returns 400 for malformed JSON and schema mismatches", async () => {
    const malformed = await createPost(request("{broken"));
    const invalid = await createPost(request({ name: "" }));

    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "Invalid JSON body" });
    expect(invalid.status).toBe(400);
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await createPost(request(input));

    expect(response.status).toBe(401);
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it("uses the shared origin and media-type boundary", async () => {
    const wrongOrigin = await createPost(
      request(input, { origin: "https://evil.test" })
    );
    const wrongMedia = await createPost(
      request(input, { "content-type": "text/plain" })
    );

    expect(wrongOrigin.status).toBe(403);
    expect(wrongMedia.status).toBe(415);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("returns a known domain input failure without telemetry", async () => {
    mockCreateItem.mockRejectedValue(new Error("Item name is required"));

    const response = await createPost(request(input));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "Item name is required" });
    expect(mockTelemetryErrors).not.toHaveBeenCalled();
  });

  it("hides unauthorized or missing updates as not found", async () => {
    mockUpdateItem.mockRejectedValue(new Error("Item not found"));

    const response = await updatePost(request({ id, input }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Item not found" });
  });

  it("records unexpected errors and returns a generic 500", async () => {
    const error = new Error("storage connection details");
    mockCreateItem.mockRejectedValue(error);

    const response = await createPost(request(input));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mockTelemetryErrors).toHaveBeenCalledWith(error);
  });
});
