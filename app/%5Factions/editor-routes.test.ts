import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockCreateCollection,
  mockCreateEncounter,
  mockRevalidatePath,
  mockTelemetryErrors,
  mockUpdateCollection,
  mockUpdateEncounter,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateCollection: vi.fn(),
  mockCreateEncounter: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockTelemetryErrors: vi.fn(),
  mockUpdateCollection: vi.fn(),
  mockUpdateEncounter: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  createCollection: mockCreateCollection,
  createEncounter: mockCreateEncounter,
  updateCollection: mockUpdateCollection,
  updateEncounter: mockUpdateEncounter,
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

import { POST as saveCollectionPost } from "./saveCollection/route";
import { POST as saveEncounterPost } from "./saveEncounter/route";

const id = "44444444-4444-4444-4444-444444444444";
const encounterInput = {
  name: "Bridge Ambush",
  description: "Bandits block the bridge.",
  visibility: "private",
  heroCount: 4,
  heroLevel: 3,
  monsters: [
    {
      monsterId: "660e8400-e29b-41d4-a716-446655440000",
      quantity: 2,
      isPerHero: false,
      heroesPerMonster: 1,
    },
  ],
};
const collectionInput = {
  name: "Campaign Kit",
  description: "Everything for session one.",
  visibility: "private",
  monsterIds: ["660e8400-e29b-41d4-a716-446655440000"],
  itemIds: [],
  companionIds: [],
  ancestryIds: [],
  backgroundIds: [],
  subclassIds: [],
  spellSchoolIds: [],
  classIds: [],
};

function request(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/_actions/editor", {
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

describe("encounter and collection save routes", () => {
  it("creates an encounter with its monsters in one request", async () => {
    mockCreateEncounter.mockResolvedValue({ id, name: encounterInput.name });
    mockUpdateEncounter.mockResolvedValue({ id, name: encounterInput.name });

    const response = await saveEncounterPost(request(encounterInput));

    expect(response.status).toBe(201);
    expect(mockCreateEncounter).toHaveBeenCalledWith({
      ...encounterInput,
      monsters: undefined,
      discordId: "discord-owner",
    });
    expect(mockUpdateEncounter).toHaveBeenCalledWith({
      id,
      ...encounterInput,
      discordId: "discord-owner",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/encounters");
  });

  it("updates an encounter and invalidates its detail", async () => {
    mockUpdateEncounter.mockResolvedValue({ id, name: encounterInput.name });

    const response = await saveEncounterPost(
      request({ ...encounterInput, id })
    );

    expect(response.status).toBe(200);
    expect(mockUpdateEncounter).toHaveBeenCalledWith({
      ...encounterInput,
      id,
      discordId: "discord-owner",
    });
    expect(mockRevalidatePath.mock.calls).toEqual([
      ["/my/encounters"],
      ["/encounters/[id]", "page"],
    ]);
  });

  it("creates and populates a collection in one client request", async () => {
    mockCreateCollection.mockResolvedValue({ id, name: collectionInput.name });
    mockUpdateCollection.mockResolvedValue({ id, name: collectionInput.name });

    const response = await saveCollectionPost(request(collectionInput));

    expect(response.status).toBe(201);
    expect(mockCreateCollection).toHaveBeenCalledWith({
      name: collectionInput.name,
      description: collectionInput.description,
      visibility: collectionInput.visibility,
      discordId: "discord-owner",
    });
    expect(mockUpdateCollection).toHaveBeenCalledWith({
      id,
      ...collectionInput,
      discordId: "discord-owner",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/collections");
  });

  it("updates a collection and invalidates its detail", async () => {
    mockUpdateCollection.mockResolvedValue({ id, name: collectionInput.name });

    const response = await saveCollectionPost(
      request({ ...collectionInput, id })
    );

    expect(response.status).toBe(200);
    expect(mockRevalidatePath.mock.calls).toEqual([
      ["/my/collections"],
      ["/collections/[id]", "page"],
    ]);
  });

  it("separates malformed JSON from domain schema failures", async () => {
    const malformed = await saveEncounterPost(request("{broken"));
    const invalid = await saveEncounterPost(
      request({ ...encounterInput, heroLevel: 21 })
    );

    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "Invalid JSON body" });
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({
      error: "Hero level must be at most 20",
    });
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await saveCollectionPost(request(collectionInput));

    expect(response.status).toBe(401);
    expect(mockCreateCollection).not.toHaveBeenCalled();
  });

  it("uses the shared origin and media-type boundary", async () => {
    const wrongOrigin = await saveEncounterPost(
      request(encounterInput, { origin: "https://evil.test" })
    );
    const wrongMedia = await saveCollectionPost(
      request(collectionInput, { "content-type": "text/plain" })
    );

    expect(wrongOrigin.status).toBe(403);
    expect(wrongMedia.status).toBe(415);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it.each([
    [
      saveEncounterPost,
      mockUpdateEncounter,
      encounterInput,
      "Encounter not found",
    ],
    [
      saveCollectionPost,
      mockUpdateCollection,
      collectionInput,
      "Collection not found",
    ],
  ])("hides unauthorized or missing updates as not found", async (handler, service, input, message) => {
    service.mockRejectedValue(new Error(message));

    const response = await handler(request({ ...input, id }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: message });
  });

  it("records unexpected failures and returns a generic 500", async () => {
    const error = new Error("database path and storage details");
    mockCreateEncounter.mockRejectedValue(error);

    const response = await saveEncounterPost(request(encounterInput));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mockTelemetryErrors).toHaveBeenCalledWith(error);
  });
});
