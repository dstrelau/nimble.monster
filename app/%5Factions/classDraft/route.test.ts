import { trace } from "@opentelemetry/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  flag: vi.fn(),
  save: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/services/featureFlags", () => ({
  isFeatureFlagEnabled: mocks.flag,
}));
vi.mock("@/lib/services/classdrafts", () => ({ classDraftsService: mocks }));

import { DELETE, GET, POST } from "./route";

const classId = "fa32b802-8c9c-42ab-a561-bb57041bc0b3";
const updatedAt = new Date("2026-10-14T04:00:00Z");
function request(
  method: string,
  body: unknown = { classId: null, data: { name: "" } },
  headers: Record<string, string> = {}
) {
  return new Request(
    `https://nimble.nexus/_actions/classDraft${method === "GET" ? `?classId=${classId}` : ""}`,
    {
      method,
      headers: {
        origin: "https://nimble.nexus",
        "content-type": "application/json",
        ...headers,
      },
      ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
    }
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: "owner", discordId: "discord-owner" },
  });
  mocks.flag.mockResolvedValue(true);
  mocks.save.mockResolvedValue({ updatedAt });
  mocks.get.mockResolvedValue({
    data: { name: "Partial", nested: [null, 2, true] },
    updatedAt,
  });
});

describe("class draft route boundary", () => {
  it("round-trips incomplete JSON drafts and serializes only data and timestamp", async () => {
    const saved = await POST(
      request("POST", {
        classId,
        data: { name: "", nested: [null, 2, true] },
        userId: "victim",
      })
    );
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ updatedAt: updatedAt.toISOString() });
    expect(mocks.save).toHaveBeenCalledWith("discord-owner", classId, {
      name: "",
      nested: [null, 2, true],
    });
    const loaded = await GET(request("GET"));
    expect(await loaded.json()).toEqual({
      draft: {
        data: { name: "Partial", nested: [null, 2, true] },
        updatedAt: updatedAt.toISOString(),
      },
    });
    expect(loaded.headers.get("cache-control")).toBe("private, no-store");
    expect(loaded.headers.get("access-control-allow-origin")).toBeNull();
    expect(mocks.get).toHaveBeenCalledWith("discord-owner", classId);
    expect(await (await DELETE(request("DELETE", { classId }))).json()).toEqual(
      { success: true }
    );
    expect(mocks.delete).toHaveBeenCalledWith("discord-owner", classId);
  });

  it("supports missing new-class drafts and idempotent deletes", async () => {
    mocks.get.mockResolvedValue(null);
    expect(
      await (
        await GET(new Request("https://nimble.nexus/_actions/classDraft"))
      ).json()
    ).toEqual({ draft: null });
    expect(mocks.get).toHaveBeenCalledWith("discord-owner", null);
    for (let i = 0; i < 2; i++)
      expect((await DELETE(request("DELETE", { classId: null }))).status).toBe(
        200
      );
  });

  for (const [method, handler] of [
    ["GET", GET],
    ["POST", POST],
    ["DELETE", DELETE],
  ] as const) {
    it(`${method} requires session identity and the server-side feature flag`, async () => {
      mocks.auth.mockResolvedValue(null);
      expect((await handler(request(method))).status).toBe(401);
      mocks.auth.mockResolvedValue({
        user: { id: "owner", discordId: "discord-owner" },
      });
      mocks.flag.mockResolvedValue(false);
      expect((await handler(request(method))).status).toBe(403);
      expect(mocks.save).not.toHaveBeenCalled();
      expect(mocks.get).not.toHaveBeenCalled();
      expect(mocks.delete).not.toHaveBeenCalled();
    });

    it(`${method} rejects invalid identifiers and safely records unexpected errors`, async () => {
      const invalid =
        method === "GET"
          ? new Request(
              "https://nimble.nexus/_actions/classDraft?classId=invalid"
            )
          : request(method, { classId: "invalid", data: {} });
      expect((await handler(invalid)).status).toBe(400);
      const activeSpan = trace.wrapSpanContext({
        traceId: "a".repeat(32),
        spanId: "b".repeat(16),
        traceFlags: 0,
      });
      const recordException = vi.spyOn(activeSpan, "recordException");
      const span = vi.spyOn(trace, "getActiveSpan").mockReturnValue(activeSpan);
      mocks.flag.mockRejectedValue(new Error("secret database failure"));
      const failed = await handler(request(method));
      expect(failed.status).toBe(500);
      expect(await failed.json()).toEqual({ error: "Internal Server Error" });
      expect(recordException).toHaveBeenCalled();
      span.mockRestore();
    });
  }

  for (const [method, handler] of [
    ["POST", POST],
    ["DELETE", DELETE],
  ] as const) {
    it(`${method} checks origin/media before parsing and distinguishes malformed JSON`, async () => {
      expect(
        (await handler(request(method, {}, { origin: "https://evil.test" })))
          .status
      ).toBe(403);
      expect(
        (await handler(request(method, {}, { "content-type": "text/plain" })))
          .status
      ).toBe(415);
      expect(
        (
          await handler(
            new Request("https://nimble.nexus/_actions/classDraft", {
              method,
              headers: {
                origin: "https://nimble.nexus",
                "content-type": "application/json",
              },
              body: "{broken",
            })
          )
        ).status
      ).toBe(400);
      expect((await handler(request(method, {}))).status).toBe(400);
    });
  }

  it("rejects non-object draft data and reports a missing save identity", async () => {
    for (const data of [null, [], "text"])
      expect(
        (await POST(request("POST", { classId: null, data }))).status
      ).toBe(400);
    mocks.save.mockResolvedValue(null);
    expect((await POST(request("POST"))).status).toBe(404);
  });
});
