import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockCreateAdventure,
  mockUpdateAdventure,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateAdventure: vi.fn(),
  mockUpdateAdventure: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/adventures", () => ({
  createAdventure: mockCreateAdventure,
  updateAdventure: mockUpdateAdventure,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));
vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({ setAttribute: vi.fn() })),
  },
}));

import { POST as createAdventurePost } from "./createAdventure/route";
import { POST as updateAdventurePost } from "./updateAdventure/route";

const adventureInput = {
  name: "Test Adventure",
  tagline: "",
  summary: "",
  visibility: "private",
  nodes: [],
};

const session = {
  user: { id: "owner", username: "creator" },
};

function request(body: unknown) {
  return new Request("http://localhost/_actions/adventure", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe("adventure mutation route invalidation", () => {
  it("revalidates owner and public profile lists after creation", async () => {
    mockCreateAdventure.mockResolvedValue({
      id: "new-adventure",
      name: adventureInput.name,
    });

    const response = await createAdventurePost(request(adventureInput));

    expect(response.status).toBe(201);
    expect(mockRevalidatePath.mock.calls).toEqual([
      ["/my/adventures"],
      ["/u/creator/adventures"],
    ]);
  });

  it("revalidates the dynamic detail page and lists after update", async () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    mockUpdateAdventure.mockResolvedValue({
      id,
      name: adventureInput.name,
    });

    const response = await updateAdventurePost(
      request({ id, adventure: adventureInput })
    );

    expect(response.status).toBe(200);
    expect(mockRevalidatePath.mock.calls).toEqual([
      ["/my/adventures"],
      ["/adventures/[id]", "page"],
      ["/u/creator/adventures"],
    ]);
  });

  it.each([
    "read-aloud",
    "optional",
    "rules",
  ])("accepts the %s callout presentation value", async (presentation) => {
    const input = {
      ...adventureInput,
      nodes: [
        {
          id: "callout-node",
          parentId: null,
          kind: "callout",
          orderIndex: 0,
          title: "A callout",
          content: "Callout content",
          encounterId: null,
          monsterIds: [],
          itemIds: [],
          missingStatblockCount: 0,
          presentation,
        },
      ],
    };
    mockCreateAdventure.mockResolvedValue({
      id: "new-adventure",
      name: input.name,
    });

    const response = await createAdventurePost(request(input));

    expect(response.status).toBe(201);
    expect(mockCreateAdventure).toHaveBeenCalledWith("owner", input);
  });
});
