import { beforeEach, describe, expect, it, vi } from "vitest";
import { MonsterArtworkInputError } from "@/lib/services/monster-artwork";
import type {
  CreateHazardInput,
  CreateMonsterInput,
} from "@/lib/services/monsters";

const {
  mockAuth,
  mockCreateHazard,
  mockCreateMonster,
  mockDeleteHazard,
  mockDeleteMonster,
  mockRevalidatePath,
  mockTelemetryErrors,
  mockUpdateHazard,
  mockUpdateMonster,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateHazard: vi.fn(),
  mockCreateMonster: vi.fn(),
  mockDeleteHazard: vi.fn(),
  mockDeleteMonster: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockTelemetryErrors: vi.fn(),
  mockUpdateHazard: vi.fn(),
  mockUpdateMonster: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/hazards", () => ({
  createHazard: mockCreateHazard,
  deleteHazard: mockDeleteHazard,
  updateHazard: mockUpdateHazard,
}));
vi.mock("@/lib/services/monsters", () => ({
  monstersService: {
    createMonster: mockCreateMonster,
    deleteMonster: mockDeleteMonster,
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
import { POST as deletePost } from "./deleteBestiaryEntry/route";
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
  ])(
    "updates a %s and invalidates its list and detail",
    async (kind, hazard, service, listPath, detailPath) => {
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
    }
  );

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

  it("returns artwork ownership validation failures as bad requests", async () => {
    const error = new MonsterArtworkInputError(
      "Artwork must be owned by you and ready"
    );
    mockCreateMonster.mockRejectedValue(error);
    mockUpdateMonster.mockRejectedValue(error);
    const create = await createPost(
      request({ kind: "monster", input: monsterInput })
    );
    const update = await updatePost(
      request({
        kind: "monster",
        input: {
          ...monsterInput,
          id,
          kind: "",
          legendary: false,
          minion: false,
          bloodied: "",
          lastStand: "",
          saves: [],
          moreInfo: "",
        },
      })
    );

    for (const response of [create, update]) {
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: error.message });
    }
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

describe.each(["monster", "hazard"])("delete %s route", (kind) => {
  const service = kind === "monster" ? mockDeleteMonster : mockDeleteHazard;
  const section = kind === "monster" ? "monsters" : "hazards";

  it("deletes only for the session owner and refreshes lists/detail", async () => {
    service.mockResolvedValue(true);
    const response = await deletePost(
      request({ id, kind, discordId: "attacker" })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ success: true });
    expect(service).toHaveBeenCalledWith(id, "discord-owner");
    expect(mockRevalidatePath.mock.calls).toEqual([
      [`/my/${section}`],
      [`/${section}`],
      [`/${section}/[id]`, "page"],
    ]);
  });

  it("hides missing, non-owned and wrong-kind records as 404", async () => {
    service.mockResolvedValue(false);
    const response = await deletePost(request({ id, kind }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Bestiary entry not found",
    });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it.each([null, { user: { id: "owner", discordId: "" } }])(
    "requires a full session",
    async (userSession) => {
      mockAuth.mockResolvedValue(userSession);
      const response = await deletePost(request({ id, kind }));
      expect(response.status).toBe(401);
      expect(service).not.toHaveBeenCalled();
    }
  );

  it.each(["{broken", { id: "bad", kind }, { id, kind: "item" }])(
    "rejects malformed input",
    async (body) => {
      const response = await deletePost(request(body));
      expect(response.status).toBe(400);
      expect(service).not.toHaveBeenCalled();
    }
  );

  it("rejects origin and media mismatches before authentication", async () => {
    expect(
      (await deletePost(request({ id, kind }, { origin: "https://evil.test" })))
        .status
    ).toBe(403);
    expect(
      (
        await deletePost(
          request({ id, kind }, { "content-type": "text/plain" })
        )
      ).status
    ).toBe(415);
    expect(mockAuth).not.toHaveBeenCalled();
    expect(service).not.toHaveBeenCalled();
  });

  it("records unexpected failures without leaking storage details", async () => {
    const error = new Error("SQLITE_BUSY secret");
    service.mockRejectedValue(error);
    const response = await deletePost(request({ id, kind }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mockTelemetryErrors).toHaveBeenCalledWith(error);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
