import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, findAncestry, toggleReaction, recordException } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    findAncestry: vi.fn(),
    toggleReaction: vi.fn(),
    recordException: vi.fn(),
  })
);
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/services/ancestries/repository", () => ({ findAncestry }));
vi.mock("@/lib/services/reactions", () => ({ toggleReaction }));
vi.mock("@/lib/telemetry", () => ({
  telemetry:
    (handler: (request: Request) => Promise<Response>) =>
    async (request: Request) => {
      try {
        return await handler(request);
      } catch (error) {
        recordException(error);
        throw error;
      }
    },
}));

import { POST } from "./route";

const entityId = "33333333-3333-3333-3333-333333333333";
const input = { entityType: "monster", entityId, reactionType: "thumbs_up" };
const summary = {
  counts: { thumbs_up: 3, thumbs_down: 1 },
  mine: ["thumbs_up"],
};
function request(body: unknown = input, headers: Record<string, string> = {}) {
  return new Request("https://nimble.nexus/_actions/toggleReaction", {
    method: "POST",
    headers: {
      origin: "https://nimble.nexus",
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  auth.mockResolvedValue({ user: { id: "owner", discordId: "not-owner" } });
  toggleReaction.mockResolvedValue(summary);
});

describe("POST /_actions/toggleReaction", () => {
  it.each([
    "monster",
    "item",
    "companion",
    "subclass",
    "class",
    "spellSchool",
    "background",
    "ancestry",
    "customRule",
    "collection",
    "adventure",
    "encounter",
  ])(
    "accepts %s and derives identity only from the session",
    async (entityType) => {
      findAncestry.mockResolvedValue({ id: entityId });
      const response = await POST(
        request({ ...input, entityType, userId: "attacker" })
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json"
      );
      expect(response.headers.has("access-control-allow-origin")).toBe(false);
      expect(await response.json()).toEqual({ success: true, data: summary });
      expect(toggleReaction).toHaveBeenCalledWith(
        entityType,
        entityId,
        "owner",
        "thumbs_up"
      );
    }
  );

  it("retains downvote support", async () => {
    await POST(request({ ...input, reactionType: "thumbs_down" }));
    expect(toggleReaction).toHaveBeenCalledWith(
      "monster",
      entityId,
      "owner",
      "thumbs_down"
    );
  });

  it("requires authentication", async () => {
    auth.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(toggleReaction).not.toHaveBeenCalled();
  });

  it("hides inaccessible ancestries without mutation", async () => {
    findAncestry.mockResolvedValue(null);
    const response = await POST(request({ ...input, entityType: "ancestry" }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Ancestry not found" });
    expect(toggleReaction).not.toHaveBeenCalled();
  });

  it.each([
    "{",
    { ...input, entityId: "invalid" },
    { ...input, entityType: "hazard" },
    { ...input, reactionType: "like" },
    {},
  ])("rejects malformed input %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(toggleReaction).not.toHaveBeenCalled();
  });

  it.each([
    [{ origin: "https://evil.example" }, 403],
    [{ origin: "" }, 403],
    [{ "content-type": "text/plain" }, 415],
  ] as const)("rejects unsafe boundary %j", async (headers, status) => {
    expect((await POST(request(input, headers))).status).toBe(status);
    expect(auth).not.toHaveBeenCalled();
    expect(toggleReaction).not.toHaveBeenCalled();
  });

  it("records unexpected failures without exposing internals", async () => {
    const error = new Error("database credentials");
    toggleReaction.mockRejectedValue(error);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(recordException).toHaveBeenCalledWith(error);
  });
});
