import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, createReport, recordException } = vi.hoisted(() => ({
  auth: vi.fn(),
  createReport: vi.fn(),
  recordException: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/services/reports", () => ({ createReport }));
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
const input = { entityType: "monster", entityId, reason: "spam", details: "" };
function request(body: unknown = input, headers: Record<string, string> = {}) {
  return new Request("https://nimble.nexus/_actions/reportEntity", {
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
  auth.mockResolvedValue({
    user: { id: "reporter", discordId: "not-reporter" },
  });
});

describe("POST /_actions/reportEntity", () => {
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
    "accepts %s with session-derived reporter identity",
    async (entityType) => {
      const response = await POST(
        request({ ...input, entityType, userId: "spoof" })
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json"
      );
      expect(response.headers.has("access-control-allow-origin")).toBe(false);
      expect(await response.json()).toEqual({ success: true });
      expect(createReport).toHaveBeenCalledWith(
        entityType,
        entityId,
        "reporter",
        "spam",
        ""
      );
    }
  );

  it.each(["inappropriate", "spam", "plagiarism", "inaccurate", "other"])(
    "preserves %s and unmodified optional details",
    async (reason) => {
      await POST(
        request({ ...input, reason, details: "  Multiline\n<not markup> 🐉  " })
      );
      expect(createReport).toHaveBeenCalledWith(
        "monster",
        entityId,
        "reporter",
        reason,
        "  Multiline\n<not markup> 🐉  "
      );
    }
  );

  it("requires authentication without persisting", async () => {
    auth.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(createReport).not.toHaveBeenCalled();
  });

  it.each([
    "{",
    {},
    null,
    { ...input, entityId: "invalid" },
    { ...input, entityType: "hazard" },
    { ...input, reason: "invalid" },
    { ...input, details: null },
    { ...input, details: 123 },
    { entityType: "monster", entityId, reason: "spam" },
  ])("rejects malformed input %j without persisting", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(createReport).not.toHaveBeenCalled();
  });

  it.each([
    [{ origin: "https://evil.example" }, 403],
    [{ origin: "" }, 403],
    [{ "content-type": "text/plain" }, 415],
  ] as const)(
    "rejects unsafe boundary %j before authentication",
    async (headers, status) => {
      expect((await POST(request(input, headers))).status).toBe(status);
      expect(auth).not.toHaveBeenCalled();
      expect(createReport).not.toHaveBeenCalled();
    }
  );

  it("records unexpected failures without exposing internals", async () => {
    const error = new Error("database credentials");
    createReport.mockRejectedValue(error);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(recordException).toHaveBeenCalledWith(error);
  });
});
