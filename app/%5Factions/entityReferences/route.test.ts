import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveEntityReferences } from "@/lib/services/entity-references";
import { GET } from "./route";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/entity-references", () => ({
  resolveEntityReferences: vi.fn(),
}));

describe("GET /_actions/entityReferences", () => {
  beforeEach(() => {
    vi.mocked(resolveEntityReferences).mockReset();
    mockAuth.mockReset();
  });

  it("returns plain JSON public metadata without HTTP caching or CORS", async () => {
    vi.mocked(resolveEntityReferences).mockResolvedValue([
      {
        type: "table",
        id: "00000000-0000-0000-0000-000000000001",
        name: "Treasure",
      },
    ]);
    const response = await GET(
      new Request(
        "http://localhost/_actions/entityReferences?reference=table:00000000000000000000000001&reference=rule:missing"
      )
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(resolveEntityReferences).toHaveBeenCalledWith(
      [
        { type: "table", id: "00000000000000000000000001" },
        { type: "rule", id: "missing" },
      ],
      undefined
    );
    expect(await response.json()).toEqual({
      references: [
        {
          type: "table",
          id: "00000000-0000-0000-0000-000000000001",
          name: "Treasure",
        },
      ],
    });
  });

  it.each([
    "",
    "reference=unknown:abc",
    "reference=item:",
    "reference=item",
    "reference=itemX",
    "reference=rule:../secrets",
    "reference=item:abc:extra",
    `reference=rule:${"a".repeat(101)}`,
    Array(51).fill("reference=rule:conditions").join("&"),
  ])("rejects invalid or oversized batches: %s", async (query) => {
    const response = await GET(
      new Request(`http://localhost/_actions/entityReferences?${query}`)
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(await response.json()).toEqual({
      error: "Provide 1–50 valid type:ID reference parameters.",
    });
    expect(resolveEntityReferences).not.toHaveBeenCalled();
  });

  it("resolves references as the signed-in user", async () => {
    vi.mocked(resolveEntityReferences).mockResolvedValue([]);
    mockAuth.mockResolvedValue({
      user: { id: "user-1", discordId: "discord-1" },
      expires: "",
    });
    await GET(
      new Request(
        "http://localhost/_actions/entityReferences?reference=item:00000000000000000000000001"
      )
    );
    expect(resolveEntityReferences).toHaveBeenCalledWith(
      [{ type: "item", id: "00000000000000000000000001" }],
      "user-1"
    );
  });

  it("accepts the batch-size boundary", async () => {
    vi.mocked(resolveEntityReferences).mockResolvedValue([]);
    const query = Array(50).fill("reference=rule:conditions").join("&");
    const response = await GET(
      new Request(`http://localhost/_actions/entityReferences?${query}`)
    );
    expect(response.status).toBe(200);
    expect(resolveEntityReferences).toHaveBeenCalledWith(
      Array(50).fill({ type: "rule", id: "conditions" }),
      undefined
    );
  });

  it("does not report database failures as missing public references", async () => {
    vi.mocked(resolveEntityReferences).mockRejectedValue(
      new Error("database unavailable")
    );
    const response = await GET(
      new Request(
        "http://localhost/_actions/entityReferences?reference=rule:conditions"
      )
    );
    expect(response.status).toBe(500);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
