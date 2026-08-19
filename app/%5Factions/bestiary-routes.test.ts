import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CreateHazardInput,
  CreateMonsterInput,
} from "@/lib/services/monsters";

const {
  mockAuth,
  mockCreateHazard,
  mockCreateMonster,
  mockRevalidatePath,
  mockTelemetryErrors,
  mockUpdateHazard,
  mockUpdateMonster,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateHazard: vi.fn(),
  mockCreateMonster: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockTelemetryErrors: vi.fn(),
  mockUpdateHazard: vi.fn(),
  mockUpdateMonster: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/hazards", () => ({
  createHazard: mockCreateHazard,
  updateHazard: mockUpdateHazard,
}));
vi.mock("@/lib/services/monsters", () => ({
  monstersService: {
    createMonster: mockCreateMonster,
    updateMonster: mockUpdateMonster,
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
  trace: {
    getActiveSpan: vi.fn(() => ({ setAttributes: vi.fn() })),
  },
}));

import { POST as createPost } from "./createBestiaryEntry/route";
import { POST as updatePost } from "./updateBestiaryEntry/route";

const id = "22222222-2222-2222-2222-222222222222";
const session = {
  user: { id: "owner", discordId: "discord-owner", username: "creator" },
};
const sharedInput = {
  name: "Clockwork Goblin",
  level: "2",
  levelInt: 2,
  actions: [],
  abilities: [],
  actionPreface: "",
  visibility: "private",
} satisfies CreateHazardInput;
const monsterInput = {
  ...sharedInput,
  hp: 20,
  armor: "medium",
  size: "small",
  speed: 6,
  fly: 0,
  swim: 0,
  climb: 0,
  burrow: 0,
  teleport: 0,
} satisfies CreateMonsterInput;

function request(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/_actions/bestiary", {
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
  mockAuth.mockResolvedValue(session);
});

describe("bestiary mutation routes", () => {
  it("creates a monster for the session owner and invalidates its list", async () => {
    mockCreateMonster.mockResolvedValue({
      id,
      name: monsterInput.name,
      hazard: false,
    });

    const response = await createPost(
      request({ kind: "monster", input: monsterInput })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id,
      name: monsterInput.name,
      hazard: false,
    });
    expect(mockCreateMonster).toHaveBeenCalledWith(
      monsterInput,
      "discord-owner"
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/monsters");
  });

  it("creates a hazard and invalidates its list", async () => {
    mockCreateHazard.mockResolvedValue({
      id,
      name: sharedInput.name,
      hazard: true,
    });

    const response = await createPost(
      request({ kind: "hazard", input: sharedInput })
    );

    expect(response.status).toBe(201);
    expect(mockCreateHazard).toHaveBeenCalledWith(sharedInput, "discord-owner");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/hazards");
  });

  it.each([
    ["monster", false, mockUpdateMonster, "/my/monsters", "/monsters/[id]"],
    ["hazard", true, mockUpdateHazard, "/my/hazards", "/hazards/[id]"],
  ])("updates a %s and invalidates its list and detail", async (kind, hazard, service, listPath, detailPath) => {
    const input =
      kind === "monster"
        ? {
            ...monsterInput,
            id,
            kind: "",
            legendary: false,
            minion: false,
            bloodied: "",
            lastStand: "",
            saves: [],
            moreInfo: "",
          }
        : { ...sharedInput, id, moreInfo: "" };
    service.mockResolvedValue({ id, name: sharedInput.name, hazard });

    const response = await updatePost(request({ kind, input }));

    expect(response.status).toBe(200);
    expect(service).toHaveBeenCalledWith(input, "discord-owner");
    expect(mockRevalidatePath.mock.calls).toEqual([
      [listPath],
      [detailPath, "page"],
    ]);
  });

  it("rejects malformed JSON separately from schema failures", async () => {
    const malformed = await createPost(request("{broken"));
    const invalid = await createPost(request({ kind: "monster", input: {} }));

    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "Invalid JSON body" });
    expect(invalid.status).toBe(400);
    expect(mockCreateMonster).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await createPost(
      request({ kind: "monster", input: monsterInput })
    );

    expect(response.status).toBe(401);
    expect(mockCreateMonster).not.toHaveBeenCalled();
  });

  it("rejects wrong-origin and wrong-media-type requests before auth", async () => {
    const wrongOrigin = await createPost(
      request(
        { kind: "monster", input: monsterInput },
        { origin: "https://evil.test" }
      )
    );
    const wrongMedia = await createPost(
      request(
        { kind: "monster", input: monsterInput },
        { "content-type": "text/plain" }
      )
    );

    expect(wrongOrigin.status).toBe(403);
    expect(wrongMedia.status).toBe(415);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("returns an intentional domain validation failure", async () => {
    mockCreateMonster.mockRejectedValue(new Error("Monster name is required"));

    const response = await createPost(
      request({ kind: "monster", input: monsterInput })
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: "Monster name is required",
    });
    expect(mockTelemetryErrors).not.toHaveBeenCalled();
  });

  it("hides unauthorized or missing updates as not found", async () => {
    mockUpdateMonster.mockRejectedValue(new Error("Monster not found"));
    const input = {
      ...monsterInput,
      id,
      kind: "",
      legendary: false,
      minion: false,
      bloodied: "",
      lastStand: "",
      saves: [],
      moreInfo: "",
    };

    const response = await updatePost(request({ kind: "monster", input }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Bestiary entry not found",
    });
  });

  it("records unexpected failures and returns a generic 500", async () => {
    const error = new Error("SQLITE_BUSY secret storage details");
    mockCreateMonster.mockRejectedValue(error);

    const response = await createPost(
      request({ kind: "monster", input: monsterInput })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mockTelemetryErrors).toHaveBeenCalledWith(error);
  });
});
